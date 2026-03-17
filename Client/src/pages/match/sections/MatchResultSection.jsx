import { Card, CardContent } from "@/components/ui/card";

export default function MatchResultSection({ scoreboard }) {
  return (
    <Card className="bg-[#F8FAFC]">
      <CardContent className="p-4 text-[#020617] space-y-2">
        <div className="text-lg font-bold text-[#22C55E]">
          {scoreboard.resultText}
        </div>

        {scoreboard.playerOfMatch && (
          <div className="text-sm text-[#475569]">
            Player of the Match: {scoreboard.playerOfMatch}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
