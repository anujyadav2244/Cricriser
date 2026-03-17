import { Card, CardContent } from "@/components/ui/card";

export default function LiveScoreSection({ scoreboard }) {
  const { teamA, teamB, live } = scoreboard;

  const battingTeam =
    live.battingTeamId === teamA.id ? teamA : teamB;

  return (
    <Card className="bg-[#F8FAFC]">
      <CardContent className="p-4 space-y-3 text-[#020617]">
        <div className="text-lg font-bold">
          {battingTeam.name} {battingTeam.runs}/{battingTeam.wickets}
          <span className="text-sm text-[#475569]">
            {" "}({battingTeam.overs} ov)
          </span>
        </div>

        <div className="text-sm">
          CRR: {battingTeam.runRate}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <PlayerCard title="Striker" player={live.striker} />
          <PlayerCard title="Non-Striker" player={live.nonStriker} />
          <PlayerCard title="Bowler" player={live.bowler} />
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerCard({ title, player }) {
  if (!player) return null;

  return (
    <div className="border rounded p-3">
      <div className="font-semibold">{title}</div>
      <div>{player.name}</div>

      {"runs" in player && (
        <div className="text-sm text-[#475569]">
          {player.runs} ({player.balls})
        </div>
      )}

      {"overs" in player && (
        <div className="text-sm text-[#475569]">
          {player.overs} ov • {player.wickets}/{player.runsConceded}
        </div>
      )}
    </div>
  );
}
