import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/api/axios";
import BASE_URL from "@/api/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TeamOwnerDashboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTeams = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Unauthorized");
        return;
      }

      try {
        const res = await axios.get(
          `${BASE_URL}/api/teams/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setTeams(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load teams");
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);
  if (loading) {
    return <p className="p-6">Loading teams...</p>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Team Owner Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>My Teams</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {teams.length === 0 && (
            <p className="text-slate-500">
              You haven’t created any teams yet.
            </p>
          )}

          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between border rounded p-3"
            >
              {/* LEFT SIDE */}
              <div className="flex items-center gap-4">
                {/* ✅ TEAM LOGO */}
                <img
                  src={team.logoUrl || "/default-team.png"}
                  alt={team.name}
                  className="h-14 w-14 rounded border object-contain"
                />

                <div>
                  <p className="font-semibold">{team.name}</p>
                  <p className="text-sm text-slate-500">
                    Coach: {team.coach}
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    navigate(`/team-owner/teams/${team.id}`)
                  }
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    navigate(`/team-owner/teams/delete/${team.id}`)
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
