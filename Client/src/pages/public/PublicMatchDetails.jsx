import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { humanizeText } from "@/lib/utils";
import PublicHeader from "@/components/public/PublicHeader";
import LiveScoringPanel from "@/pages/match/components/LiveScoringPanel";

const ALLOWED_TABS = ["LIVE", "SCORECARD", "SQUADS", "POINTS"];
const resolveTab = (value) => {
  const normalized = String(value || "").toUpperCase();
  const mapped = normalized === "SQUAD" ? "SQUADS" : normalized;
  return ALLOWED_TABS.includes(mapped) ? mapped : "LIVE";
};

export default function PublicMatchDetails() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [match, setMatch] = useState(null);
  const [league, setLeague] = useState(null);
  const [score, setScore] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [commentary, setCommentary] = useState([]);
  const [pointsTable, setPointsTable] = useState([]);
  const [pointsTeamNames, setPointsTeamNames] = useState({});
  const [teamMetaById, setTeamMetaById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => resolveTab(searchParams.get("tab")));

  const getBallOrderValue = (ball) => {
    const seq = Number(ball?.ballSequence ?? ball?.sequence ?? 0);
    if (Number.isFinite(seq) && seq > 0) return seq;

    const timeCandidate = ball?.timestamp || ball?.createdAt || ball?.updatedAt;
    const millis = timeCandidate ? new Date(timeCandidate).getTime() : NaN;
    if (Number.isFinite(millis) && millis > 0) return millis;

    const objectId = String(ball?.id || ball?._id || "");
    if (/^[a-fA-F0-9]{24}$/.test(objectId)) {
      return parseInt(objectId.slice(0, 8), 16);
    }

    return 0;
  };

  const compareBallsDesc = (a, b) => {
    const inningsDiff = Number(b?.innings || 0) - Number(a?.innings || 0);
    if (inningsDiff !== 0) return inningsDiff;

    const overDiff = Number(b?.over || 0) - Number(a?.over || 0);
    if (overDiff !== 0) return overDiff;

    const ballDiff = Number(b?.ball || 0) - Number(a?.ball || 0);
    if (ballDiff !== 0) return ballDiff;

    const orderDiff = getBallOrderValue(b) - getBallOrderValue(a);
    if (orderDiff !== 0) return orderDiff;

    return Number(b?.ballSequence || b?.timestamp || 0) - Number(a?.ballSequence || a?.timestamp || 0);
  };

  const handleTabChange = (tab) => {
    const nextTab = resolveTab(tab);
    setActiveTab(nextTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", nextTab);
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    fetchMatchData();
  }, [matchId]);

  useEffect(() => {
    const tabFromUrl = resolveTab(searchParams.get("tab"));
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const normalizeScore = (scoreboardScore, matchScore, matchData) => {
    const base = scoreboardScore || matchScore;
    if (!base) return null;

    const team1Id = matchScore?.team1Id || scoreboardScore?.teamA?.id || matchData?.team1?.id || null;
    const team2Id = matchScore?.team2Id || scoreboardScore?.teamB?.id || matchData?.team2?.id || null;

    const normalized = {
      ...scoreboardScore,
      ...matchScore,
      status:
        scoreboardScore?.status ||
        matchScore?.matchStatus ||
        matchScore?.status ||
        matchData?.status ||
        "",
      teamA: {
        id: scoreboardScore?.teamA?.id || team1Id,
        name: scoreboardScore?.teamA?.name || matchData?.team1?.name || "Team A",
        runs: scoreboardScore?.teamA?.runs ?? matchScore?.team1Runs ?? 0,
        wickets: scoreboardScore?.teamA?.wickets ?? matchScore?.team1Wickets ?? 0,
        overs: scoreboardScore?.teamA?.overs ?? matchScore?.team1Overs ?? "0.0",
        logoUrl: scoreboardScore?.teamA?.logoUrl || matchData?.team1?.logoUrl || null,
      },
      teamB: {
        id: scoreboardScore?.teamB?.id || team2Id,
        name: scoreboardScore?.teamB?.name || matchData?.team2?.name || "Team B",
        runs: scoreboardScore?.teamB?.runs ?? matchScore?.team2Runs ?? 0,
        wickets: scoreboardScore?.teamB?.wickets ?? matchScore?.team2Wickets ?? 0,
        overs: scoreboardScore?.teamB?.overs ?? matchScore?.team2Overs ?? "0.0",
        logoUrl: scoreboardScore?.teamB?.logoUrl || matchData?.team2?.logoUrl || null,
      },
      playingXI:
        scoreboardScore?.playingXI ||
        {
          ...(team1Id && matchScore?.team1PlayingXI ? { [team1Id]: matchScore.team1PlayingXI } : {}),
          ...(team2Id && matchScore?.team2PlayingXI ? { [team2Id]: matchScore.team2PlayingXI } : {}),
        },
      strikerId: matchScore?.strikerId || scoreboardScore?.live?.striker?.id || null,
      nonStrikerId: matchScore?.nonStrikerId || scoreboardScore?.live?.nonStriker?.id || null,
      currentBowlerId: matchScore?.currentBowlerId || scoreboardScore?.live?.bowler?.id || null,
      team1OutBatters: matchScore?.team1OutBatters || [],
      team2OutBatters: matchScore?.team2OutBatters || [],
      battingTeamId: matchScore?.battingTeamId || scoreboardScore?.live?.battingTeamId || null,
    };

    return normalized;
  };

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const matchRes = await api.get(`/api/matches/${matchId}`);
      const matchData = matchRes.data;
      setMatch(matchData);

      const isValidTeamId = (value) =>
        typeof value === "string" && /^[a-f0-9]{24}$/i.test(value.trim());

      const matchTeamIds = [...new Set(
        [
          matchData?.team1?.id,
          matchData?.team2?.id,
          matchData?.team1Id,
          matchData?.team2Id,
        ].filter((id) => isValidTeamId(id))
      )];

      if (matchTeamIds.length > 0) {
        const entries = await Promise.all(
          matchTeamIds.map(async (id) => {
            try {
              const res = await api.get(`/api/teams/${id}/details`);
              return [id, { name: res?.data?.name || null, logoUrl: res?.data?.logoUrl || null }];
            } catch {
              return [id, { name: null, logoUrl: null }];
            }
          })
        );
        setTeamMetaById((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      }

      const requests = [
        api.get(`/api/match/scoreboard/${matchId}`).catch(() => null),
        api.get(`/api/match/score/${matchId}`).catch(() => null),
        api.get(`/api/match-player-stats/match/${matchId}`).catch(() => null),
        api.get(`/api/ball-by-ball/match/${matchId}`).catch(() => null),
      ];

      if (matchData?.leagueId) {
        requests.push(api.get(`/api/leagues/${matchData.leagueId}`).catch(() => null));
        requests.push(api.get(`/api/points/${matchData.leagueId}`).catch(() => null));
      }

      const [scoreboardRes, scoreRes, statsRes, ballRes, leagueRes, pointsRes] = await Promise.all(requests);
      const normalizedScore = normalizeScore(scoreboardRes?.data ?? null, scoreRes?.data ?? null, matchData);
      const statsData = Array.isArray(statsRes?.data) ? statsRes.data : [];
      const commentaryData = Array.isArray(ballRes?.data)
        ? [...ballRes.data].sort(compareBallsDesc)
        : [];

      const scoreTeamIds = [...new Set(
        [normalizedScore?.teamA?.id, normalizedScore?.teamB?.id].filter((id) => isValidTeamId(id))
      )];
      const unresolvedScoreTeamIds = scoreTeamIds.filter((id) => !teamMetaById[id]);
      if (unresolvedScoreTeamIds.length > 0) {
        const entries = await Promise.all(
          unresolvedScoreTeamIds.map(async (id) => {
            try {
              const res = await api.get(`/api/teams/${id}/details`);
              return [id, { name: res?.data?.name || null, logoUrl: res?.data?.logoUrl || null }];
            } catch {
              return [id, { name: null, logoUrl: null }];
            }
          })
        );
        setTeamMetaById((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      }

      setScore(normalizedScore);
      setPlayerStats(normalizedScore ? statsData : []);
      setCommentary(normalizedScore ? commentaryData : []);
      setLeague(leagueRes?.data || null);
      const pointsData = pointsRes?.data || [];
      setPointsTable(pointsData);

      const idCandidates = [...new Set(
        pointsData
          .map((row) => row.teamId || row.teamName || row.team)
          .filter(Boolean)
      )];

      const teamNameMap = {};
      await Promise.all(
        idCandidates.map(async (idOrName) => {
          try {
            const teamRes = await api.get(`/api/teams/${idOrName}/details`);
            const resolvedName = teamRes?.data?.name;
            if (resolvedName) {
              teamNameMap[idOrName] = resolvedName;
            }
          } catch {
            // Keep original value if lookup fails.
          }
        })
      );
      setPointsTeamNames(teamNameMap);
    } catch (err) {
      console.error("Error fetching public match data:", err);
      setScore(null);
      setPlayerStats([]);
      setCommentary([]);
      setError(err?.response?.data?.message || err.message || "Failed to load match");
    } finally {
      setLoading(false);
    }
  };

  const formatOverBall = (over, ball) => `${over}.${ball}`;
  const getInitials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const statusRaw = String(score?.status || match?.status || "")
    .toUpperCase()
    .replace(/_/g, " ");
  const isUpcoming = statusRaw === "NOT_STARTED" || statusRaw === "UPCOMING";
  const isLive = statusRaw.includes("IN PROGRESS") || statusRaw === "LIVE";
  const isCompleted = statusRaw === "COMPLETED";
  const showDetailedSquads = isLive || isCompleted;

  const team1Id = match?.team1?.id || score?.teamA?.id || match?.team1Id || score?.team1Id || "";
  const team2Id = match?.team2?.id || score?.teamB?.id || match?.team2Id || score?.team2Id || "";

  const teamAName =
    match?.team1?.name ||
    score?.teamA?.name ||
    teamMetaById[team1Id]?.name ||
    "Team A";
  const teamBName =
    match?.team2?.name ||
    score?.teamB?.name ||
    teamMetaById[team2Id]?.name ||
    "Team B";
  const teamALogo =
    score?.teamA?.logoUrl ||
    match?.team1?.logoUrl ||
    teamMetaById[team1Id]?.logoUrl ||
    null;
  const teamBLogo =
    score?.teamB?.logoUrl ||
    match?.team2?.logoUrl ||
    teamMetaById[team2Id]?.logoUrl ||
    null;

  const team1FullSquad = match?.team1?.squad || [];
  const team2FullSquad = match?.team2?.squad || [];

  const resolvePlayingXI = (teamId, flatKey, squad) => {
    const fromScoreboard = score?.playingXI?.[teamId];
    if (Array.isArray(fromScoreboard) && fromScoreboard.length > 0) {
      if (typeof fromScoreboard[0] === "string") {
        const playerById = Object.fromEntries(squad.map((p) => [p.id, p]));
        return fromScoreboard.map((id) => playerById[id]).filter(Boolean);
      }
      return fromScoreboard;
    }

    const fromFlat = score?.[flatKey];
    if (Array.isArray(fromFlat) && fromFlat.length > 0) {
      if (typeof fromFlat[0] === "string") {
        const playerById = Object.fromEntries(squad.map((p) => [p.id, p]));
        return fromFlat.map((id) => playerById[id]).filter(Boolean);
      }
      return fromFlat;
    }

    return [];
  };

  const team1PlayingXI = resolvePlayingXI(team1Id, "team1PlayingXI", team1FullSquad);
  const team2PlayingXI = resolvePlayingXI(team2Id, "team2PlayingXI", team2FullSquad);
  const team1SquadIds = new Set(team1FullSquad.map((p) => p.id));
  const team2SquadIds = new Set(team2FullSquad.map((p) => p.id));

  const team1PlayingXIIds = new Set(team1PlayingXI.map((p) => p.id));
  const team2PlayingXIIds = new Set(team2PlayingXI.map((p) => p.id));

  const team1Bench = team1FullSquad.filter((p) => !team1PlayingXIIds.has(p.id));
  const team2Bench = team2FullSquad.filter((p) => !team2PlayingXIIds.has(p.id));

  const buildSupportStaff = (team, prefix) => [
    {
      id: `${prefix}-coach`,
      name: team?.coach || "-",
      role: "Head Coach",
    },
  ];

  const team1SupportStaff = buildSupportStaff(match?.team1, "t1");
  const team2SupportStaff = buildSupportStaff(match?.team2, "t2");

  const buildRows = (leftList, rightList) =>
    Array.from(
      { length: Math.max(leftList.length, rightList.length) },
    (_, idx) => ({
      left: leftList[idx] || null,
      right: rightList[idx] || null,
      key: `${leftList[idx]?.id || "l"}-${rightList[idx]?.id || "r"}-${idx}`,
    })
  );

  const fullSquadRows = buildRows(team1FullSquad, team2FullSquad);
  const playingXIRows = buildRows(team1PlayingXI, team2PlayingXI);
  const benchRows = buildRows(team1Bench, team2Bench);
  const supportStaffRows = buildRows(team1SupportStaff, team2SupportStaff);
  const hasPlayingXI = team1PlayingXI.length > 0 || team2PlayingXI.length > 0;
  const primarySquadRows = !showDetailedSquads
    ? fullSquadRows
    : playingXIRows;

  const allPlayers = [...(match?.team1?.squad || []), ...(match?.team2?.squad || [])];
  const playerNameMap = allPlayers
    .reduce((acc, p) => {
      acc[p.id] = p.name;
      return acc;
    }, {});
  const playerById = allPlayers.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const getPlayerName = (playerId) => {
    if (!playerId) return "Unknown";
    return playerNameMap[playerId] || "Unknown";
  };

  const renderPlayerLink = (playerId, fallbackName) => {
    const player = playerById[playerId];
    const label = fallbackName || player?.name || "-";
    if (!playerId) return label;
    return (
      <Link
        to={`/players/${playerId}?matchId=${matchId}`}
        state={{ player }}
        className="text-blue-400 hover:text-blue-300 hover:underline"
      >
        {label}
      </Link>
    );
  };

  const getBallCommentaryText = (ball) => {
    const bowler = getPlayerName(ball?.bowlerId);
    const batter = getPlayerName(ball?.batterId);
    const wicketType = String(ball?.wicketType || "").toUpperCase();
    const extraType = String(ball?.extraType || "").toUpperCase();
    const getNoBallTotalRuns = () => {
      const batRuns = Number(ball?.runs || ball?.runningRuns || 0);
      const boundaryRuns = Number(ball?.boundaryRuns || 0);
      const extraRuns = Number(ball?.extraRuns || 0);
      const overthrowRuns = ball?.overthrowBoundary ? 4 : 0;
      return 1 + batRuns + boundaryRuns + extraRuns + overthrowRuns;
    };

    const runningRuns = Number(ball?.runningRuns || 0);

    if (extraType === "NO_BALL" || extraType === "NB") {
      const totalRuns = getNoBallTotalRuns();
      const runOutText =
        ball?.wicket && wicketType === "RUN_OUT"
          ? " + Run Out"
          : "";
      return `${bowler} to ${batter}, NB + ${totalRuns} run${totalRuns > 1 ? "s" : ""}${runOutText}`;
    }

    if (ball?.wicket && wicketType === "RUN_OUT") {
      const runs = Number(ball?.runs || ball?.boundaryRuns || 0);
      if (runs > 0) {
        return `${bowler} to ${batter}, ${runs} run${runs > 1 ? "s" : ""} + Run Out`;
      }
      return `${bowler} to ${batter}, Run Out`;
    }

    if (extraType === "LEG_BYE" || extraType === "LB") {
      const runs = Number(ball?.extraRuns ?? ball?.runs ?? 0);
      return `${bowler} to ${batter}, ${runs} run${runs > 1 ? "s" : ""} leg bye`;
    }

    if (extraType === "BYE" || extraType === "B") {
      const runs = Number(ball?.extraRuns ?? ball?.runs ?? 0);
      return `${bowler} to ${batter}, ${runs} run${runs > 1 ? "s" : ""} bye`;
    }

    if (ball?.commentary) return ball.commentary;

    if (ball?.wicket) {
      return `${bowler} to ${batter}, OUT! ${humanizeText(ball.wicketType || "Wicket")}`;
    }

    if (Number(ball?.boundaryRuns) === 6) {
      return `${bowler} to ${batter}, SIX!`;
    }

    if (Number(ball?.boundaryRuns) === 4 && runningRuns > 0) {
      const totalRuns = 4 + runningRuns;
      return `${bowler} to ${batter}, FOUR + ${runningRuns} run${runningRuns > 1 ? "s" : ""} (Total ${totalRuns})`;
    }

    if (Number(ball?.boundaryRuns) === 4) {
      return `${bowler} to ${batter}, FOUR!`;
    }

    if (ball?.extraType === "WIDE") {
      const extra = Number(ball?.extraRuns ?? 1);
      return `${bowler} to ${batter}, WIDE${extra > 1 ? ` +${extra}` : ""}`;
    }

    const runs = Number(ball?.runs || 0);
    if (runs > 0) {
      return `${bowler} to ${batter}, ${runs} run${runs > 1 ? "s" : ""}`;
    }

    return `${bowler} to ${batter}, no run`;
  };

  const getCommentaryBadge = (ball) => {
    if (ball?.wicket) return "W";
    if (Number(ball?.boundaryRuns) === 6) return "6";
    if (Number(ball?.boundaryRuns) === 4) return "4";
    return null;
  };

  const getCommentaryBadgeColor = (badge) => {
    if (badge === "6") return "bg-purple-500";
    if (badge === "4") return "bg-blue-500";
    if (badge === "W") return "bg-red-500";
    return "";
  };

  const buildCommentaryWithBreak = () => {
    const sorted = [...commentary].sort(compareBallsDesc);

    const result = [];
    let lastInnings = null;

    sorted.forEach((ball) => {
      const currentInnings = Number(ball?.innings || 0);
      if (lastInnings !== null && currentInnings !== lastInnings) {
        result.push({ type: "INNINGS_BREAK", innings: lastInnings });
      }
      result.push(ball);
      lastInnings = currentInnings;
    });

    return result;
  };

  const bowlingStats = playerStats
    .filter((s) => s.overs > 0 || s.ballsBowled > 0 || s.wickets > 0 || s.runsConceded > 0)
    .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);

  const isTournament = league?.leagueType?.toUpperCase() === "TOURNAMENT";

  const belongsToTeam = (stat, teamId, squadIds) => {
    if (stat.teamId) return stat.teamId === teamId;
    return squadIds.has(stat.playerId);
  };

  const getDismissalText = (stat) => {
    if (!stat?.out) return "not out";

    const bowler = stat?.bowlerId ? getPlayerName(stat.bowlerId) : "";
    const fielder = stat?.fielderId ? getPlayerName(stat.fielderId) : "";

    switch (String(stat?.dismissalType || "").toUpperCase()) {
      case "CAUGHT":
        return `c ${fielder} b ${bowler}`.trim();
      case "BOWLED":
        return `b ${bowler}`.trim();
      case "LBW":
        return `lbw b ${bowler}`.trim();
      case "STUMPED":
        return `st ${fielder} b ${bowler}`.trim();
      case "RUN_OUT":
        return `run out (${fielder || "direct hit"})`;
      default:
        return humanizeText(stat?.dismissalType) || "out";
    }
  };

  const getInningsOrderIds = () => {
    const firstTeamId = score?.team1Id || team1Id;
    const secondTeamId = score?.team2Id || team2Id;

    if (!firstTeamId || !secondTeamId) {
      return [team1Id, team2Id];
    }

    const tossWinner = score?.tossWinner;
    const tossDecision = String(score?.tossDecision || "").toUpperCase();

    if (!tossWinner || !tossDecision) {
      return [firstTeamId, secondTeamId];
    }

    const other = tossWinner === firstTeamId ? secondTeamId : firstTeamId;
    const innings1 = tossDecision === "BAT" ? tossWinner : other;
    const innings2 = innings1 === firstTeamId ? secondTeamId : firstTeamId;

    return [innings1, innings2];
  };

  const buildBattingList = (teamId, playingXIList, strikerId, nonStrikerId, squadIds) => {
    const visible = playerStats.filter(
      (s) =>
        belongsToTeam(s, teamId, squadIds)
        && (
          (s.runs || 0) > 0
          || (s.balls || 0) > 0
          || s.out
          || s.playerId === strikerId
          || s.playerId === nonStrikerId
        )
    );

    const byId = new Map(visible.map((s) => [s.playerId, s]));

    [strikerId, nonStrikerId].forEach((id) => {
      if (id && !byId.has(id)) {
        byId.set(id, {
          playerId: id,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          out: false,
        });
      }
    });

    const battingOrder = new Map(
      (playingXIList || []).map((p, idx) => [p.id, idx])
    );

    return [...byId.values()].sort((a, b) => {
      const aIdx = battingOrder.has(a.playerId)
        ? battingOrder.get(a.playerId)
        : Number.MAX_SAFE_INTEGER;
      const bIdx = battingOrder.has(b.playerId)
        ? battingOrder.get(b.playerId)
        : Number.MAX_SAFE_INTEGER;

      if (aIdx !== bIdx) return aIdx - bIdx;
      return getPlayerName(a.playerId).localeCompare(getPlayerName(b.playerId));
    });
  };

  const renderTeamScorecard = ({
    teamId,
    teamName,
    teamScore,
    battingList,
    bowlingList,
    playingXIList,
    strikerId,
    nonStrikerId,
    outBatterIds,
  }) => {
    const battedIds = new Set(
      battingList
        .filter(
          (s) =>
            (s.balls || 0) > 0
            || s.out
            || s.playerId === strikerId
            || s.playerId === nonStrikerId
        )
        .map((s) => s.playerId)
    );
    const didNotBat = playingXIList.filter((p) => !battedIds.has(p.id));
    const inningsBalls = commentary
      .filter((b) => (b.battingTeamId || b.teamId) === teamId)
      .sort((a, b) => {
        if ((a.innings || 0) !== (b.innings || 0)) return (a.innings || 0) - (b.innings || 0);
        if ((a.over || 0) !== (b.over || 0)) return (a.over || 0) - (b.over || 0);
        if ((a.ball || 0) !== (b.ball || 0)) return (a.ball || 0) - (b.ball || 0);
        return Number(a.ballSequence || a.timestamp || 0) - Number(b.ballSequence || b.timestamp || 0);
      });

    const getBallTotalRuns = (ball) => {
      const extraType = String(ball?.extraType || "").toUpperCase();
      const isWide = extraType === "WIDE" || extraType === "WD";
      const isNoBall = extraType === "NO_BALL" || extraType === "NB";
      const isBye = extraType === "BYE" || extraType === "B";
      const isLegBye = extraType === "LEG_BYE" || extraType === "LB";

      let total = 0;

      if (isWide || isNoBall) {
        total += 1;
      }

      if (!isWide && !isBye && !isLegBye) {
        total += Number(ball?.runs || 0);
      }

      total += Number(ball?.boundaryRuns || 0);
      total += Number(ball?.extraRuns || 0);

      if (ball?.overthrowBoundary) {
        total += 4;
      }

      return total;
    };

    const extras = {
      byes: inningsBalls
        .filter((b) => ["BYE", "B"].includes(b.extraType))
        .reduce((sum, b) => sum + (b.extraRuns || b.runs || 0), 0),
      legByes: inningsBalls
        .filter((b) => ["LEG_BYE", "LB"].includes(b.extraType))
        .reduce((sum, b) => sum + (b.extraRuns || b.runs || 0), 0),
      wides: inningsBalls
        .filter((b) => b.extraType === "WIDE")
        .reduce((sum, b) => sum + 1 + (b.extraRuns || 0), 0),
      noBalls: inningsBalls
        .filter((b) => b.extraType === "NO_BALL")
        .reduce((sum, b) => sum + 1 + (b.extraRuns || 0), 0),
    };
    const totalExtras = extras.byes + extras.legByes + extras.wides + extras.noBalls;

    const fallOfWickets = [];
    let cumulativeRuns = 0;
    let cumulativeWickets = 0;

    inningsBalls.forEach((ball) => {
      cumulativeRuns += getBallTotalRuns(ball);

      if (ball?.wicket) {
        cumulativeWickets += 1;
        fallOfWickets.push({
          player: getPlayerName(ball.outBatterId || ball.batterId),
          score: `${cumulativeRuns}-${cumulativeWickets}`,
          over: `${ball.over}.${ball.ball}`,
        });
      }
    });

    const outBatters = (outBatterIds || [])
      .map((id) => playerById[id])
      .filter(Boolean);

    return (
      <div className="rounded-lg overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-3 flex items-center justify-between">
          <p className="font-bold text-lg">{teamName}</p>
          <p className="font-bold text-lg">
            {teamScore?.runs ?? 0}-{teamScore?.wickets ?? 0} ({teamScore?.overs ?? "0.0"} Ov)
          </p>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm bg-white">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left py-2 px-3">Batter</th>
                <th className="text-left py-2 px-3">Dismissal</th>
                <th className="text-center py-2 px-3">R</th>
                <th className="text-center py-2 px-3">B</th>
                <th className="text-center py-2 px-3">4s</th>
                <th className="text-center py-2 px-3">6s</th>
                <th className="text-center py-2 px-3">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {battingList.map((stat, idx) => (
                <tr key={`${teamId}-bat-${stat.playerId}-${idx}`} className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                  <td className="py-2 px-3">
                    {renderPlayerLink(stat.playerId, playerNameMap[stat.playerId] || stat.playerId)}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-600">
                    {getDismissalText(stat)}
                  </td>
                  <td className="text-center py-2 px-3 font-semibold">{stat.runs}</td>
                  <td className="text-center py-2 px-3">{stat.balls}</td>
                  <td className="text-center py-2 px-3">{stat.fours}</td>
                  <td className="text-center py-2 px-3">{stat.sixes}</td>
                  <td className="text-center py-2 px-3">{stat.strikeRate?.toFixed(2) || "-"}</td>
                </tr>
              ))}
              {battingList.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500">
                    No batting data yet
                  </td>
                </tr>
              )}

              {totalExtras > 0 && (
                <tr className="border-b bg-gray-50">
                  <td className="py-2 px-3 font-semibold text-black">Extras</td>
                  <td className="py-2 px-3 text-xs text-gray-600">
                    {extras.byes > 0 ? `b ${extras.byes}` : ""}
                    {extras.legByes > 0 ? `${extras.byes > 0 ? ", " : ""}lb ${extras.legByes}` : ""}
                    {extras.wides > 0 ? `${extras.byes > 0 || extras.legByes > 0 ? ", " : ""}w ${extras.wides}` : ""}
                    {extras.noBalls > 0 ? `${extras.byes > 0 || extras.legByes > 0 || extras.wides > 0 ? ", " : ""}nb ${extras.noBalls}` : ""}
                  </td>
                  <td className="text-center py-2 px-3 font-bold text-black">{totalExtras}</td>
                  <td colSpan="4" />
                </tr>
              )}

              <tr className="bg-gray-100 border-b font-bold text-black">
                <td className="py-2 px-3">Total</td>
                <td className="py-2 px-3"></td>
                <td className="text-center py-2 px-3">
                  {teamScore?.runs ?? 0}-{teamScore?.wickets ?? 0}
                </td>
                <td colSpan="4" className="py-2 px-3 text-right text-xs">
                  ({teamScore?.overs ?? "0.0"} Overs)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {didNotBat.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 text-sm text-gray-700 bg-white">
            <span className="font-semibold text-black">Did not Bat:</span>{" "}
            {didNotBat.map((p, i) => (
              <span key={`${teamId}-dnb-${p.id}`}>
                {renderPlayerLink(p.id, p.name)}
                {i < didNotBat.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        )}

        {outBatters.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 text-sm text-gray-700 bg-white">
            <span className="font-semibold text-black">Out Batters:</span>{" "}
            {outBatters.map((p, i) => (
              <span key={`${teamId}-out-${p.id}`}>
                {renderPlayerLink(p.id, p.name)}
                {i < outBatters.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm bg-white">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left py-2 px-3">Bowler</th>
                <th className="text-center py-2 px-3">O</th>
                <th className="text-center py-2 px-3">M</th>
                <th className="text-center py-2 px-3">R</th>
                <th className="text-center py-2 px-3">W</th>
                <th className="text-center py-2 px-3">NB</th>
                <th className="text-center py-2 px-3">WD</th>
                <th className="text-center py-2 px-3">ECO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bowlingList.map((stat, idx) => (
                <tr key={`${teamId}-bowl-${stat.playerId}-${idx}`} className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}>
                  <td className="py-2 px-3">
                    {renderPlayerLink(stat.playerId, playerNameMap[stat.playerId] || stat.playerId)}
                  </td>
                  <td className="text-center py-2 px-3">{stat.overs}</td>
                  <td className="text-center py-2 px-3">{stat.maidens || 0}</td>
                  <td className="text-center py-2 px-3">{stat.runsConceded}</td>
                  <td className="text-center py-2 px-3 font-semibold">{stat.wickets}</td>
                  <td className="text-center py-2 px-3">{stat.noBalls || 0}</td>
                  <td className="text-center py-2 px-3">{stat.wides || 0}</td>
                  <td className="text-center py-2 px-3">{stat.economy?.toFixed(2) || "-"}</td>
                </tr>
              ))}
              {bowlingList.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-500">
                    No bowling data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {fallOfWickets.length > 0 && (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="text-left py-2 px-3">Fall of Wickets</th>
                  <th className="text-left py-2 px-3">Score</th>
                  <th className="text-left py-2 px-3">Over</th>
                </tr>
              </thead>
              <tbody>
                {fallOfWickets.map((w, idx) => (
                  <tr key={`${teamId}-fow-${idx}`} className="border-b">
                    <td className="py-2 px-3 text-blue-600">{w.player}</td>
                    <td className="py-2 px-3">{w.score}</td>
                    <td className="py-2 px-3">{w.over}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <PublicHeader active="live" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-8 text-center text-slate-600">
              Loading match details...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-slate-100">
        <PublicHeader active="live" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <p className="text-red-400 mb-4">{error || "Match not found."}</p>
              <Button onClick={() => navigate("/")}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <PublicHeader active="live" />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="mb-6">
          <Button variant="outline" className="mb-4 border-slate-300 bg-white text-slate-800" onClick={() => navigate("/")}>
            Back to Matches
          </Button>

          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              {teamAName} vs {teamBName}
            </h1>

            <div className="mt-2 grid md:grid-cols-3 gap-2 text-slate-600 text-sm">
              <p><span className="font-semibold text-slate-700">Series:</span> {league?.name || "League Match"}</p>
              <p><span className="font-semibold text-slate-700">Venue:</span> {match?.venue || "TBD"}</p>
              <p>
                <span className="font-semibold text-slate-700">Date & Time:</span>{" "}
                {match?.scheduledDate ? new Date(match.scheduledDate).toLocaleString() : "TBD"}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="flex flex-col items-center gap-1 min-w-[140px]">
                {teamALogo ? (
                  <img
                    src={teamALogo}
                    alt={teamAName}
                    className="h-14 w-14 rounded-full object-contain border border-slate-300"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-slate-200 border border-slate-300" />
                )}
                <p className="font-semibold text-slate-900 text-sm text-center">{teamAName}</p>
                <p className="text-lg font-bold text-slate-900 text-center">
                  {score ? `${score?.teamA?.runs ?? 0}/${score?.teamA?.wickets ?? 0}` : "-/-"}
                  {score && (
                    <span className="text-sm font-semibold text-slate-500">
                      {" "}({score?.teamA?.overs ?? "0.0"} Ov)
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <p className="text-xl font-bold text-slate-700">VS</p>
                <div className="flex items-center gap-4">
                  {isUpcoming && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded font-semibold">
                      UPCOMING
                    </span>
                  )}
                  {isLive && (
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs rounded font-semibold animate-pulse">
                      LIVE
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded font-semibold">
                      COMPLETED
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 min-w-[140px]">
                {teamBLogo ? (
                  <img
                    src={teamBLogo}
                    alt={teamBName}
                    className="h-14 w-14 rounded-full object-contain border border-slate-300"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-slate-200 border border-slate-300" />
                )}
                <p className="font-semibold text-slate-900 text-sm text-center">{teamBName}</p>
                <p className="text-lg font-bold text-slate-900 text-center">
                  {score ? `${score?.teamB?.runs ?? 0}/${score?.teamB?.wickets ?? 0}` : "-/-"}
                  {score && (
                    <span className="text-sm font-semibold text-slate-500">
                      {" "}({score?.teamB?.overs ?? "0.0"} Ov)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border-b border-slate-200 rounded-t-lg">
            <div className="flex gap-6 px-4 overflow-x-auto">
              <button
                onClick={() => handleTabChange("LIVE")}
                className={`py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                  activeTab === "LIVE"
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                LIVE
              </button>
            <button
              onClick={() => handleTabChange("SCORECARD")}
              className={`py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                activeTab === "SCORECARD"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              SCORECARD
            </button>
            <button
              onClick={() => handleTabChange("SQUADS")}
              className={`py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                activeTab === "SQUADS"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              SQUADS
            </button>
            {isTournament && (
              <button
                onClick={() => handleTabChange("POINTS")}
                className={`py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                  activeTab === "POINTS"
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                POINTS
              </button>
            )}
          </div>
          </div>

          {activeTab === "SCORECARD" && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6 space-y-6">
                {(() => {
                  const [firstInningsTeamId, secondInningsTeamId] = getInningsOrderIds();

                  const getTeamView = (id) => {
                    const isTeam1 = id === team1Id;
                    const playingXIList = isTeam1 ? team1PlayingXI : team2PlayingXI;
                    const squadIds = isTeam1 ? team1SquadIds : team2SquadIds;
                    const currentStrikerId = score?.battingTeamId === id ? score?.strikerId : null;
                    const currentNonStrikerId = score?.battingTeamId === id ? score?.nonStrikerId : null;

                    return {
                      teamId: id,
                      teamName: isTeam1 ? teamAName : teamBName,
                      teamScore: isTeam1 ? score?.teamA : score?.teamB,
                      battingList: buildBattingList(
                        id,
                        playingXIList,
                        currentStrikerId,
                        currentNonStrikerId,
                        squadIds
                      ),
                      bowlingList: bowlingStats
                        .filter((s) => !belongsToTeam(s, id, squadIds))
                        .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy),
                      playingXIList,
                      strikerId: currentStrikerId,
                      nonStrikerId: currentNonStrikerId,
                      outBatterIds: isTeam1 ? (score?.team1OutBatters || []) : (score?.team2OutBatters || []),
                    };
                  };

                  const firstView = getTeamView(firstInningsTeamId);
                  const secondView = getTeamView(secondInningsTeamId);
                  const scorecardViews = [firstView];

                  if (
                    secondInningsTeamId
                    && secondInningsTeamId !== firstInningsTeamId
                  ) {
                    scorecardViews.push(secondView);
                  }

                  return (
                    <>
                      {scorecardViews.map((view) => (
                        <div key={`scorecard-${view.teamId || view.teamName}`}>
                          {renderTeamScorecard(view)}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {activeTab === "LIVE" && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <LiveScoringPanel
                  matchDetails={match}
                  matchScore={score}
                  allStats={playerStats}
                  commentary={commentary}
                  showBallInput={false}
                  renderPlayerName={(playerId, fallbackName) => renderPlayerLink(playerId, fallbackName)}
                />

                <h3 className="font-semibold text-sm text-slate-900">Live Commentary</h3>

                {commentary.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto rounded-md border border-slate-200 bg-white">
                    {buildCommentaryWithBreak().map((ball, idx) => {
                      if (ball?.type === "INNINGS_BREAK") {
                        return (
                          <div
                            key={`break-${idx}`}
                            className="bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700 border-b border-t border-slate-200"
                          >
                            First Innings Completed
                          </div>
                        );
                      }

                      const badge = getCommentaryBadge(ball);
                      const badgeColor = getCommentaryBadgeColor(badge);

                      return (
                        <div
                          key={ball?.id || `${ball?.innings}-${ball?.over}-${ball?.ball}-${idx}`}
                          className="flex items-start gap-3 border-b border-slate-200 px-3 py-2 text-sm"
                        >
                          <div className="w-14 shrink-0 font-semibold text-slate-700">
                            {formatOverBall(ball?.over, ball?.ball)}
                          </div>

                          {badge && (
                            <div
                              className={`h-7 w-7 shrink-0 rounded-full text-white flex items-center justify-center text-xs font-bold ${badgeColor}`}
                            >
                              {badge}
                            </div>
                          )}

                          <div className="flex-1 text-slate-800">
                            {getBallCommentaryText(ball)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-4">No ball-by-ball data available yet</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "SQUADS" && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <div className="bg-slate-50 text-slate-900 rounded-t-lg px-6 py-4 border-b border-slate-200">
                  <div className="grid grid-cols-2 items-center font-bold text-xl gap-4">
                    <div className="flex items-center gap-3">
                      {teamALogo ? (
                        <img
                          src={teamALogo}
                          alt={teamAName}
                          className="h-10 w-10 rounded-full object-contain border border-slate-300"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-200 border border-slate-300" />
                      )}
                      <p>{teamAName}</p>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <p className="text-right">{teamBName}</p>
                      {teamBLogo ? (
                        <img
                          src={teamBLogo}
                          alt={teamBName}
                          className="h-10 w-10 rounded-full object-contain border border-slate-300"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-200 border border-slate-300" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 border-b border-slate-200 text-center">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {showDetailedSquads ? "Playing XI" : "Squad"}
                  </h3>
                </div>

                {primarySquadRows.length > 0 ? (
                  <div>
                    {primarySquadRows.map((row) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-2 border-b border-slate-200"
                      >
                        <div className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                            {row.left?.photoUrl ? (
                              <img
                                src={row.left.photoUrl}
                                alt={row.left.name}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              getInitials(row.left?.name)
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {row.left?.id
                                ? (
                                  <Link
                                    to={`/players/${row.left.id}?matchId=${matchId}`}
                                    state={{ player: row.left }}
                                    className="text-blue-400 hover:text-blue-300 hover:underline"
                                  >
                                    {row.left.name}
                                  </Link>
                                )
                                : "-"}
                            </p>
                            <p className="text-sm text-slate-500">{humanizeText(row.left?.role) || "-"}</p>
                          </div>
                        </div>

                        <div className="p-3 sm:p-5 border-l border-slate-200 flex items-center justify-end gap-3 sm:gap-4 min-w-0">
                          <div className="text-right min-w-0">
                            <p className="font-semibold text-slate-900">
                              {row.right?.id
                                ? (
                                  <Link
                                    to={`/players/${row.right.id}?matchId=${matchId}`}
                                    state={{ player: row.right }}
                                    className="text-blue-400 hover:text-blue-300 hover:underline"
                                  >
                                    {row.right.name}
                                  </Link>
                                )
                                : "-"}
                            </p>
                            <p className="text-sm text-slate-500">{humanizeText(row.right?.role) || "-"}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                            {row.right?.photoUrl ? (
                              <img
                                src={row.right.photoUrl}
                                alt={row.right.name}
                                className="h-12 w-12 rounded-full object-cover"
                              />
                            ) : (
                              getInitials(row.right?.name)
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">Squad data available soon</p>
                )}

                {showDetailedSquads && (
                  <>
                    <div className="p-5 border-b border-slate-200 text-center">
                      <h3 className="text-xl font-semibold text-slate-900">Bench</h3>
                    </div>
                    {hasPlayingXI && benchRows.length > 0 ? (
                      <div>
                        {benchRows.map((row) => (
                          <div
                            key={`bench-${row.key}`}
                            className="grid grid-cols-2 border-b border-slate-200"
                          >
                            <div className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0">
                              <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                                {row.left?.photoUrl ? (
                                  <img
                                    src={row.left.photoUrl}
                                    alt={row.left.name}
                                    className="h-12 w-12 rounded-full object-cover"
                                  />
                                ) : (
                                  getInitials(row.left?.name)
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {row.left?.id
                                    ? (
                                      <Link
                                        to={`/players/${row.left.id}?matchId=${matchId}`}
                                        state={{ player: row.left }}
                                        className="text-blue-400 hover:text-blue-300 hover:underline"
                                      >
                                        {row.left.name}
                                      </Link>
                                    )
                                    : "-"}
                                </p>
                                <p className="text-sm text-slate-500">{humanizeText(row.left?.role) || "-"}</p>
                              </div>
                            </div>
                            <div className="p-3 sm:p-5 border-l border-slate-200 flex items-center justify-end gap-3 sm:gap-4 min-w-0">
                              <div className="text-right min-w-0">
                                <p className="font-semibold text-slate-900">
                                  {row.right?.id
                                    ? (
                                      <Link
                                        to={`/players/${row.right.id}?matchId=${matchId}`}
                                        state={{ player: row.right }}
                                        className="text-blue-400 hover:text-blue-300 hover:underline"
                                      >
                                        {row.right.name}
                                      </Link>
                                    )
                                    : "-"}
                                </p>
                                <p className="text-sm text-slate-500">{humanizeText(row.right?.role) || "-"}</p>
                              </div>
                              <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                                {row.right?.photoUrl ? (
                                  <img
                                    src={row.right.photoUrl}
                                    alt={row.right.name}
                                    className="h-12 w-12 rounded-full object-cover"
                                  />
                                ) : (
                                  getInitials(row.right?.name)
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : hasPlayingXI ? (
                      <p className="text-slate-500 text-center py-8">No bench players available</p>
                    ) : null}
                  </>
                )}

                <div className="p-5 border-b border-slate-200 text-center">
                  <h3 className="text-xl font-semibold text-slate-900">Coaches</h3>
                </div>
                <div>
                  {supportStaffRows.map((row) => (
                    <div
                      key={`staff-${row.key}`}
                      className="grid grid-cols-2 border-b border-slate-200"
                    >
                      <div className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                          {getInitials(row.left?.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{row.left?.name || "-"}</p>
                          <p className="text-sm text-slate-500">{humanizeText(row.left?.role) || "-"}</p>
                        </div>
                      </div>
                      <div className="p-3 sm:p-5 border-l border-slate-200 flex items-center justify-end gap-3 sm:gap-4 min-w-0">
                        <div className="text-right min-w-0">
                          <p className="font-semibold text-slate-900">{row.right?.name || "-"}</p>
                          <p className="text-sm text-slate-500">{humanizeText(row.right?.role) || "-"}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                          {getInitials(row.right?.name)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isTournament && activeTab === "POINTS" && (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-3">Rank</th>
                        <th className="text-left py-3 px-3">Team</th>
                        <th className="text-center py-3 px-3">P</th>
                        <th className="text-center py-3 px-3">W</th>
                        <th className="text-center py-3 px-3">L</th>
                        <th className="text-center py-3 px-3">Pts</th>
                        <th className="text-center py-3 px-3">NRR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pointsTable.length > 0 ? (
                        pointsTable.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-3 font-semibold text-teal-700">{idx + 1}</td>
                            <td className="py-3 px-3">
                              {pointsTeamNames[row.teamId]
                                || pointsTeamNames[row.teamName]
                                || pointsTeamNames[row.team]
                                || row.teamName
                                || row.team
                                || "-"}
                            </td>
                            <td className="text-center py-3 px-3">{row.played || row.matches || 0}</td>
                            <td className="text-center py-3 px-3 text-green-400">{row.won || row.wins || 0}</td>
                            <td className="text-center py-3 px-3 text-red-400">{row.lost || row.losses || 0}</td>
                            <td className="text-center py-3 px-3 font-semibold">{row.points || 0}</td>
                            <td className="text-center py-3 px-3">
                              {typeof row.netRunRate === "number"
                                ? row.netRunRate.toFixed(3)
                                : typeof row.nrr === "number"
                                  ? row.nrr.toFixed(3)
                                  : "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-slate-400">
                            Points table will be updated after first match
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
