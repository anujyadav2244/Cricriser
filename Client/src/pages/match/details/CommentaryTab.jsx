import { useEffect, useState } from "react";
import { getBallByBall } from "@/api/matchscore.api";

export default function CommentaryTab({ matchId }) {
  const [balls, setBalls] = useState([]);

  useEffect(() => {
    getBallByBall(matchId).then(setBalls);
  }, [matchId]);

  return (
    <div className="space-y-2">
      {balls.map((ball, index) => (
        <div key={index} className="border p-2 rounded">
          <div className="font-semibold">
            Over {ball.over}.{ball.ball} — {ball.runs} run
          </div>
          <div className="text-sm text-gray-600">
            {ball.commentary}
          </div>
        </div>
      ))}
    </div>
  );
}
