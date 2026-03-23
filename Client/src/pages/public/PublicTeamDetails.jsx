import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { humanizeText } from "@/lib/utils";
import PublicHeader from "@/components/public/PublicHeader";

export default function PublicTeamDetails() {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTeam = async () => {
      try {
        setLoading(true);
        setError("");
        const detailsRes = await api.get(`/api/teams/${teamId}/details`).catch(() => null);
        const rawRes = await api.get(`/api/teams/${teamId}`).catch(() => null);

        const rawTeam = rawRes?.data || null;
        let nextTeam = detailsRes?.data || null;

        if (!nextTeam && rawTeam) {
          nextTeam = {
            id: rawTeam.id || teamId,
            name: rawTeam.name || "Unnamed Team",
            coach: rawTeam.coach || "",
            logoUrl: rawTeam.logoUrl || null,
            players: [],
          };
        }

        const hasDetailedPlayers = Array.isArray(nextTeam?.players) && nextTeam.players.length > 0;
        const squadPlayerIds = Array.isArray(rawTeam?.squadPlayerIds) ? rawTeam.squadPlayerIds : [];

        if (!hasDetailedPlayers && squadPlayerIds.length > 0) {
          const playerEntries = await Promise.all(
            squadPlayerIds.map(async (playerId) => {
              try {
                const playerRes = await api.get(`/api/players/${playerId}`);
                const player = playerRes?.data;
                if (!player) return null;
                return {
                  ...player,
                  id: player.id || playerId,
                };
              } catch {
                return null;
              }
            })
          );

          nextTeam = {
            ...(nextTeam || {}),
            id: nextTeam?.id || rawTeam?.id || teamId,
            name: nextTeam?.name || rawTeam?.name || "Unnamed Team",
            coach: nextTeam?.coach || rawTeam?.coach || "",
            logoUrl: nextTeam?.logoUrl || rawTeam?.logoUrl || null,
            players: playerEntries.filter(Boolean),
          };
        }

        setTeam(nextTeam);
      } catch (err) {
        setTeam(null);
        setError(err?.response?.data?.message || "Failed to load team details");
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      loadTeam();
    }
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <PublicHeader />
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-slate-600">Loading team details...</p>
        </section>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-slate-100">
        <PublicHeader />
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          <Button variant="outline" onClick={() => navigate("/browse/teams")}>Back to Teams</Button>
          <Card className="border border-slate-300">
            <CardContent className="p-6">
              <p className="text-red-600">{error || "Team not found"}</p>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  const squad = Array.isArray(team?.players)
    ? team.players
    : Array.isArray(team?.squad)
      ? team.squad
      : [];

  return (
    <div className="min-h-screen bg-slate-100">
      <PublicHeader />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Button variant="outline" onClick={() => navigate("/browse/teams")}>Back to Teams</Button>

        <Card className="border border-slate-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name || "Team"} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-slate-200" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{team.name || "Unnamed Team"}</h2>
                <p className="text-sm text-slate-600 mt-1">Coach: {team.coach || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-300">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900">Squad</h3>

            {squad.length === 0 ? (
              <p className="mt-3 text-slate-600">No squad players available.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {squad.map((player) => (
                  <div
                    key={player.id || player._id || player.name}
                    className="rounded-md border border-slate-200 bg-white p-3 flex items-center gap-3"
                  >
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.name || "Player"}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-slate-200" />
                    )}

                    <div className="min-w-0">
                      {player.id ? (
                        <Link
                          to={`/players/${player.id}`}
                          className="font-semibold text-slate-900 hover:text-teal-700 hover:underline truncate block"
                        >
                          {player.name || "Unnamed Player"}
                        </Link>
                      ) : (
                        <p className="font-semibold text-slate-900 truncate">{player.name || "Unnamed Player"}</p>
                      )}
                      <p className="text-xs text-slate-600">{humanizeText(player.role) || "-"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
