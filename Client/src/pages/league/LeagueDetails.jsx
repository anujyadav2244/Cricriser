import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LeagueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [league, setLeague] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchScores, setMatchScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        /* ================= FETCH LEAGUE ================= */
        const leagueRes = await fetch(
          `http://localhost:8080/api/leagues/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!leagueRes.ok) {
          throw new Error("Failed to load league");
        }

        const leagueData = await leagueRes.json();
        setLeague(leagueData);

        /* ================= FETCH MATCHES ================= */
        const matchRes = await fetch(
          `http://localhost:8080/api/matches/league/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!matchRes.ok) {
          throw new Error("Failed to load matches");
        }

        const matchData = await matchRes.json();
        setMatches(matchData);

        const scorePairs = await Promise.all(
          (matchData || []).map(async (m) => {
            try {
              const scoreRes = await fetch(
                `http://localhost:8080/api/match/score/${m.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!scoreRes.ok) {
                return [m.id, null];
              }

              const text = await scoreRes.text();
              return [m.id, text ? JSON.parse(text) : null];
            } catch {
              return [m.id, null];
            }
          })
        );

        setMatchScores(Object.fromEntries(scorePairs));

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="League Details">
        <p className="text-slate-400">Loading league...</p>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="League Details">
        <p className="text-red-500">{error}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={league.name}
      subtitle={`Type: ${league.leagueType}`}
      backTo="/admin/leagues"
    >
      <div className="space-y-6">

        {/* ================= BASIC INFO ================= */}
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-6 space-y-2">
            <p><strong>Admin :</strong> {league.adminEmail}</p>

            <p><strong>Tour :</strong> {league.tour || "—"}</p>

            <p>
              <strong>Dates :</strong>{" "}
              {league.startDate
                ? new Date(league.startDate).toDateString()
                : "—"}{" "}
              –{" "}
              {league.endDate
                ? new Date(league.endDate).toDateString()
                : "—"}
            </p>

            <p>
              <strong>Overs per innings :</strong>{" "}
              {league.oversPerInnings ?? "—"}
            </p>

            <p>
              <strong>No. of Matches :</strong>{" "}
              {league.noOfMatches ?? "—"}
            </p>

            <p>
              <strong>Umpires :</strong>{" "}
              {league.umpires && league.umpires.length > 0
                ? league.umpires.join(", ")
                : "—"}
            </p>
          </CardContent>
        </Card>

        {/* ================= TEAMS ================= */}
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Teams</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {league.teamDetails?.map((team) => (
                <div
                  key={team.id}
                  className="p-4 bg-slate-800 rounded-lg flex justify-between items-center"
                >
                  <span>{team.name}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      navigate(`/admin/teams/${team.id}`)
                    }
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ================= MATCHES ================= */}
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Scheduled Matches
            </h2>

            {matches.length === 0 && (
              <p className="text-slate-400">
                No matches scheduled yet
              </p>
            )}

            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.id} className="p-4 bg-slate-800 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Match {m.matchNo} ({m.matchType})
                    </p>

                    <p className="text-sm text-slate-400">
                      {m.scheduledDate
                        ? new Date(m.scheduledDate).toDateString()
                        : "—"}
                    </p>

                    <p className="text-sm font-medium">
                      {m.team1Name} vs {m.team2Name}
                    </p>

                    {matchScores[m.id] && (
                      <p className="text-sm text-emerald-300">
                        {m.team1Name}: {matchScores[m.id].team1Runs}/{matchScores[m.id].team1Wickets} ({matchScores[m.id].team1Overs} ov) |{" "}
                        {m.team2Name}: {matchScores[m.id].team2Runs}/{matchScores[m.id].team2Wickets} ({matchScores[m.id].team2Overs} ov)
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm px-3 py-1 rounded bg-emerald-700">
                      {m.status}
                    </span>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        navigate(`/admin/leagues/${league.id}/match/${m.id}/update`)
                      }
                    >
                      Update
                    </Button>

                    <Button
                      size="sm"
                      onClick={() =>
                        navigate(`/admin/leagues/${league.id}/match/${m.id}`)
                      }
                    >
                      Scoreboard
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ================= ACTIONS ================= */}
        <div className="flex gap-4">
          <Button
            onClick={() =>
              navigate(`/admin/leagues/update/${league.id}`)
            }
          >
            Update League
          </Button>

          <Button
            variant="destructive"
            onClick={() =>
              navigate(`/admin/leagues/delete/${league.id}`)
            }
          >
            Delete League
          </Button>
        </div>

      </div>
    </DashboardLayout>
  );
}
