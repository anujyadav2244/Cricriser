import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api from "@/api/axios";
import { toast } from "sonner";

export default function StartInnings() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [score, setScore] = useState(null);
  const [battingXI, setBattingXI] = useState([]);
  const [bowlingXI, setBowlingXI] = useState([]);

  const [innings, setInnings] = useState(1);
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");

  useEffect(() => {
    loadScore();
  }, []);

  const loadScore = async () => {
    try {
      const res = await api.get(`/api/match/score/${matchId}`);
      setScore(res.data);

      const battingTeam =
        res.data.innings === 2
          ? res.data.battingTeamId
          : res.data.tossDecision === "BAT"
          ? res.data.tossWinner
          : res.data.team1Id === res.data.tossWinner
          ? res.data.team2Id
          : res.data.team1Id;

      const bowlingTeam =
        battingTeam === res.data.team1Id
          ? res.data.team2Id
          : res.data.team1Id;

      setBattingXI(
        battingTeam === res.data.team1Id
          ? res.data.team1PlayingXI
          : res.data.team2PlayingXI
      );

      setBowlingXI(
        bowlingTeam === res.data.team1Id
          ? res.data.team1PlayingXI
          : res.data.team2PlayingXI
      );
    } catch {
      toast.error("Failed to load match score");
    }
  };

  const startInnings = async () => {
    if (!striker || !nonStriker || !bowler) {
      toast.error("Select striker, non-striker and bowler");
      return;
    }

    if (striker === nonStriker) {
      toast.error("Striker and non-striker cannot be same");
      return;
    }

    try {
      await api.post("/api/match/score/start-innings", {
        matchId,
        innings,
        strikerId: striker,
        nonStrikerId: nonStriker,
        currentBowlerId: bowler
      });

      toast.success("Innings started");
      navigate(`/admin/match/${matchId}/live`);
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to start innings");
    }
  };

  if (!score) {
    return <div className="p-6">Loading innings setup…</div>;
  }

  return (
    <div className="min-h-screen bg-[#0F172A] p-6 space-y-6 text-[#E5E7EB]">

      <h1 className="text-2xl font-bold">Start Innings</h1>

      <Separator className="bg-slate-700" />

      {/* INNINGS */}
      <Card className="bg-[#020617]">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Innings</h3>

          <select
            className="w-full p-2 bg-[#020617] border border-slate-600"
            value={innings}
            onChange={(e) => setInnings(Number(e.target.value))}
          >
            <option value={1}>First Innings</option>
            <option value={2}>Second Innings</option>
          </select>
        </CardContent>
      </Card>

      {/* BATTERS */}
      <SelectCard
        title="Striker"
        list={battingXI}
        value={striker}
        onChange={setStriker}
      />

      <SelectCard
        title="Non-Striker"
        list={battingXI}
        value={nonStriker}
        onChange={setNonStriker}
      />

      {/* BOWLER */}
      <SelectCard
        title="Opening Bowler"
        list={bowlingXI}
        value={bowler}
        onChange={setBowler}
      />

      <Button
        className="bg-orange-500 w-full"
        onClick={startInnings}
      >
        Start Innings
      </Button>
    </div>
  );
}

/* ================= SELECT CARD ================= */
function SelectCard({ title, list, value, onChange }) {
  return (
    <Card className="bg-[#020617]">
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold">{title}</h3>

        <select
          className="w-full p-2 bg-[#020617] border border-slate-600"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select</option>
          {list.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </CardContent>
    </Card>
  );
}
