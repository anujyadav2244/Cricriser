import { Card, CardContent } from "@/components/ui/card";

export default function ScoreHeader({ matchDetails, matchScore }) {
  if (!matchDetails || !matchScore) return null;

  const { team1, team2 } = matchDetails;

  /* ================= TEAM DATA ================= */

  const team1Score = {
    id: matchScore.team1Id,
    name: team1.name,
    runs: matchScore.team1Runs,
    wickets: matchScore.team1Wickets,
    overs: matchScore.team1Overs,
  };

  const team2Score = {
    id: matchScore.team2Id,
    name: team2.name,
    runs: matchScore.team2Runs,
    wickets: matchScore.team2Wickets,
    overs: matchScore.team2Overs,
  };

  /* ================= CURRENT BATTING ================= */

  const isTeam1Batting =
    matchScore.battingTeamId === matchScore.team1Id;

  const battingTeam = isTeam1Batting ? team1Score : team2Score;
  const bowlingTeam = isTeam1Batting ? team2Score : team1Score;

  /* ================= BALLS & RUN RATE ================= */

  const ballsBowled =
    Math.floor(battingTeam.overs) * 6 +
    Math.round((battingTeam.overs % 1) * 10);

  const crr =
    ballsBowled > 0
      ? ((battingTeam.runs / ballsBowled) * 6).toFixed(2)
      : "0.00";

  /* ================= SECOND INNINGS LOGIC ================= */

  const isSecondInnings = matchScore.innings === 2;

  const target = isSecondInnings
    ? bowlingTeam.runs + 1
    : null;

  const totalBalls = matchScore.totalOvers * 6;
  const ballsRemaining = totalBalls - ballsBowled;
  const runsRemaining = target ? target - battingTeam.runs : 0;

  const wicketsRemaining = 10 - battingTeam.wickets;

  const hasWonByChase =
    isSecondInnings && battingTeam.runs >= target;

  const hasLostByDefense =
    isSecondInnings &&
    battingTeam.runs < target &&
    (ballsRemaining <= 0 || battingTeam.wickets >= 10);

  /* ================= TOSS INFO ================= */

  const tossWinnerName =
    matchScore.tossWinner === team1Score.id
      ? team1Score.name
      : team2Score.name;

  const tossDecisionText =
    matchScore.tossDecision === "Bowl" ? "elected to bowl" : "elected to bat";

  /* ================= UI ================= */

  return (
    <Card className="sticky top-0 z-50 border-b">
      <CardContent className="p-4 space-y-3">

        {/* TEAM 1 */}
        <div
          className={`flex justify-between ${
            isTeam1Batting ? "font-bold text-green-700" : ""
          }`}
        >
          <p>
            {team1Score.name}
            {isTeam1Batting && " 🏏"}
          </p>
          <p>
            {team1Score.runs}/{team1Score.wickets} ({team1Score.overs} ov)
          </p>
        </div>

        {/* TEAM 2 */}
        <div
          className={`flex justify-between ${
            !isTeam1Batting ? "font-bold text-green-700" : ""
          }`}
        >
          <p>
            {team2Score.name}
            {!isTeam1Batting && " 🏏"}
          </p>
          <p>
            {team2Score.runs}/{team2Score.wickets} ({team2Score.overs} ov)
          </p>
        </div>

        {/* TOSS INFO */}
        <p className="text-sm text-gray-500">
          Toss: {tossWinnerName} won the toss and {tossDecisionText}
        </p>

        {/* STATUS LINE */}
        <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">

          <p>CRR: {crr}</p>

          {isSecondInnings && (
            <>
              {hasWonByChase && (
                <p className="font-semibold text-green-600">
                  {battingTeam.name} won by {wicketsRemaining} wickets
                </p>
              )}

              {hasLostByDefense && (
                <p className="font-semibold text-red-600">
                  {bowlingTeam.name} win by {runsRemaining * 1} runs
                </p>
              )}

              {!hasWonByChase && !hasLostByDefense && (
                <p>
                  Need {runsRemaining} runs in {ballsRemaining} balls
                </p>
              )}  
            </>
          )}

        </div>

      </CardContent>
    </Card>
  );
}
