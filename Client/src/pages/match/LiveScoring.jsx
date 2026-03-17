import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api from "@/api/axios";
import { toast } from "sonner";

export default function LiveScoring() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedExtra, setSelectedExtra] = useState(null);
  const [selectedExtraRuns, setSelectedExtraRuns] = useState(null);

  useEffect(() => {
    fetchScoreboard();
    const interval = setInterval(fetchScoreboard, 4000);
    return () => clearInterval(interval);
  }, [matchId]);

  const fetchScoreboard = async () => {
    try {
      const res = await api.get(`/api/match/scoreboard/${matchId}`);
      setScoreboard(res.data);
    } catch {
      toast.error("Failed to load live data");
    } finally {
      setLoading(false);
    }
  };

  const submitBall = async (payload) => {
    try {
      setSubmitting(true);

      await api.post("/api/ball/record", {
        matchId,
        innings: scoreboard.innings,
        ...payload
      });

      // Reset extra selection
      setSelectedExtra(null);
      setSelectedExtraRuns(null);

      await fetchScoreboard();
    } catch (err) {
      toast.error(err.response?.data?.error || "Ball rejected");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading live scoring…</div>;
  if (!scoreboard || !scoreboard.live) return <div className="p-6">Match not live</div>;

  const { live } = scoreboard;

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 space-y-6 text-[#E5E7EB]">

      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-xl font-bold">Live Scoring</h1>
        <p className="text-sm text-slate-400">
          {live.striker?.name} & {live.nonStriker?.name}
        </p>
        <p className="text-xs text-orange-400">
          Bowler: {live.bowler?.name}
        </p>
      </div>

      <Separator className="bg-slate-700" />

      {/* ================= RUN BUTTONS ================= */}
      <Card className="bg-[#020617]">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-orange-400">Runs</h3>

          <div className="grid grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <Button
                key={r}
                disabled={submitting}
                onClick={() =>
                  submitBall({
                    runsOffBat: r,
                    legalBall: true
                  })
                }
              >
                {r}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ================= EXTRAS ================= */}
      <Card className="bg-[#020617]">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-orange-400">Extras</h3>

          {/* Extra Type Selection */}
          <div>
            <p className="text-sm text-slate-300 mb-2">Type</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "WD", value: "WD", legalBall: false },
                { label: "NB", value: "NB", legalBall: false },
                { label: "B", value: "B", legalBall: true },
                { label: "LB", value: "LB", legalBall: true }
              ].map((extra) => (
                <Button
                  key={extra.value}
                  variant={selectedExtra === extra.value ? "default" : "outline"}
                  disabled={submitting}
                  onClick={() => {
                    setSelectedExtra(selectedExtra === extra.value ? null : extra.value);
                    setSelectedExtraRuns(null);
                  }}
                >
                  {extra.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Runs Selection - only show if extra is selected */}
          {selectedExtra && (
            <div>
              <p className="text-sm text-slate-300 mb-2">Runs</p>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4].map((r) => (
                  <Button
                    key={r}
                    variant={selectedExtraRuns === r ? "default" : "outline"}
                    disabled={submitting}
                    onClick={() => setSelectedExtraRuns(selectedExtraRuns === r ? null : r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>

              {/* Confirm Button */}
              <Button
                className="w-full mt-3"
                disabled={submitting || selectedExtraRuns === null}
                onClick={() => {
                  const extraConfig = {
                    WD: { isLegal: false },
                    NB: { isLegal: false },
                    B: { isLegal: true },
                    LB: { isLegal: true }
                  };
                  const config = extraConfig[selectedExtra];

                  submitBall({
                    extraType: selectedExtra,
                    extraRuns: selectedExtraRuns,
                    legalBall: config.isLegal
                  });
                }}
              >
                Confirm Extra
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================= WICKET ================= */}
      <Card className="bg-[#020617]">
        <CardContent className="p-4">
          <Button
            variant="destructive"
            disabled={submitting}
            onClick={() =>
              submitBall({
                wicket: true,
                wicketType: "OUT",
                legalBall: true
              })
            }
          >
            WICKET
          </Button>
        </CardContent>
      </Card>

      {/* ================= EXIT ================= */}
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
      >
        Back to Scoreboard
      </Button>
    </div>
  );
}
