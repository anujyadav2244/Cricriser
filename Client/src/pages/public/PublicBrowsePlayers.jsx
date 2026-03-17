import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/api/axios";

export default function PublicBrowsePlayers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [featuredPlayers, setFeaturedPlayers] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadFeaturedPlayers();
  }, []);

  useEffect(() => {
    if (search.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await api.get(`/api/players/search?email=${encodeURIComponent(search.trim())}`);
        setSearchResults(res?.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const loadFeaturedPlayers = async () => {
    try {
      const [liveRes, upcomingRes] = await Promise.all([
        api.get("/api/matches/public/LIVE"),
        api.get("/api/matches/public/UPCOMING"),
      ]);

      const matchIds = [...(liveRes?.data || []), ...(upcomingRes?.data || [])]
        .map((m) => m?.id)
        .filter(Boolean)
        .slice(0, 4);

      if (matchIds.length === 0) {
        setFeaturedPlayers([]);
        return;
      }

      const statResponses = await Promise.all(
        matchIds.map((id) => api.get(`/api/match-player-stats/match/${id}`).catch(() => null))
      );

      const playerIds = [
        ...new Set(
          statResponses
            .flatMap((res) => (Array.isArray(res?.data) ? res.data : []))
            .map((stat) => stat?.playerId)
            .filter(Boolean)
        ),
      ].slice(0, 16);

      if (playerIds.length === 0) {
        setFeaturedPlayers([]);
        return;
      }

      const players = await Promise.all(
        playerIds.map(async (id) => {
          try {
            const res = await api.get(`/api/players/${id}`);
            return res?.data || null;
          } catch {
            return null;
          }
        })
      );

      setFeaturedPlayers(players.filter(Boolean));
    } catch (err) {
      console.error("Failed to load featured players", err);
      setFeaturedPlayers([]);
    } finally {
      setLoadingFeatured(false);
    }
  };

  const visiblePlayers = useMemo(() => {
    if (search.trim().length >= 3) return searchResults;
    return featuredPlayers;
  }, [search, searchResults, featuredPlayers]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-black cursor-pointer tracking-tight" onClick={() => navigate("/")}>
            Cricriser
          </h1>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <button onClick={() => navigate("/")}>Live Scores</button>
            <button onClick={() => navigate("/matches/schedule")}>Schedule</button>
            <button onClick={() => navigate("/matches/archive")}>Archives</button>
            <button onClick={() => navigate("/login")} className="bg-white text-teal-700 px-4 py-1.5 rounded-full">
              Login
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold">Browse Players</h2>
        <p className="text-sm text-slate-600 mt-1">
          Search players by email or pick from players seen in recent public matches.
        </p>

        <div className="mt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by player email (min 3 chars)"
            className="w-full sm:max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
          />
        </div>

        {searchLoading && <p className="mt-5 text-slate-600">Searching players...</p>}
        {!searchLoading && loadingFeatured && search.trim().length < 3 && (
          <p className="mt-5 text-slate-600">Loading players...</p>
        )}
        {!searchLoading && !loadingFeatured && visiblePlayers.length === 0 && (
          <p className="mt-5 text-slate-600">No players found.</p>
        )}

        {!searchLoading && visiblePlayers.length > 0 && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visiblePlayers.map((player) => (
              <Card
                key={player.id}
                className="border border-slate-300 cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/players/${player.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.name || "Player"} className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-slate-200" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{player.name || "Unnamed Player"}</p>
                    <p className="text-xs text-slate-600 truncate">
                      {player.teamName || "-"} {player.role ? `| ${player.role}` : ""}
                    </p>
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
