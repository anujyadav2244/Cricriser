import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function BallInputPanel({
  matchScore,
  matchDetails,
  onBallRecorded,
}) {
  if (!matchScore || !matchDetails) return null;

  /* ================= STATE ================= */

  const [ballType, setBallType] = useState(null);

  const [runs, setRuns] = useState(null);
  const [extraRuns, setExtraRuns] = useState(null);

  // ✅ Boundary specific
  const [boundaryRuns, setBoundaryRuns] = useState(null);
  const [runningRuns, setRunningRuns] = useState(0);

  const [wicketType, setWicketType] = useState("");
  const [runOutEnd, setRunOutEnd] = useState("");
  const [outBatterId, setOutBatterId] = useState("");
  const [fielderId, setFielderId] = useState("");

  const [newBatterId, setNewBatterId] = useState("");
  const [newBowlerId, setNewBowlerId] = useState("");

  // ✅ Extras (Bye/Leg Bye)
  const [extrasType, setExtrasType] = useState("");
  const [extrasRuns, setExtrasRuns] = useState(0);

  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  /* ================= OVER LOGIC ================= */

  const isNewOver = matchScore.currentBowlerId === null;

  /* ================= TEAM LOGIC ================= */

  const battingTeamIsTeam1 =
    matchScore.battingTeamId === matchScore.team1Id;

  const battingXI = battingTeamIsTeam1
    ? matchScore.team1PlayingXI
    : matchScore.team2PlayingXI;

  const bowlingXI = battingTeamIsTeam1
    ? matchScore.team2PlayingXI
    : matchScore.team1PlayingXI;

  const outBatters = battingTeamIsTeam1
    ? matchScore.team1OutBatters
    : matchScore.team2OutBatters;

  /* ================= DERIVED LISTS ================= */

  const newBatterOptions = useMemo(() => {
    return battingXI.filter(
      (id) =>
        !outBatters.includes(id) &&
        id !== matchScore.strikerId &&
        id !== matchScore.nonStrikerId
    );
  }, [battingXI, outBatters, matchScore]);

  const fielderOptions = bowlingXI;

  const newBowlerOptions = bowlingXI.filter(
    (id) => id !== matchScore.previousBowlerId
  );

  /* ================= HELPERS ================= */

  const findPlayer = (id) => {
    const allPlayers = [
      ...matchDetails.team1.squad,
      ...matchDetails.team2.squad,
    ];
    return allPlayers.find((p) => p.id === id);
  };

  /* ================= GET PLAYER STATS ================= */

  const getPlayerStats = (playerId) => {
    if (!matchScore.playerStats) return null;
    return matchScore.playerStats.find((stat) => stat.playerId === playerId);
  };

  /* ================= FORMAT BATTER NAME WITH STATS ================= */

  const formatBatterName = (playerId) => {
    const player = findPlayer(playerId);
    if (!player) return "Unknown";

    const stats = getPlayerStats(playerId);
    if (!stats) return player.name;

    return `${player.name} (${stats.runs}-${stats.ballsFaced})`;
  };

  const resetForm = () => {
    setBallType(null);
    setRuns(null);
    setExtraRuns(null);
    setBoundaryRuns(null);
    setRunningRuns(0);
    setWicketType("");
    setRunOutEnd("");
    setOutBatterId("");
    setFielderId("");
    setNewBatterId("");
    setNewBowlerId("");
    setExtrasType("");
    setExtrasRuns(0);
  };

  // ✅ Reset form when match changes
  useEffect(() => {
    resetForm();
  }, [matchScore?.matchId]);

  /* ================= SUBMIT ================= */

  const recordBall = async () => {
    try {
      setLoading(true);

      if (isNewOver && !newBowlerId) {
        toast.error("Select new bowler to start the over");
        return;
      }

      if (ballType === "EXTRAS" && !extrasType) {
        toast.error("Select extras type (B or LB)");
        return;
      }

      if (wicketType === "RUN_OUT" && !outBatterId) {
        toast.error("Select out batter");
        return;
      }

      if (
        (ballType === "WICKET" || wicketType === "RUN_OUT" || wicketType === "STUMPED") &&
        !newBatterId
      ) {
        toast.error("Select new batter");
        return;
      }

      const selectedRuns = runs ?? 0;
      const sendSelectedRuns =
        ballType === "RUN"
        || (ballType === "NO_BALL" && boundaryRuns === null)
        || wicketType === "RUN_OUT";

      const payload = {
        matchId: matchScore.matchId,
        innings: matchScore.innings,

        // ✅ Bat runs
        runs: sendSelectedRuns ? selectedRuns : 0,

        // ✅ Boundary mapping
        boundary: ballType === "BOUNDARY" || (ballType === "NO_BALL" && boundaryRuns !== null),
        boundaryRuns: (ballType === "BOUNDARY" || ballType === "NO_BALL") ? (boundaryRuns ?? 0) : 0,
        runningRuns:
          (ballType === "BOUNDARY" || (ballType === "NO_BALL" && boundaryRuns !== null))
            ? runningRuns
            : sendSelectedRuns
            ? selectedRuns
            : 0,

        // ✅ Extras
        extraType:
          ballType === "WIDE" || ballType === "NO_BALL"
            ? ballType
            : ballType === "EXTRAS"
            ? extrasType
            : null,
        extraRuns:
          ballType === "WIDE"
            ? (extraRuns ?? 0)
            : ballType === "EXTRAS"
            ? (extrasRuns ?? 0)
            : 0,

        // ✅ Wicket
        wicket:
          ballType === "WICKET" ||
          wicketType === "RUN_OUT" ||
          wicketType === "STUMPED",

        wicketType: wicketType || null,

        // ✅ Run out
        outBatterId:
          wicketType === "RUN_OUT" ? outBatterId : null,
        runOutEnd:
          wicketType === "RUN_OUT" ? runOutEnd : null,

        // ✅ Fielder
        fielderId:
          ["CAUGHT", "RUN_OUT", "STUMPED"].includes(wicketType)
            ? fielderId
            : null,

        newBatterId:
          (ballType === "WICKET" || wicketType === "RUN_OUT" || wicketType === "STUMPED")
            ? newBatterId
            : null,

        newBowlerId: isNewOver ? newBowlerId : null,

        // ✅ Legal Ball (determines if counted towards over)
        // Wide & No Ball are illegal balls (not counted)
        // Everything else is legal
        legalBall:
          ballType !== "WIDE" && ballType !== "NO_BALL",
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/ball-by-ball/record`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || errorData.message || "Failed to record ball");
        } catch {
          throw new Error(text || "Failed to record ball");
        }
      }

      toast.success("Ball recorded");
      resetForm();
      onBallRecorded?.();

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <Card>
      <CardContent className="p-4 space-y-5">

        <h3 className="text-lg font-semibold">Record Ball</h3>

        {/* NEW OVER */}
        {isNewOver && (
          <div className="p-3 rounded border bg-yellow-50">
            <p className="text-sm font-semibold text-yellow-700 mb-2">
              New Over – Select Bowler
            </p>
            <Select onValueChange={setNewBowlerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select new bowler" />
              </SelectTrigger>
              <SelectContent>
                {newBowlerOptions.map((id) => {
                  const p = findPlayer(id);
                  return (
                    <SelectItem key={id} value={id}>
                      {p?.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* BALL TYPE */}
        <div>
          <p className="text-sm font-medium">Ball Type</p>
          <div className="flex gap-2 flex-wrap">
            {["RUN", "BOUNDARY", "WIDE", "NO_BALL", "WICKET", "EXTRAS"].map((t) => (
              <Button
                key={t}
                variant={ballType === t ? "default" : "outline"}
                onClick={() => {
                  setBallType(t);
                  // Reset extras type when switching
                  if (t !== "EXTRAS") {
                    setExtrasType("");
                    setExtrasRuns(0);
                  }
                }}
              >
                {t.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* RUNS */}
        {(ballType === "RUN" || (ballType === "NO_BALL" && boundaryRuns !== 6) || wicketType === "RUN_OUT") && ballType !== "WIDE" && wicketType !== "STUMPED" && (
          <div>
            <p className="text-sm font-medium">Runs</p>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((r) => (
                <Button
                  key={r}
                  variant={runs === r ? "default" : "outline"}
                  onClick={() => setRuns(runs === r ? null : r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* BOUNDARY */}
        {(ballType === "BOUNDARY" || ballType === "NO_BALL") && (
          <div>
            <p className="text-sm font-medium">Boundary</p>
            <div className="flex gap-2 mb-2">
              {[4, 6].map((r) => (
                <Button
                  key={r}
                  variant={boundaryRuns === r ? "default" : "outline"}
                  onClick={() => {
                    if (boundaryRuns === r) {
                      // Toggle off
                      setBoundaryRuns(null);
                    } else {
                      // Toggle on
                      setBoundaryRuns(r);
                      setRunningRuns(0);
                    }
                  }}
                >
                  {r}
                </Button>
              ))}
            </div>

            {/* {boundaryRuns === 4 && (
              <div>
                <p className="text-sm">Overthrow Runs</p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((r) => (
                    <Button
                      key={r}
                      variant={runningRuns === r ? "default" : "outline"}
                      onClick={() => setRunningRuns(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        )}

        {/* WIDE EXTRAS */}
        {ballType === "WIDE" && wicketType !== "STUMPED" && (
          <div>
            <p className="text-sm font-medium">Wide Runs</p>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((r) => (
                <Button
                  key={r}
                  variant={extraRuns === r ? "default" : "outline"}
                  onClick={() => setExtraRuns(extraRuns === r ? null : r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* EXTRAS (BYE / LEG BYE) */}
        {ballType === "EXTRAS" && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Extra Type</p>
              <div className="flex gap-2">
                {["B", "LB"].map((type) => (
                  <Button
                    key={type}
                    variant={extrasType === type ? "default" : "outline"}
                    onClick={() => {
                      setExtrasType(extrasType === type ? "" : type);
                      setExtrasRuns(0);
                    }}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {extrasType && (
              <div>
                <p className="text-sm font-medium">Runs</p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4,5,6,7,8].map((r) => (
                    <Button
                      key={r}
                      variant={extrasRuns === r ? "default" : "outline"}
                      onClick={() => setExtrasRuns(extrasRuns === r ? 0 : r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WICKET TYPE */}
        {(ballType === "WICKET" ||
          ballType === "WIDE" ||
          ballType === "NO_BALL") && (
          <div>
            <p className="text-sm font-medium">Wicket Type</p>
            <Select onValueChange={setWicketType}>
              <SelectTrigger>
                <SelectValue placeholder="Select wicket type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RUN_OUT">Run Out</SelectItem>
                {ballType === "WICKET" && (
                  <>
                    <SelectItem value="BOWLED">Bowled</SelectItem>
                    <SelectItem value="LBW">LBW</SelectItem>
                    <SelectItem value="CAUGHT">Caught</SelectItem>
                    <SelectItem value="STUMPED">Stumped</SelectItem>
                  </>
                )}
                {ballType === "WIDE" && (
                  <SelectItem value="STUMPED">Stumped</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* RUN OUT END */}
        {wicketType === "RUN_OUT" && (
          <div>
            <p className="text-sm font-medium">Run Out End</p>
            <Select onValueChange={setRunOutEnd}>
              <SelectTrigger>
                <SelectValue placeholder="Select end" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STRIKER">Striker</SelectItem>
                <SelectItem value="NON_STRIKER">Non-Striker</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* OUT BATTER */}
        {wicketType === "RUN_OUT" && (
          <div>
            <p className="text-sm font-medium">Out Batter</p>
            <Select onValueChange={setOutBatterId}>
              <SelectTrigger>
                <SelectValue placeholder="Select batter out" />
              </SelectTrigger>
              <SelectContent>
                {[matchScore.strikerId, matchScore.nonStrikerId].map((id) => (
                  <SelectItem key={id} value={id}>
                    {formatBatterName(id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* FIELDER */}
        {["CAUGHT", "RUN_OUT", "STUMPED"].includes(wicketType) && (
          <div>
            <p className="text-sm font-medium">Fielder</p>
            <Select onValueChange={setFielderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select fielder" />
              </SelectTrigger>
              <SelectContent>
                {fielderOptions.map((id) => {
                  const p = findPlayer(id);
                  return (
                    <SelectItem key={id} value={id}>
                      {p?.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* NEW BATTER */}
        {(ballType === "WICKET" || wicketType === "RUN_OUT" || wicketType === "STUMPED") && (
          <div>
            <p className="text-sm font-medium">New Batter</p>
            <Select onValueChange={setNewBatterId}>
              <SelectTrigger>
                <SelectValue placeholder="Select new batter" />
              </SelectTrigger>
              <SelectContent>
                {newBatterOptions.map((id) => (
                  <SelectItem key={id} value={id}>
                    {formatBatterName(id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button className="w-full" disabled={loading} onClick={recordBall}>
          Confirm Ball
        </Button>

      </CardContent>
    </Card>
  );
}
