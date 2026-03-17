import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlayerDashboard() {
  const { player } = useOutletContext();
  if (!player) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Welcome, {player.name}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Player Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><b>Name : </b> {player.name}</p>
            <p><b>Email : </b> {player.authEmail}</p>
            <p><b>Role : </b> {player.role}</p>
            <p><b>Batting Style : </b> {player.battingStyle || "—"}</p>
            <p><b>Bowling Type : </b> {player.bowlingType || "—"}</p>
            <p><b>Bowling Hand : </b>{player.bowlingHand || "_"}</p>
            <p><b>Bowling Style : </b>{player.bowlingStyle || "_"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
