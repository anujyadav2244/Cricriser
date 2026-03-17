import { useEffect, useState } from "react";
import LiveScoringPanel from "./LiveScoringPanel";
import { Card, CardContent } from "@/components/ui/card";

export default function Scorecard({
  matchId,
  matchDetails,
  matchScore,
  refreshScore,
}) {
  const [activeTab, setActiveTab] = useState("LIVE");
  const [allStats, setAllStats] = useState([]);
  const [commentary, setCommentary] = useState([]);

  /* ================= PLAYER NAME ================= */

  const getPlayerName = (playerId) => {
    const allPlayers = [
      ...matchDetails.team1.squad,
      ...matchDetails.team2.squad,
    ];
    return allPlayers.find((p) => p.id === playerId)?.name || "Unknown";
  };

  /* ================= OVER FORMAT (0.1 FIX) ================= */

  const formatOverBall = (ball) => {
    return `${ball.over}.${ball.ball}`;
  };

  /* ================= DISMISSAL TEXT ================= */

  const getDismissalText = (b) => {
    if (!b.out) return "not out";

    const bowler = b.bowlerId ? getPlayerName(b.bowlerId) : "";
    const fielder = b.fielderId ? getPlayerName(b.fielderId) : "";

    switch (b.dismissalType) {
      case "CAUGHT":
        return `c ${fielder} b ${bowler}`;
      case "BOWLED":
        return `b ${bowler}`;
      case "LBW":
        return `lbw b ${bowler}`;
      case "STUMPED":
        return `st ${fielder} b ${bowler}`;
      case "RUN_OUT":
        return `run out (${fielder})`;
      default:
        return b.dismissalType?.toLowerCase() || "";
    }
  };

  /* ================= FETCH STATS ================= */

  const fetchStats = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:8080/api/match-player-stats/match/${matchId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setAllStats(await res.json());
  };

  /* ================= FETCH COMMENTARY ================= */

  const fetchCommentary = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:8080/api/ball-by-ball/match/${matchId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();

    const sorted = [...data].sort((a, b) => {
      if (a.innings !== b.innings) return b.innings - a.innings;
      if (a.over !== b.over) return b.over - a.over;
      return b.ball - a.ball;
    });

    setCommentary(sorted);
  };

  useEffect(() => {
    if (matchScore) {
      // ✅ Reset state before fetching new data
      setCommentary([]);
      setAllStats([]);
      setActiveTab("LIVE");
      
      // Then fetch new data
      fetchStats();
      fetchCommentary();
    }
  }, [matchScore]);

  /* ================= COMMENTARY TEXT ================= */

  const generateCommentary = (ball) => {
    const batter = getPlayerName(ball.batterId);
    const bowler = getPlayerName(ball.bowlerId);

    if (ball.wicket) {
      return `${bowler} to ${batter}, OUT! ${ball.wicketType}`;
    }

    if (ball.boundaryRuns === 6) {
      return `${bowler} to ${batter}, SIX!`;
    }

    if (ball.boundaryRuns === 4) {
      return `${bowler} to ${batter}, FOUR!`;
    }

    if (ball.extraType === "WIDE") {
      return `${bowler} to ${batter}, WIDE`;
    }

    if (ball.extraType === "NO_BALL") {
      return `${bowler} to ${batter}, NO BALL`;
    }

    if (ball.runs > 0) {
      return `${bowler} to ${batter}, ${ball.runs} run`;
    }

    return `${bowler} to ${batter}, no run`;
  };

  /* ================= COMMENTARY ROW ================= */

  const CommentaryRow = ({ ball }) => {
    if (ball.type === "INNINGS_BREAK") {
      return (
        <div className="py-2 text-center text-sm font-semibold text-gray-600 bg-muted">
          First Innings Completed
        </div>
      );
    }

    const badge =
      ball.wicket ? "W"
      : ball.boundaryRuns === 6 ? "6"
      : ball.boundaryRuns === 4 ? "4"
      : null;

    const badgeColor =
      badge === "6"
        ? "bg-purple-500"
        : badge === "4"
        ? "bg-blue-500"
        : badge === "W"
        ? "bg-red-500"
        : "";

    return (
      <div className="flex gap-3 py-2 border-b text-sm">
        <div className="w-14 text-gray-600 font-medium">
          {formatOverBall(ball)}
        </div>

        {badge && (
          <div
            className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold ${badgeColor}`}
          >
            {badge}
          </div>
        )}

        <div className="flex-1 text-gray-800">
          {generateCommentary(ball)}
        </div>
      </div>
    );
  };

  /* ================= INSERT INNINGS BREAK ================= */

  const buildCommentaryWithBreak = () => {
    const result = [];
    let lastInnings = null;

    commentary.forEach((ball) => {
      if (lastInnings !== null && ball.innings !== lastInnings) {
        result.push({ type: "INNINGS_BREAK" });
      }
      result.push(ball);
      lastInnings = ball.innings;
    });

    return result;
  };

  /* ================= RENDER INNINGS (SCORECARD - CRICBUZZ STYLE) ================= */

  const getInningsOrder = () => {
    if (!matchScore) {
      return [matchScore?.team1Id, matchScore?.team2Id];
    }

    const team1Id = matchScore.team1Id;
    const team2Id = matchScore.team2Id;

    if (!team1Id || !team2Id || !matchScore.tossWinner || !matchScore.tossDecision) {
      return [team1Id, team2Id];
    }

    const tossWinner = matchScore.tossWinner;
    const tossDecision = String(matchScore.tossDecision).toUpperCase();
    const otherTeam = tossWinner === team1Id ? team2Id : team1Id;

    const firstBattingTeamId = tossDecision === "BAT" ? tossWinner : otherTeam;
    const secondBattingTeamId = firstBattingTeamId === team1Id ? team2Id : team1Id;

    return [firstBattingTeamId, secondBattingTeamId];
  };

  const getTeamById = (teamId) => {
    if (!matchDetails) return null;
    if (matchDetails.team1?.id === teamId) return matchDetails.team1;
    if (matchDetails.team2?.id === teamId) return matchDetails.team2;
    return null;
  };

  const getTeamScore = (teamId) => {
    if (!matchScore) return { runs: 0, wickets: 0, overs: 0, yetToBat: [], outBatters: [] };
    if (teamId === matchScore.team1Id) {
      return {
        runs: matchScore.team1Runs,
        wickets: matchScore.team1Wickets,
        overs: matchScore.team1Overs,
        yetToBat: matchScore.team1YetToBat,
        outBatters: matchScore.team1OutBatters,
      };
    }
    return {
      runs: matchScore.team2Runs,
      wickets: matchScore.team2Wickets,
      overs: matchScore.team2Overs,
      yetToBat: matchScore.team2YetToBat,
      outBatters: matchScore.team2OutBatters,
    };
  };

  const renderInnings = (teamId, team, runs, wickets, overs, yetToBat, strikerId, nonStrikerId, outBatters) => {
    const batting = allStats.filter(
      (p) =>
        p.teamId === teamId
        && (
          p.balls > 0
          || p.out
          || p.playerId === strikerId
          || p.playerId === nonStrikerId
        )
    );

    const battingOrder = teamId === matchScore.team1Id
      ? (matchScore.team1PlayingXI || [])
      : (matchScore.team2PlayingXI || []);

    const battingOrderIndex = new Map(
      battingOrder.map((playerId, idx) => [playerId, idx])
    );

    const orderedBatting = [...batting].sort((a, b) => {
      const aIdx = battingOrderIndex.has(a.playerId)
        ? battingOrderIndex.get(a.playerId)
        : Number.MAX_SAFE_INTEGER;
      const bIdx = battingOrderIndex.has(b.playerId)
        ? battingOrderIndex.get(b.playerId)
        : Number.MAX_SAFE_INTEGER;

      if (aIdx !== bIdx) {
        return aIdx - bIdx;
      }

      return getPlayerName(a.playerId).localeCompare(getPlayerName(b.playerId));
    });

    const bowling = allStats.filter(
      (p) => p.teamId !== teamId && p.ballsBowled > 0
    );

    const inningsBalls = commentary
      .filter((b) => (b.battingTeamId || b.teamId) === teamId)
      .sort((a, b) => {
        if ((a.innings || 0) !== (b.innings || 0)) return (a.innings || 0) - (b.innings || 0);
        if ((a.over || 0) !== (b.over || 0)) return (a.over || 0) - (b.over || 0);
        return (a.ball || 0) - (b.ball || 0);
      });

    const fallOfWickets = inningsBalls
      .filter((b) => b.wicket)
      .map((b) => ({
        player: getPlayerName(b.outBatterId),
        score: `${b.totalRunsAtBall ?? runs}-${b.totalWicketsAtBall ?? ""}`.replace(/-$/, ""),
        over: `${b.over}.${b.ball}`,
      }));

    // Calculate run rate
    const oversDecimal = parseFloat(overs) || 0;
    const runRate = oversDecimal > 0 ? (runs / oversDecimal).toFixed(2) : 0;

    // Calculate extras breakdown
    const allBalls = inningsBalls;
    const extras = {
      byes: allBalls.filter((b) => ["BYE", "B"].includes(b.extraType)).reduce((sum, b) => sum + (b.extraRuns || b.runs || 0), 0),
      legByes: allBalls.filter((b) => ["LEG_BYE", "LB"].includes(b.extraType)).reduce((sum, b) => sum + (b.extraRuns || b.runs || 0), 0),
      wides: allBalls.filter((b) => b.extraType === "WIDE").reduce((sum, b) => sum + 1 + (b.extraRuns || 0), 0),
      noBalls: allBalls.filter((b) => b.extraType === "NO_BALL").reduce((sum, b) => sum + 1 + (b.extraRuns || 0), 0),
    };
    const totalExtras = extras.byes + extras.legByes + extras.wides + extras.noBalls;

    return (
      <div className="space-y-4">
        {/* Header - Team name and score */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-2xl">{team.name}</h3>
            <div className="text-2xl font-bold">
              {runs}-{wickets} <span className="text-lg">({overs} Ov)</span>
            </div>
          </div>
        </div>

        {/* Batting Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm bg-white">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-3 font-semibold">Batter</th>
                <th className="text-left p-3 font-semibold">Dismissal</th>
                <th className="text-center p-3 font-semibold">R</th>
                <th className="text-center p-3 font-semibold">B</th>
                <th className="text-center p-3 font-semibold">4s</th>
                <th className="text-center p-3 font-semibold">6s</th>
                <th className="text-center p-3 font-semibold">SR</th>
              </tr>
            </thead>
            <tbody>
              {orderedBatting.map((b, idx) => (
                <tr key={b.playerId} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                  <td className="p-3 font-semibold text-blue-600">
                    {getPlayerName(b.playerId)}
                  </td>
                  <td className="p-3 text-gray-600 text-xs">
                    {getDismissalText(b)}
                  </td>
                  <td className="text-center p-3 font-bold">{b.runs}</td>
                  <td className="text-center p-3">{b.balls}</td>
                  <td className="text-center p-3">{b.fours}</td>
                  <td className="text-center p-3">{b.sixes}</td>
                  <td className="text-center p-3">{b.strikeRate?.toFixed(2)}</td>
                </tr>
              ))}

              {/* Extras Row */}
              {totalExtras > 0 && (
                <tr className="border-b bg-gray-50">
                  <td className="p-3 font-semibold">Extras</td>
                  <td className="p-3 text-xs text-gray-600">
                    {extras.byes > 0 ? `b ${extras.byes}` : ''}
                    {extras.legByes > 0 ? `${extras.byes > 0 ? ', ' : ''}lb ${extras.legByes}` : ''}
                    {extras.wides > 0 ? `${extras.byes > 0 || extras.legByes > 0 ? ', ' : ''}w ${extras.wides}` : ''}
                    {extras.noBalls > 0 ? `${extras.byes > 0 || extras.legByes > 0 || extras.wides > 0 ? ', ' : ''}nb ${extras.noBalls}` : ''}
                  </td>
                  <td className="text-center p-3 font-bold">{totalExtras}</td>
                  <td className="text-center p-3">—</td>
                  <td className="text-center p-3">—</td>
                  <td className="text-center p-3">—</td>
                  <td className="text-center p-3">—</td>
                </tr>
              )}

              {/* Total Row */}
              <tr className="bg-gray-100 border-b font-bold">
                <td className="p-3">Total</td>
                <td className="p-3"></td>
                <td className="text-center p-3">{runs}</td>
                <td colSpan="4" className="p-3 text-right text-xs">
                  ({overs} Overs, RR: {runRate})
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Did not Bat */}
        {yetToBat?.length > 0 && (
          <p className="text-sm text-gray-700">
            <strong>Did not Bat:</strong>{" "}
            <span className="text-blue-600">
              {yetToBat.map(getPlayerName).join(", ")}
            </span>
          </p>
        )}

        {outBatters?.length > 0 && (
          <p className="text-sm text-gray-700">
            <strong>Out Batters:</strong>{" "}
            <span className="text-blue-600">
              {outBatters.map(getPlayerName).join(", ")}
            </span>
          </p>
        )}

        {/* Fall of Wickets */}
        {fallOfWickets.length > 0 && (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="text-left p-3 font-semibold">Fall of Wickets</th>
                  <th className="text-left p-3 font-semibold">Score</th>
                  <th className="text-left p-3 font-semibold">Over</th>
                </tr>
              </thead>
              <tbody>
                {fallOfWickets.map((w, idx) => (
                  <tr key={`${w.player}-${idx}`} className="border-b">
                    <td className="p-3 text-blue-600">{w.player}</td>
                    <td className="p-3">{w.score}</td>
                    <td className="p-3">{w.over}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bowling Table */}
        {bowling.length > 0 && (
          <div className="mt-6 overflow-x-auto border rounded-lg">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="text-left p-3 font-semibold">Bowler</th>
                  <th className="text-center p-3 font-semibold">O</th>
                  <th className="text-center p-3 font-semibold">M</th>
                  <th className="text-center p-3 font-semibold">R</th>
                  <th className="text-center p-3 font-semibold">W</th>
                  <th className="text-center p-3 font-semibold">NB</th>
                  <th className="text-center p-3 font-semibold">WD</th>
                  <th className="text-center p-3 font-semibold">ECO</th>
                </tr>
              </thead>
              <tbody>
                {bowling.map((b, idx) => (
                  <tr key={b.playerId} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                    <td className="p-3 font-semibold text-blue-600">
                      {getPlayerName(b.playerId)}
                    </td>
                    <td className="text-center p-3">{b.overs}</td>
                    <td className="text-center p-3">{b.maidens || 0}</td>
                    <td className="text-center p-3">{b.runsConceded}</td>
                    <td className="text-center p-3 font-bold">{b.wickets}</td>
                    <td className="text-center p-3">{b.noBalls || 0}</td>
                    <td className="text-center p-3">{b.wides || 0}</td>
                    <td className="text-center p-3">{b.economy?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  /* ================= SQUADS ================= */

  const renderSquad = (team, playingXIIds) => {
    const playingXI = team.squad.filter(p => playingXIIds.includes(p.id));
    const bench = team.squad.filter(p => !playingXIIds.includes(p.id));

    return (
      <div>
        <h3 className="font-bold mb-2">{team.name}</h3>

        <p className="font-semibold text-sm">Playing XI</p>
        {playingXI.map(p => (
          <p key={p.id} className="text-sm">{p.name}</p>
        ))}

        {bench.length > 0 && (
          <>
            <p className="font-semibold text-sm mt-2">Bench</p>
            {bench.map(p => (
              <p key={p.id} className="text-sm text-gray-600">{p.name}</p>
            ))}
          </>
        )}
      </div>
    );
  };

  /* ================= UI ================= */

  return (
    <Card>
      {/* ================= TABS AT TOP ================= */}
      <div className="bg-white border-b">
        <div className="flex gap-6 px-4">
          {["LIVE", "SCORECARD", "SQUADS"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 font-semibold text-sm transition-all border-b-2 ${
                activeTab === tab
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TAB CONTENT ================= */}
      <CardContent className="p-4 space-y-4">

        {/* LIVE TAB */}
        {activeTab === "LIVE" && (
          <div className="space-y-4">
            <LiveScoringPanel
              matchDetails={matchDetails}
              matchScore={matchScore}
              onScoreUpdate={() => {
                refreshScore();
                fetchStats();
                fetchCommentary();
              }}
            />

            <div className="border-t pt-3">
              <h3 className="font-semibold text-sm mb-2">Live Commentary</h3>
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {buildCommentaryWithBreak().map((ball, i) => (
                  <CommentaryRow key={i} ball={ball} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCORECARD TAB */}
        {activeTab === "SCORECARD" && (
          <div className="space-y-8">
            {(() => {
              const [firstInningsTeamId, secondInningsTeamId] = getInningsOrder();
              const firstTeam = getTeamById(firstInningsTeamId);
              const secondTeam = getTeamById(secondInningsTeamId);
              const firstScore = getTeamScore(firstInningsTeamId);
              const secondScore = getTeamScore(secondInningsTeamId);

              return (
                <>
                  {/* First Innings */}
                  {firstTeam &&
                    renderInnings(
                      firstInningsTeamId,
                      firstTeam,
                      firstScore.runs,
                      firstScore.wickets,
                      firstScore.overs,
                      firstScore.yetToBat,
                      matchScore.battingTeamId === firstInningsTeamId ? matchScore.strikerId : null,
                      matchScore.battingTeamId === firstInningsTeamId ? matchScore.nonStrikerId : null,
                      firstScore.outBatters
                    )}

                  {/* Second Innings */}
                  {matchScore.firstInningsCompleted && secondTeam &&
                    renderInnings(
                      secondInningsTeamId,
                      secondTeam,
                      secondScore.runs,
                      secondScore.wickets,
                      secondScore.overs,
                      secondScore.yetToBat,
                      matchScore.battingTeamId === secondInningsTeamId ? matchScore.strikerId : null,
                      matchScore.battingTeamId === secondInningsTeamId ? matchScore.nonStrikerId : null,
                      secondScore.outBatters
                    )}
                </>
              );
            })()}
          </div>
        )}

        {/* SQUADS TAB */}
        {activeTab === "SQUADS" && (
          <div className="grid md:grid-cols-2 gap-6">
            {renderSquad(matchDetails.team1, matchScore.team1PlayingXI)}
            {renderSquad(matchDetails.team2, matchScore.team2PlayingXI)}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
