import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api from "@/api/axios";
import { toast } from "sonner";

export default function MatchSetup() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [teams, setTeams] = useState({});
  const [team1XI, setTeam1XI] = useState([]);
  const [team2XI, setTeam2XI] = useState([]);

  const [tossWinner, setTossWinner] = useState("");
  const [tossDecision, setTossDecision] = useState("");

  useEffect(() => {
    loadMatch();
  }, []);

  const loadMatch = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Using token:", token);
      const res = await api.get(`/api/match/${matchId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("Match data:", res);
      setMatch(res.data);

      const team1 = await api.get(`/api/teams/${res.data.team1Id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("Team 1 data:", team1);
      const team2 = await api.get(`/api/teams/${res.data.team2Id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("Team 2 data:", team2);
      setTeams({
        team1: team1.data,
        team2: team2.data
      });
    } catch(error){
      console.log("Error loading match setup", error);
      toast.error("Failed to load match data");
    }
  };

  const togglePlayer = (team, playerId) => {
    const setter = team === 1 ? setTeam1XI : setTeam2XI;
    const list = team === 1 ? team1XI : team2XI;

    if (list.includes(playerId)) {
      setter(list.filter(p => p !== playerId));
    } else {
      if (list.length === 11) {
        toast.error("Playing XI must be exactly 11");
        return;
      }
      setter([...list, playerId]);
    }
  };

  const submitSetup = async () => {
    if (team1XI.length !== 11 || team2XI.length !== 11) {
      toast.error("Select 11 players for both teams");
      return;
    }

    if (!tossWinner || !tossDecision) {
      toast.error("Toss details required");
      return;
    }

    try {
      await api.post("/api/match/score/add", {
        matchId,
        leagueId: match.leagueId,
        team1Id: match.team1Id,
        team2Id: match.team2Id,
        team1PlayingXI: team1XI,
        team2PlayingXI: team2XI,
        tossWinner,
        tossDecision
      });

      toast.success("Match setup completed");
      navigate(`/admin/match/${matchId}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Setup failed");
    }
  };

  if (!match || !teams.team1 || !teams.team2) {
    return <div className="p-6">Loading match setup…</div>;
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 space-y-6 text-[#E5E7EB]">

      <h1 className="text-2xl font-bold">Match Setup</h1>

      <Separator className="bg-slate-700" />

      <TeamXI
        title={teams.team1.name}
        squad={teams.team1.squadPlayerIds}
        selected={team1XI}
        onToggle={(id) => togglePlayer(1, id)}
      />

      <TeamXI
        title={teams.team2.name}
        squad={teams.team2.squadPlayerIds}
        selected={team2XI}
        onToggle={(id) => togglePlayer(2, id)}
      />

      <Separator className="bg-slate-700" />

      {/* TOSS */}
      <Card className="bg-[#020617]">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Toss</h3>

          <select
            className="w-full p-2 bg-[#020617] border border-slate-600"
            value={tossWinner}
            onChange={(e) => setTossWinner(e.target.value)}
          >
            <option value="">Select Toss Winner</option>
            <option value={match.team1Id}>{teams.team1.name}</option>
            <option value={match.team2Id}>{teams.team2.name}</option>
          </select>

          <select
            className="w-full p-2 bg-[#020617] border border-slate-600"
            value={tossDecision}
            onChange={(e) => setTossDecision(e.target.value)}
          >
            <option value="">Toss Decision</option>
            <option value="BAT">Bat</option>
            <option value="BOWL">Bowl</option>
          </select>
        </CardContent>
      </Card>

      <Button
        className="bg-orange-500 w-full"
        onClick={submitSetup}
      >
        Confirm Match Setup
      </Button>

    </div>
  );
}

/* ================= TEAM XI ================= */
function TeamXI({ title, squad, selected, onToggle }) {
  return (
    <Card className="bg-[#020617]">
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold">
          {title} — Playing XI ({selected.length}/11)
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {squad.map((id) => (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className={`px-3 py-1 rounded text-sm ${
                selected.includes(id)
                  ? "bg-green-600"
                  : "bg-slate-700"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
