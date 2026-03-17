import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { teamApi } from "@/api/team.api";

const ROLE_LABELS = {
  BATSMAN: "BATSMEN",
  ALL_ROUNDER: "ALL ROUNDERS",
  BOWLER: "BOWLERS",
  WICKET_KEEPER: "WICKET KEEPERS",
};

const ROLE_ALIASES = {
  BATTER: "BATSMAN",
  BATSMEN: "BATSMAN",
  ALLROUNDER: "ALL_ROUNDER",
  WICKETKEEPER: "WICKET_KEEPER",
  WK: "WICKET_KEEPER",
};

export default function TeamDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    teamApi
      .getDetails(id)
      .then((res) => {
        console.log("Team data loaded:", res.data); // Debug log
        setTeam(res.data);
      })
      .catch((err) => {
        console.error("Error loading team:", err); // Debug log
        toast.error("Failed to load team");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6">Loading team...</p>;
  if (!team) return <p className="p-6">Team not found</p>;

  const players = team.players || [];

  const normalizeRole = (role) => {
    const raw = String(role || "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");
    return ROLE_ALIASES[raw] || raw;
  };

  const groupedPlayers = players.reduce((acc, p) => {
    const normalizedRole = normalizeRole(p.role);
    acc[normalizedRole] = acc[normalizedRole] || [];
    acc[normalizedRole].push(p);
    return acc;
  }, {});

  const captainName =
    team.captainName ||
    players.find((p) => p.id === team.captainId)?.name ||
    "";
  const viceCaptainName =
    team.viceCaptainName ||
    players.find((p) => p.id === team.viceCaptainId)?.name ||
    "";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {team.logoUrl && (
            <img
              src={team.logoUrl}
              alt={team.name}
              className="h-16 w-16 rounded object-contain border"
            />
          )}
          <h1 className="text-3xl font-semibold">{team.name}</h1>
        </div>

        {!isAdmin && (
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/team-owner/teams/update/${team.id}`)
            }
          >
            Update Team
          </Button>
        )}
      </div>

      <Separator />

      {/* BASIC INFO */}
      <Card>
        <CardContent className="space-y-2 p-4 text-sm">
          <p>
            <b>Coach:</b>{" "}
            {team.coach || <span className="text-slate-400">Not set</span>}
          </p>

          <p>
            <b>Captain:</b>{" "}
            {captainName || <span className="text-slate-400">Not set</span>}
          </p>

          <p>
            <b>Vice Captain:</b>{" "}
            {viceCaptainName || (
              <span className="text-slate-400">Not set</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* SQUAD */}
      {Object.keys(ROLE_LABELS).map(
        (role) =>
          groupedPlayers[role]?.length > 0 && (
            <RoleSection
              key={role}
              title={ROLE_LABELS[role]}
              players={groupedPlayers[role]}
              isAdmin={isAdmin}   
            />
          )
      )}
      {Object.entries(groupedPlayers)
        .filter(([role]) => !ROLE_LABELS[role])
        .flatMap(([, list]) => list).length > 0 && (
        <RoleSection
          title="OTHERS"
          players={Object.entries(groupedPlayers)
            .filter(([role]) => !ROLE_LABELS[role])
            .flatMap(([, list]) => list)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

/* ================= ROLE SECTION ================= */

function RoleSection({ title, players, isAdmin }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={`px-3 py-1 text-sm font-semibold mb-4 rounded 
            ${isAdmin ? "bg-slate-800 text-white" : "bg-emerald-100 text-emerald-900"}
          `}
        >
          {title}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <img
                src={p.photoUrl || "/default-player.png"}
                className="h-12 w-12 rounded-full border object-cover"
              />
              <span className="font-medium">{p.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
