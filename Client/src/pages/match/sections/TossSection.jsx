import { Card, CardContent } from "@/components/ui/card";

export default function TossSection({ scoreboard }) {
  return (
    <Card className="bg-[#F8FAFC]">
      <CardContent className="p-4 text-[#020617]">
        <span className="font-semibold">
          Toss:
        </span>{" "}
        {scoreboard.tossWinnerTeamName} elected to{" "}
        {scoreboard.tossDecision}
      </CardContent>
    </Card>
  );
}
