import BallInputPanel from "./BallInputPanel";

export default function LiveScoringPanel({
  matchDetails,
  matchScore,
  onScoreUpdate
}) {
  if (!matchScore || matchScore.innings === 0) return null;

  const striker = findPlayer(matchDetails, matchScore.strikerId);
  const nonStriker = findPlayer(matchDetails, matchScore.nonStrikerId);
  const bowler = findPlayer(matchDetails, matchScore.currentBowlerId);

  // Wicket just fell and backend is waiting for new batter
  const waitingForNewBatter =
    matchScore.lastBallWasWicket === true &&
    matchScore.strikerId === null;

  return (
    <div className="p-4 border rounded space-y-4 bg-white">

      {/* ===== CURRENT PLAYERS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div>
          <h3 className="font-semibold mb-1">Batting</h3>
          <p className="text-sm">
            🏏 {striker?.name || "—"}
            {!waitingForNewBatter && (
              <span className="text-emerald-500"> *</span>
            )}
          </p>
          <p className="text-sm">
            🏏 {nonStriker?.name || "—"}
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-1">Bowling</h3>
          <p className="text-sm">
            🎯 {bowler?.name || "—"}
          </p>
        </div>

      </div>

      {/* ===== WICKET FLOW ===== */}
      {waitingForNewBatter ? (
        <div className="p-4 border border-red-300 rounded bg-red-50">
          <p className="font-semibold text-red-600">
            Wicket fallen! Select new batter to continue.
          </p>
        </div>
      ) : (
        <BallInputPanel
          matchScore={matchScore}
          matchDetails={matchDetails}
          onBallRecorded={onScoreUpdate}
        />
      )}

    </div>
  );
}

/* ===== HELPER ===== */
function findPlayer(matchDetails, playerId) {
  if (!playerId || !matchDetails) return null;

  const allPlayers = [
    ...matchDetails.team1.squad,
    ...matchDetails.team2.squad,
  ];

  return allPlayers.find((p) => p.id === playerId);
}
