import { useEffect, useState } from "react";
import { getMatchScorecard } from "@/api/matchscore.api";

export default function ScorecardTab({ matchId }) {
  const [scorecard, setScorecard] = useState(null);

  useEffect(() => {
    getMatchScorecard(matchId).then(setScorecard);
  }, [matchId]);

  if (!scorecard) return <div>Loading scorecard...</div>;

  return (
    <div className="space-y-6">
      {/* Batting Table */}
      <div>
        <h2 className="font-semibold text-lg mb-2">Batting</h2>
        <table className="w-full border">
          <thead>
            <tr>
              <th>Batter</th>
              <th>R</th>
              <th>B</th>
              <th>4s</th>
              <th>6s</th>
              <th>SR</th>
            </tr>
          </thead>
          <tbody>
            {scorecard.batting.map((b) => (
              <tr key={b.playerId}>
                <td>{b.name}</td>
                <td>{b.runs}</td>
                <td>{b.balls}</td>
                <td>{b.fours}</td>
                <td>{b.sixes}</td>
                <td>{b.strikeRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bowling Table */}
      <div>
        <h2 className="font-semibold text-lg mb-2">Bowling</h2>
        <table className="w-full border">
          <thead>
            <tr>
              <th>Bowler</th>
              <th>O</th>
              <th>R</th>
              <th>W</th>
              <th>Eco</th>
            </tr>
          </thead>
          <tbody>
            {scorecard.bowling.map((b) => (
              <tr key={b.playerId}>
                <td>{b.name}</td>
                <td>{b.overs}</td>
                <td>{b.runs}</td>
                <td>{b.wickets}</td>
                <td>{b.economy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
