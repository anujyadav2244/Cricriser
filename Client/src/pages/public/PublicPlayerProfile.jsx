import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/api/axios";

export default function PublicPlayerProfile() {
  const { playerId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("matchId");

  const initialPlayer = location.state?.player || null;
  const [player, setPlayer] = useState(initialPlayer);
  const [teamName, setTeamName] = useState("-");
  const [careerStats, setCareerStats] = useState(null);
  const [loadingCareer, setLoadingCareer] = useState(true);
  const [activeTab, setActiveTab] = useState("INFO");

  useEffect(() => {
    let ignore = false;

    const loadPlayer = async () => {
      if (initialPlayer) return;
      try {
        console.log("Fetching...")
        const res = await api.get(`/api/players/${playerId}`);
        if (!ignore) setPlayer(res.data || null);
        console.log(res.data)
      } catch (_) {
        if (!ignore) setPlayer(null);
      }
    };

    const loadCareer = async () => {
      try {
        const res = await api.get(`/api/player-stats/${playerId}`);
        if (!ignore) setCareerStats(res.data || null);
        // console.log(res.data)
      } catch (_) {
        if (!ignore) setCareerStats(null);
      } finally {
        if (!ignore) setLoadingCareer(false);
      }
    };

    loadPlayer();
    loadCareer();
    return () => {
      ignore = true;
    };
  }, [matchId, playerId]);

  useEffect(() => {
    if (initialPlayer) setPlayer(initialPlayer);
  }, [initialPlayer]);

  useEffect(() => {
    let ignore = false;

    const loadTeamName = async () => {
      if (!player?.currentTeamId) {
        if (!ignore) setTeamName("-");
        return;
      }

      try {
        const res = await api.get(`/api/teams/${player.currentTeamId}/details`);
        if (!ignore) {
          setTeamName(res?.data?.name || player.currentTeamId);
        }
      } catch (_) {
        if (!ignore) {
          setTeamName(player.currentTeamId);
        }
      }
    };

    loadTeamName();
    return () => {
      ignore = true;
    };
  }, [player?.currentTeamId]);

  const fmt = (val, digits = 2) => {
    if (val === null || val === undefined) return "0";
    const num = Number(val);
    if (Number.isNaN(num)) return String(val);
    return num.toFixed(digits);
  };

  const battingRows = [
    { label: "Matches", value: careerStats?.matches ?? 0 },
    { label: "Innings", value: careerStats?.innings ?? 0 },
    { label: "Runs", value: careerStats?.runsScored ?? 0 },
    { label: "Balls", value: careerStats?.ballsFaced ?? 0 },
    { label: "Highest", value: careerStats?.highestScore ?? 0 },
    { label: "Average", value: fmt(careerStats?.battingAverage) },
    { label: "Strike Rate", value: fmt(careerStats?.battingStrikeRate) },
    { label: "Fours", value: careerStats?.fours ?? 0 },
    { label: "Sixes", value: careerStats?.sixes ?? 0 },
    { label: "50s", value: careerStats?.fifties ?? 0 },
    { label: "100s", value: careerStats?.hundreds ?? 0 },
  ];

  const bowlingRows = [
    { label: "Matches", value: careerStats?.matches ?? 0 },
    { label: "Innings", value: careerStats?.innings ?? 0 },
    { label: "Balls", value: careerStats?.ballsBowled ?? 0 },
    { label: "Runs Conceded", value: careerStats?.runsConceded ?? 0 },
    { label: "Wickets", value: careerStats?.wickets ?? 0 },
    { label: "Economy", value: fmt(careerStats?.economy) },
    { label: "Average", value: fmt(careerStats?.bowlingAverage) },
    { label: "Strike Rate", value: fmt(careerStats?.bowlingStrikeRate) },
    { label: "Wides", value: careerStats?.wides ?? 0 },
    { label: "No Balls", value: careerStats?.noBalls ?? 0 },
    { label: "Best Figures", value: careerStats?.bestBowlingFigures || "0/0" },
    { label: "5W Hauls", value: careerStats?.fiveWicketHauls ?? 0 },
  ];

  const infoRows = [
    { label: "Name", value: player?.name || "-" },
    { label: "Role", value: player?.role || "-" },
    { label: "Batting Style", value: player?.battingStyle || "-" },
    { label: "Bowling Type", value: player?.bowlingType || "-" },
    { label: "Bowling Style", value: player?.bowlingStyle || "-" },
    { label: "Bowling Hand", value: player?.bowlingHand || "-" },
    { label: "Current Team", value: teamName },
  ];

  return (
    <div className="min-h-screen bg-slate-100 py-6">
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        <Link to={matchId ? `/match/${matchId}` : "/"} className="text-slate-600 hover:text-slate-900 text-sm">
          Back
        </Link>

        <Card className="border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-emerald-600 text-white p-5">
            <div className="flex items-center gap-4">
              <img
                src={player?.photoUrl || "/default-player.png"}
                alt={player?.name || "Player"}
                className="h-16 w-16 rounded-lg object-cover border border-emerald-300"
              />
              <div>
                <h1 className="text-3xl font-bold">{player?.name || "Player Profile"}</h1>
                <p className="text-emerald-100">{player?.role || "-"}</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-600 px-4">
            <div className="flex gap-5 overflow-x-auto">
              {["INFO", "BATTING", "BOWLING"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-lg font-semibold whitespace-nowrap border-b-4 ${
                    activeTab === tab
                      ? "text-white border-white"
                      : "text-emerald-100 border-transparent hover:text-white"
                  }`}
                >
                  {tab[0] + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <CardContent className="p-0 bg-white">
            {activeTab === "INFO" && (
              <div className="p-4">
                <h2 className="text-xl font-bold text-slate-900 mb-3">Personal Information</h2>
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  {infoRows.map((row, idx) => (
                    <div
                      key={row.label}
                      className={`grid grid-cols-2 ${idx % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b last:border-b-0 border-slate-200`}
                    >
                      <p className="p-3 text-slate-600">{row.label}</p>
                      <p className="p-3 text-slate-900 font-medium">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab !== "INFO" && loadingCareer && (
              <div className="p-6 text-slate-600">Loading career stats...</div>
            )}

            {activeTab !== "INFO" && !loadingCareer && !careerStats && (
              <div className="p-6 text-slate-600">No career stats available.</div>
            )}

            {activeTab === "BATTING" && !loadingCareer && careerStats && (
              <div className="p-4">
                <h2 className="text-xl font-bold text-slate-900 mb-3">Batting</h2>
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  {battingRows.map((row, idx) => (
                    <div
                      key={row.label}
                      className={`grid grid-cols-2 ${idx % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b last:border-b-0 border-slate-200`}
                    >
                      <p className="p-3 text-slate-600">{row.label}</p>
                      <p className="p-3 text-slate-900 font-medium">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "BOWLING" && !loadingCareer && careerStats && (
              <div className="p-4">
                <h2 className="text-xl font-bold text-slate-900 mb-3">Bowling</h2>
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  {bowlingRows.map((row, idx) => (
                    <div
                      key={row.label}
                      className={`grid grid-cols-2 ${idx % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b last:border-b-0 border-slate-200`}
                    >
                      <p className="p-3 text-slate-600">{row.label}</p>
                      <p className="p-3 text-slate-900 font-medium">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
