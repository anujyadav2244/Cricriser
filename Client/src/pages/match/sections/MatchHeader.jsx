import { Card, CardContent } from "@/components/ui/card";
import { humanizeText } from "@/lib/utils";

export default function MatchHeader({ scoreboard }) {
  const { teamA, teamB, venue, leagueName, status } = scoreboard;

  return (
    <Card className="bg-[#F8FAFC]">
      <CardContent className="p-4 space-y-2">
        <div className="text-xl font-bold text-[#020617]">
          {teamA?.name} vs {teamB?.name}
        </div>

        <div className="text-sm text-[#475569]">
          {leagueName} • {venue}
        </div>

        <div className="inline-block mt-2 px-3 py-1 rounded-full text-sm
                        bg-[#F97316] text-white">
          {humanizeText(status)}
        </div>
      </CardContent>
    </Card>
  );
}
