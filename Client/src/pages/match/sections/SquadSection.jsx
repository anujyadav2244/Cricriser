import { Card, CardContent } from "@/components/ui/card";

export default function SquadSection({ scoreboard }) {
  const { playingXI } = scoreboard;

  return (
    <Card className="bg-[#F8FAFC]">
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(playingXI).map(([teamId, players]) => (
          <div key={teamId}>
            <h3 className="font-semibold text-[#020617] mb-2">
              Playing XI
            </h3>
            <ul className="text-sm text-[#475569] space-y-1">
              {players.map((p) => (
                <li key={p.id}>
                  {p.name} ({p.role})
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
