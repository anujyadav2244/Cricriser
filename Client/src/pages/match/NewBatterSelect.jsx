import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api from "@/api/axios";
import { toast } from "sonner";
import { humanizeText } from "@/lib/utils";

export default function NewBatterSelect() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchScoreboard();
  }, [matchId]);

  const fetchScoreboard = async () => {
    try {
      const res = await api.get(`/api/match/scoreboard/${matchId}`);
      setScoreboard(res.data);
    } catch {
      toast.error("Failed to load match data");
    } finally {
      setLoading(false);
    }
  };

  const submitNewBatter = async () => {
    if (!selected) {
      toast.error("Please select a batter");
      return;
    }

    try {
      await api.post("/api/ball/record", {
        matchId,
        innings: scoreboard.innings,
        newBatterId: selected
      });

      toast.success("New batter set");
      navigate(`/admin/match/${matchId}/live`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to set batter");
    }
  };

  if (loading) return <div className="p-6">Loading batters…</div>;
  if (!scoreboard || !scoreboard.live) return <div className="p-6">Match not live</div>;

  const battingTeamId = scoreboard.live.battingTeamId;

  const yetToBat =
    scoreboard.playingXI?.[battingTeamId]?.filter(
      (p) =>
        p.id !== scoreboard.live.striker?.id &&
        p.id !== scoreboard.live.nonStriker?.id
    ) || [];

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 space-y-6 text-[#E5E7EB]">

      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-xl font-bold">Select New Batter</h1>
        <p className="text-sm text-slate-400">
          Choose next batter from Yet-To-Bat
        </p>
      </div>

      <Separator className="bg-slate-700" />

      {/* ================= BATTER LIST ================= */}
      <Card className="bg-[#020617]">
        <CardContent className="p-4 space-y-3">

          {yetToBat.length === 0 && (
            <p className="text-slate-400 text-sm">
              No batters left
            </p>
          )}

          {yetToBat.map((player) => (
            <div
              key={player.id}
              onClick={() => setSelected(player.id)}
              className={`p-3 rounded cursor-pointer border 
                ${
                  selected === player.id
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-slate-700 hover:border-slate-500"
                }`}
            >
              <div className="font-medium">{player.name}</div>
              <div className="text-xs text-slate-400">
                Role: {humanizeText(player.role) || "-"}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ================= ACTIONS ================= */}
      <div className="flex gap-3">
        <Button
          className="bg-orange-500"
          onClick={submitNewBatter}
        >
          Confirm Batter
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
      </div>

    </div>
  );
}
