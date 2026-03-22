import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { humanizeText } from "@/lib/utils";
import BASE_URL from "@/api/config";

export default function AddMatchScoreForm({
  matchDetails,
  onSuccess,
}) {
  const { matchId, leagueId, team1, team2 } = matchDetails;

  const [tossWinner, setTossWinner] = useState("");
  const [tossDecision, setTossDecision] = useState("Bat");

  const [team1XI, setTeam1XI] = useState([]);
  const [team2XI, setTeam2XI] = useState([]);

  const [loading, setLoading] = useState(false);

  /* ================= PLAYER TOGGLE LOGIC ================= */

  const togglePlayer = (team, playerId) => {
    if (team === "team1") {
      setTeam1XI((prev) => {
        if (prev.includes(playerId)) {
          return prev.filter((id) => id !== playerId);
        }
        if (prev.length >= 11) {
          toast.error("Team 1 Playing XI must be exactly 11");
          return prev;
        }
        return [...prev, playerId];
      });
    } else {
      setTeam2XI((prev) => {
        if (prev.includes(playerId)) {
          return prev.filter((id) => id !== playerId);
        }
        if (prev.length >= 11) {
          toast.error("Team 2 Playing XI must be exactly 11");
          return prev;
        }
        return [...prev, playerId];
      });
    }
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {

    const token = localStorage.getItem("token");
    if(!token) {
        console.log("Token Missing");
        return;
    }

    if (!tossWinner) {
      toast.error("Select toss winner");
      return;
    }

    if (team1XI.length !== 11 || team2XI.length !== 11) {
      toast.error("Both teams must have exactly 11 players");
      return;
    }

    const payload = {
      matchId,
      leagueId,

      team1Id: team1.id,
      team2Id: team2.id,

      tossWinner,
      tossDecision,

      matchStatus: "Match In Progress",

      team1PlayingXI: team1XI,
      team2PlayingXI: team2XI,
    };

    try { 
      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/api/match/score/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization":`Bearer ${token}`
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to add score");
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      toast.success("Match score added successfully");
      onSuccess(data);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <Card className="max-w-6xl mx-auto mt-6">
      <CardContent className="p-6 space-y-6">

        <h2 className="text-xl font-semibold">
          Add Match Score
        </h2>

        {/* ================= TOSS ================= */}
        <div className="space-y-2">
          <p className="font-medium">Toss Winner</p>

          <div className="flex gap-6">
            <label>
              <input
                type="radio"
                name="tossWinner"
                value={team1.id}
                onChange={() => setTossWinner(team1.id)}
              />{" "}
              {team1.name}
            </label>

            <label>
              <input
                type="radio"
                name="tossWinner"
                value={team2.id}
                onChange={() => setTossWinner(team2.id)}
              />{" "}
              {team2.name}
            </label>
          </div>
        </div>

        {/* ================= TOSS DECISION ================= */}
        <div className="space-y-2">
          <p className="font-medium">Toss Decision</p>

          <div className="flex gap-6">
            <label>
              <input
                type="radio"
                name="tossDecision"
                value="Bat"
                checked={tossDecision === "Bat"}
                onChange={() => setTossDecision("Bat")}
              />{" "}
              Bat
            </label>

            <label>
              <input
                type="radio"
                name="tossDecision"
                value="Bowl"
                checked={tossDecision === "Bowl"}
                onChange={() => setTossDecision("Bowl")}
              />{" "}
              Bowl
            </label>
          </div>
        </div>

        {/* ================= PLAYING XI ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* TEAM 1 */}
          <TeamSelector
            title={`${team1.name} Playing XI (${team1XI.length}/11)`}
            squad={team1.squad}
            selected={team1XI}
            onToggle={(id) => togglePlayer("team1", id)}
          />

          {/* TEAM 2 */}
          <TeamSelector
            title={`${team2.name} Playing XI (${team2XI.length}/11)`}
            squad={team2.squad}
            selected={team2XI}
            onToggle={(id) => togglePlayer("team2", id)}
          />
        </div>

        <Button
          className="w-full"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "Saving..." : "Start Match"}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ================= TEAM SELECTOR ================= */

function TeamSelector({ title, squad, selected, onToggle }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>

      <div className="space-y-2 max-h-[420px] overflow-y-auto border p-3 rounded">
        {squad.map((p) => {
          const active = selected.includes(p.id);

          return (
            <div
              key={p.id}
              className={`flex justify-between items-center p-2 rounded cursor-pointer ${
                active
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100"
              }`}
              onClick={() => onToggle(p.id)}
            >
              <span>
                {p.name}
                <span className="text-xs ml-2 opacity-70">
                  ({humanizeText(p.role)})
                </span>
              </span>

              {active && <span>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
