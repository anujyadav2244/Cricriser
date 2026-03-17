import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/api/axios";

export default function NewBowlerModal({
  open,
  matchId,
  innings,
  bowlingTeamPlayers,
  lastOverBowlerId,
  onBowlerSelected,
}) {
  const [bowlerId, setBowlerId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!bowlerId) {
      toast.error("Please select a bowler");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/match/score/start-innings", {
        matchId,
        innings,
        currentBowlerId: bowlerId,
      });

      toast.success("New bowler set");
      onBowlerSelected(bowlerId);

    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to set bowler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-center">
            Select New Bowler
          </h2>

          <p className="text-sm text-slate-500 text-center">
            New over started. Select the next bowler.
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {bowlingTeamPlayers.map((p) => (
              <label
                key={p.id}
                className={`
                  flex items-center gap-2 p-2 rounded cursor-pointer
                  ${p.id === bowlerId ? "bg-orange-100" : "hover:bg-slate-100"}
                `}
              >
                <input
                  type="radio"
                  name="bowler"
                  value={p.id}
                  disabled={p.id === lastOverBowlerId}
                  onChange={() => setBowlerId(p.id)}
                />
                <span className="flex-1">
                  {p.name}
                </span>

                {p.id === lastOverBowlerId && (
                  <span className="text-xs text-red-500">
                    Cannot bowl consecutive overs
                  </span>
                )}
              </label>
            ))}
          </div>

          <Button
            className="w-full bg-orange-500 hover:bg-orange-600"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Setting bowler..." : "Confirm Bowler"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
