import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/api/axios";
import PublicHeader from "@/components/public/PublicHeader";

export default function PublicBrowseTeams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const normalizeTeams = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const normalizeAndSort = (items) =>
    [...items]
      .filter((team) => team?.id || team?._id || team?.name)
      .sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));

  const loadTeamsFromPublicMatches = async () => {
    const [liveRes, upcomingRes, completedRes] = await Promise.all([
      api.get("/api/matches/public/LIVE").catch(() => null),
      api.get("/api/matches/public/UPCOMING").catch(() => null),
      api.get("/api/matches/public/COMPLETED").catch(() => null),
    ]);

    const matches = [
      ...(Array.isArray(liveRes?.data) ? liveRes.data : []),
      ...(Array.isArray(upcomingRes?.data) ? upcomingRes.data : []),
      ...(Array.isArray(completedRes?.data) ? completedRes.data : []),
    ];

    const teamIds = [...new Set(
      matches
        .flatMap((m) => [m?.teamAId, m?.teamBId, m?.team1Id, m?.team2Id, m?.teamA?.id, m?.teamB?.id, m?.team1?.id, m?.team2?.id])
        .filter(Boolean)
    )];

    if (teamIds.length === 0) return [];

    const details = await Promise.all(
      teamIds.map(async (id) => {
        try {
          const res = await api.get(`/api/teams/${id}/details`);
          const t = res?.data;
          if (!t) return null;
          return {
            id: t.id || id,
            name: t.name || "Unnamed Team",
            logoUrl: t.logoUrl || null,
          };
        } catch {
          return null;
        }
      })
    );

    return details.filter(Boolean);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (search.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await api.get(`/api/teams/search?name=${encodeURIComponent(search.trim())}`);
        setSearchResults(res?.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const loadTeams = async () => {
    try {
      const res = await api.get("/api/teams");
      const items = normalizeAndSort(normalizeTeams(res?.data));

      if (items.length > 0) {
        setTeams(items);
        return;
      }

      const fallbackItems = normalizeAndSort(await loadTeamsFromPublicMatches());
      setTeams(fallbackItems);
    } catch (err) {
      console.error("Failed to load teams", err);
      try {
        const fallbackItems = normalizeAndSort(await loadTeamsFromPublicMatches());
        setTeams(fallbackItems);
      } catch {
        setTeams([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const visibleTeams = useMemo(() => {
    if (search.trim().length >= 3) return searchResults;
    return teams.slice(0, 24);
  }, [search, searchResults, teams]);

  return (
    <div className="min-h-screen bg-slate-100">
      <PublicHeader />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold">Browse Teams</h2>
        <p className="text-sm text-slate-600 mt-1">Search teams by name or browse a quick list.</p>

        <div className="mt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team name (min 3 chars)"
            className="w-full sm:max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
        </div>

        {loading && <p className="mt-5 text-slate-600">Loading teams...</p>}
        {!loading && searchLoading && <p className="mt-5 text-slate-600">Searching teams...</p>}
        {!loading && !searchLoading && visibleTeams.length === 0 && (
          <p className="mt-5 text-slate-600">No teams found.</p>
        )}

        {!loading && !searchLoading && visibleTeams.length > 0 && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleTeams.map((team) => (
              <Card
                key={team.id || team._id || team.name}
                className="border border-slate-300 cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/browse/teams/${team.id || team._id}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name || "Team"} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-200" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{team.name || "Unnamed Team"}</p>
                    <p className="text-xs text-slate-500">View team details</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
