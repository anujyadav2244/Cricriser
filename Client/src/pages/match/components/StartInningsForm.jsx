import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function StartInningsForm({
  match,
  score,
  innings,
  onStarted
}) {
  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= PLAYER MAP ================= */
  const playerMap = useMemo(() => {
    const map = {};
    match.team1.squad.forEach(p => (map[p.id] = p));
    match.team2.squad.forEach(p => (map[p.id] = p));
    return map;
  }, [match]);

  /* ================= 🔥 TRUST BACKEND (KEY FIX) ================= */

  const battingTeamId = score.battingTeamId;
  const bowlingTeamId = score.bowlingTeamId;

  const battingXI =
    battingTeamId === score.team1Id
      ? score.team1PlayingXI
      : score.team2PlayingXI;

  const bowlingXI =
    bowlingTeamId === score.team1Id
      ? score.team1PlayingXI
      : score.team2PlayingXI;

  /* ================= SUBMIT ================= */
  const handleStart = async () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      toast.error("Select striker, non-striker and bowler");
      return;
    }

    if (strikerId === nonStrikerId) {
      toast.error("Striker and non-striker cannot be same");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "https://cricriser.up.railway.app/api/match/score/start-innings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            matchId: score.matchId,
            innings,
            strikerId,
            nonStrikerId,
            bowlerId,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const updatedScore = await res.json();
      toast.success(
        `${innings === 1 ? "First" : "Second"} innings started`
      );

      onStarted(updatedScore);

    } catch (err) {
      toast.error(err.message || "Failed to start innings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto mt-6">
      <CardContent className="p-6 space-y-6">

        <h2 className="text-xl font-semibold">
          Start {innings === 1 ? "First" : "Second"} Innings
        </h2>

        {/* STRIKER */}
        <div>
          <h3 className="font-medium mb-2">Select Striker</h3>
          <div className="grid grid-cols-2 gap-2">
            {battingXI.map(id => (
              <Button
                key={id}
                variant={strikerId === id ? "default" : "outline"}
                onClick={() => setStrikerId(id)}
              >
                {playerMap[id]?.name}
              </Button>
            ))}
          </div>
        </div>

        {/* NON-STRIKER */}
        <div>
          <h3 className="font-medium mb-2">Select Non-Striker</h3>
          <div className="grid grid-cols-2 gap-2">
            {battingXI.map(id => (
              <Button
                key={id}
                disabled={id === strikerId}
                variant={nonStrikerId === id ? "default" : "outline"}
                onClick={() => setNonStrikerId(id)}
              >
                {playerMap[id]?.name}
              </Button>
            ))}
          </div>
        </div>

        {/* BOWLER */}
        <div>
          <h3 className="font-medium mb-2">Select Opening Bowler</h3>
          <div className="grid grid-cols-2 gap-2">
            {bowlingXI.map(id => (
              <Button
                key={id}
                variant={bowlerId === id ? "default" : "outline"}
                onClick={() => setBowlerId(id)}
              >
                {playerMap[id]?.name}
              </Button>
            ))}
          </div>
        </div>

        <Button
          className="w-full"
          disabled={loading}
          onClick={handleStart}
        >
          {loading ? "Starting..." : "Start Innings"}
        </Button>

      </CardContent>
    </Card>
  );
}
