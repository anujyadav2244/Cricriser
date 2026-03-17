import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { leagueApi } from "@/api/league.api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    leagueApi
      .getAll()
      .then((res) => setLeagues(res.data))
      .catch(() => toast.error("Failed to load leagues"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#d8dade] text-[#E5E7EB] flex items-center justify-center">
        Loading leagues...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dbdee7] p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Leagues</h1>

        <Button
          onClick={() => navigate("/admin/leagues/create")}
          className="bg-[#F97316] hover:bg-[#ea6a0f] flex gap-2"
        >
          <Plus size={16} />
          Create League
        </Button>
      </div>

      {/* GRID */}
      {leagues.length === 0 ? (
        <p className="text-slate-400">No leagues created yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <Card
              key={league.id}
              onClick={() => navigate(`/admin/leagues/${league.id}`)}
              className="cursor-pointer bg-[#F8FAFC] hover:shadow-xl transition"
            >
              <CardContent className="p-5 space-y-4">
                {/* LOGO + NAME */}
                <div className="flex items-center gap-4">
                  {league.logoUrl && (
                    <img
                      src={league.logoUrl}
                      alt="logo"
                      className="h-12 w-12 object-contain"
                    />
                  )}

                  <div>
                    <h2 className="font-semibold text-lg text-[#020617]">
                      {league.name}
                    </h2>
                    <p className="text-sm text-[#475569]">
                      {league.leagueType} • {league.leagueFormat}
                    </p>
                  </div>
                </div>

                {/* META */}
                <div className="text-sm text-[#475569]">
                  {formatDate(league.startDate)} → {formatDate(league.endDate)}
                </div>

                {/* CTA */}
                <div className="text-sm font-medium text-[#F97316]">
                  View League →
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
