import BallInputPanel from "./BallInputPanel";

export default function LiveScoringPanel({
  matchDetails,
  matchScore,
  allStats = [],
  commentary = [],
  onScoreUpdate,
  showBallInput = true,
  renderPlayerName,
}) {
  if (!matchScore || !matchDetails || matchScore.innings === 0) return null;

  const team1Id = matchScore.team1Id || matchDetails.team1?.id;
  const team2Id = matchScore.team2Id || matchDetails.team2?.id;
  const battingTeamId = matchScore.battingTeamId || team1Id;
  const bowlingTeamId = battingTeamId === team1Id ? team2Id : team1Id;

  const allPlayers = [...(matchDetails.team1?.squad || []), ...(matchDetails.team2?.squad || [])];

  const findPlayer = (playerId) => {
    if (!playerId) return null;
    return allPlayers.find((p) => p.id === playerId) || null;
  };

  const getPlayerName = (playerId, fallback = "Unknown") => findPlayer(playerId)?.name || fallback;

  const renderName = (playerId, fallbackLabel = "Unknown") => {
    const label = getPlayerName(playerId, fallbackLabel);
    if (typeof renderPlayerName === "function") {
      return renderPlayerName(playerId, label);
    }
    return label;
  };

  const renderNameCell = (playerId, fallbackLabel) => {
    const content = renderName(playerId, fallbackLabel);
    if (typeof content === "string") {
      return <span className="text-blue-700 font-semibold">{content}</span>;
    }
    return content;
  };

  const belongsToTeam = (playerId, teamId) => {
    if (!playerId || !teamId) return false;
    if (teamId === team1Id) return (matchDetails.team1?.squad || []).some((p) => p.id === playerId);
    if (teamId === team2Id) return (matchDetails.team2?.squad || []).some((p) => p.id === playerId);
    return false;
  };

  const isStatForTeam = (stat, teamId) => {
    if (!stat || !teamId) return false;
    if (stat.teamId) return stat.teamId === teamId;
    return belongsToTeam(stat.playerId, teamId);
  };

  const getPlayerStat = (playerId) => {
    if (!playerId) return null;
    return allStats.find((s) => s.playerId === playerId) || null;
  };

  const oversToFloat = (overs, ballsBowled = 0) => {
    if (typeof overs === "number" && !Number.isNaN(overs)) return overs;
    if (typeof overs === "string" && overs.includes(".")) {
      const [fullRaw, ballRaw] = overs.split(".");
      const full = Number(fullRaw || 0);
      const ball = Number(ballRaw || 0);
      if (Number.isFinite(full) && Number.isFinite(ball)) {
        return full + ball / 6;
      }
    }
    const balls = Number(ballsBowled || 0);
    return balls / 6;
  };

  const formatOvers = (stat) => {
    if (!stat) return "0";
    if (typeof stat.overs === "number" && !Number.isNaN(stat.overs)) return stat.overs.toString();
    if (typeof stat.overs === "string" && stat.overs.trim()) return stat.overs;
    const balls = Number(stat.ballsBowled || 0);
    const full = Math.floor(balls / 6);
    const rem = balls % 6;
    return `${full}.${rem}`;
  };

  const isLegalDelivery = (ball) => {
    const extraType = String(ball?.extraType || "").toUpperCase();
    return !["WIDE", "WD", "NO_BALL", "NB"].includes(extraType);
  };

  const getBallTotalRuns = (ball) => {
    const extraType = String(ball?.extraType || "").toUpperCase();
    const isWide = extraType === "WIDE" || extraType === "WD";
    const isNoBall = extraType === "NO_BALL" || extraType === "NB";
    const isBye = extraType === "BYE" || extraType === "B";
    const isLegBye = extraType === "LEG_BYE" || extraType === "LB";

    let total = 0;
    if (isWide || isNoBall) total += 1;
    if (!isWide && !isBye && !isLegBye) total += Number(ball?.runs || 0);
    total += Number(ball?.boundaryRuns || 0);
    total += Number(ball?.extraRuns || 0);
    if (ball?.overthrowBoundary) total += 4;
    return total;
  };

  const inningsBalls = [...commentary]
    .filter((b) => {
      const ballTeamId = b?.battingTeamId || b?.teamId || null;
      if (!battingTeamId) return true;
      if (!ballTeamId) return true;
      return ballTeamId === battingTeamId;
    })
    .sort((a, b) => {
      if ((a.innings || 0) !== (b.innings || 0)) return (a.innings || 0) - (b.innings || 0);
      if ((a.over || 0) !== (b.over || 0)) return (a.over || 0) - (b.over || 0);
      if ((a.ball || 0) !== (b.ball || 0)) return (a.ball || 0) - (b.ball || 0);
      return Number(a.ballSequence || a.timestamp || 0) - Number(b.ballSequence || b.timestamp || 0);
    });

  const lastWicketIndex = (() => {
    for (let i = inningsBalls.length - 1; i >= 0; i -= 1) {
      if (inningsBalls[i]?.wicket) return i;
    }
    return -1;
  })();

  const partnershipBallsList = inningsBalls.slice(lastWicketIndex + 1);
  const partnershipRuns = partnershipBallsList.reduce((sum, b) => sum + getBallTotalRuns(b), 0);
  const partnershipBalls = partnershipBallsList.filter(isLegalDelivery).length;

  const lastWicketBall = lastWicketIndex >= 0 ? inningsBalls[lastWicketIndex] : null;
  const getLastWicketText = () => {
    if (!lastWicketBall) return "No wicket yet";

    const outId = lastWicketBall.outBatterId || lastWicketBall.batterId;
    const outName = getPlayerName(outId);
    const outStat = getPlayerStat(outId);

    const scoreAtWicket = inningsBalls
      .slice(0, lastWicketIndex + 1)
      .reduce((sum, b) => sum + getBallTotalRuns(b), 0);
    const wicketsAtWicket = inningsBalls.slice(0, lastWicketIndex + 1).filter((b) => b?.wicket).length;

    return `${outName} ${outStat?.runs ?? 0}(${outStat?.balls ?? 0}) - ${scoreAtWicket}/${wicketsAtWicket} in ${lastWicketBall.over}.${lastWicketBall.ball} ov`;
  };

  const getLastTenOversText = () => {
    if (inningsBalls.length === 0) return "0 runs, 0 wkts";
    const latestOver = Number(inningsBalls[inningsBalls.length - 1]?.over || 0);
    const minOver = Math.max(0, latestOver - 9);
    const lastTen = inningsBalls.filter((b) => Number(b?.over || 0) >= minOver);
    const runs = lastTen.reduce((sum, b) => sum + getBallTotalRuns(b), 0);
    const wkts = lastTen.filter((b) => b?.wicket).length;
    return `${runs} runs, ${wkts} wkts`;
  };

  const tossDecision = String(matchScore.tossDecision || "")
    .replace(/_/g, " ")
    .toLowerCase();

  const tossWinnerName =
    matchScore.tossWinner === team1Id
      ? matchDetails.team1?.name
      : matchScore.tossWinner === team2Id
        ? matchDetails.team2?.name
        : "-";
  const tossText = tossWinnerName === "-"
    ? "-"
    : `${tossWinnerName} (${tossDecision ? `${tossDecision[0].toUpperCase()}${tossDecision.slice(1)}` : "-"})`;

  const strikerId = matchScore.strikerId;
  const nonStrikerId = matchScore.nonStrikerId;
  const currentBowlerId = matchScore.currentBowlerId;
  const striker = findPlayer(strikerId);
  const nonStriker = findPlayer(nonStrikerId);
  const bowler = findPlayer(currentBowlerId);
  const strikerStat = getPlayerStat(strikerId);
  const nonStrikerStat = getPlayerStat(nonStrikerId);
  const bowlerStat = getPlayerStat(currentBowlerId);

  const otherBowlerStat = allStats
    .filter((s) => isStatForTeam(s, bowlingTeamId))
    .filter((s) => s.playerId !== currentBowlerId)
    .filter((s) => Number(s?.overs || 0) > 0 || Number(s?.ballsBowled || 0) > 0 || Number(s?.wickets || 0) > 0 || Number(s?.runsConceded || 0) > 0)
    .sort((a, b) => oversToFloat(b?.overs, b?.ballsBowled) - oversToFloat(a?.overs, a?.ballsBowled) || Number(b?.wickets || 0) - Number(a?.wickets || 0))[0] || null;

  const waitingForNewBatter =
    matchScore.lastBallWasWicket === true &&
    strikerId === null;

  const showLivePlayers = Boolean(
    strikerId
    || nonStrikerId
    || currentBowlerId
    || strikerStat
    || nonStrikerStat
    || bowlerStat
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="space-y-2">
          <div className="overflow-hidden border border-slate-300">
            <table className="w-full text-sm">
              <thead className="bg-slate-200 text-slate-700">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Batter</th>
                  <th className="text-center px-2 py-2 font-semibold">R</th>
                  <th className="text-center px-2 py-2 font-semibold">B</th>
                  <th className="text-center px-2 py-2 font-semibold">4s</th>
                  <th className="text-center px-2 py-2 font-semibold">6s</th>
                  <th className="text-center px-2 py-2 font-semibold">SR</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-t border-slate-200">
                  <td className="px-3 py-2">
                    {renderNameCell(strikerId, striker?.name || "Striker")} {strikerId ? "*" : ""}
                  </td>
                  <td className="text-center px-2 py-2">{strikerStat?.runs ?? 0}</td>
                  <td className="text-center px-2 py-2">{strikerStat?.balls ?? 0}</td>
                  <td className="text-center px-2 py-2">{strikerStat?.fours ?? 0}</td>
                  <td className="text-center px-2 py-2">{strikerStat?.sixes ?? 0}</td>
                  <td className="text-center px-2 py-2">{Number(strikerStat?.strikeRate ?? 0).toFixed(2)}</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="px-3 py-2">
                    {renderNameCell(nonStrikerId, nonStriker?.name || "Non-striker")}
                  </td>
                  <td className="text-center px-2 py-2">{nonStrikerStat?.runs ?? 0}</td>
                  <td className="text-center px-2 py-2">{nonStrikerStat?.balls ?? 0}</td>
                  <td className="text-center px-2 py-2">{nonStrikerStat?.fours ?? 0}</td>
                  <td className="text-center px-2 py-2">{nonStrikerStat?.sixes ?? 0}</td>
                  <td className="text-center px-2 py-2">{Number(nonStrikerStat?.strikeRate ?? 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden border border-slate-300">
            <table className="w-full text-sm">
              <thead className="bg-slate-200 text-slate-700">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Bowler</th>
                  <th className="text-center px-2 py-2 font-semibold">O</th>
                  <th className="text-center px-2 py-2 font-semibold">M</th>
                  <th className="text-center px-2 py-2 font-semibold">R</th>
                  <th className="text-center px-2 py-2 font-semibold">W</th>
                  <th className="text-center px-2 py-2 font-semibold">ECO</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="border-t border-slate-200">
                  <td className="px-3 py-2">
                    {renderNameCell(currentBowlerId, bowler?.name || "Bowler")} {currentBowlerId ? "*" : ""}
                  </td>
                  <td className="text-center px-2 py-2">{formatOvers(bowlerStat)}</td>
                  <td className="text-center px-2 py-2">{bowlerStat?.maidens ?? 0}</td>
                  <td className="text-center px-2 py-2">{bowlerStat?.runsConceded ?? 0}</td>
                  <td className="text-center px-2 py-2">{bowlerStat?.wickets ?? 0}</td>
                  <td className="text-center px-2 py-2">{Number(bowlerStat?.economy ?? 0).toFixed(2)}</td>
                </tr>
                {otherBowlerStat && (
                  <tr className="border-t border-slate-200">
                    <td className="px-3 py-2">
                      {renderNameCell(otherBowlerStat.playerId, getPlayerName(otherBowlerStat.playerId))}
                    </td>
                    <td className="text-center px-2 py-2">{formatOvers(otherBowlerStat)}</td>
                    <td className="text-center px-2 py-2">{otherBowlerStat?.maidens ?? 0}</td>
                    <td className="text-center px-2 py-2">{otherBowlerStat?.runsConceded ?? 0}</td>
                    <td className="text-center px-2 py-2">{otherBowlerStat?.wickets ?? 0}</td>
                    <td className="text-center px-2 py-2">{Number(otherBowlerStat?.economy ?? 0).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-slate-300 bg-white">
          <div className="bg-slate-200 border-b border-slate-300 px-3 py-2 font-semibold text-slate-700">Key Stats</div>
          <div className="p-3 space-y-3 text-sm text-slate-700 leading-6">
            <p>
              <span className="font-semibold text-slate-900">Partnership:</span> {partnershipRuns}({partnershipBalls})
            </p>
            <p>
              <span className="font-semibold text-slate-900">Last Wkt:</span> {getLastWicketText()}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Last 10 overs:</span> {getLastTenOversText()}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Toss:</span> {tossText}
            </p>
          </div>
        </div>
      </div>

      {!showLivePlayers && (
        <div className="text-sm text-slate-500 border border-slate-200 bg-slate-50 px-3 py-2">
          Live player stats will appear when innings starts.
        </div>
      )}

      {showBallInput && (
        waitingForNewBatter ? (
          <div className="p-4 border border-red-300 rounded bg-red-50">
            <p className="font-semibold text-red-600">Wicket fallen! Select new batter to continue.</p>
          </div>
        ) : (
          <BallInputPanel
            matchScore={matchScore}
            matchDetails={matchDetails}
            onBallRecorded={onScoreUpdate}
          />
        )
      )}
    </div>
  );
}
