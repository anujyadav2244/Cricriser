import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/api/axios";
import { formatDate } from "@/lib/utils";

export default function PublicMatchSchedule() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [teamById, setTeamById] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  const getScheduledDate = (match) =>
    match.scheduledDate ||
    match.matchDate ||
    match.startDate ||
    match.startTime ||
    match.date ||
    match.dateTime ||
    null;

  const getTeamAId = (match) =>
    match.teamAId || match.team1Id || match.teamA?.id || match.team1?.id || null;

  const getTeamBId = (match) =>
    match.teamBId || match.team2Id || match.teamB?.id || match.team2?.id || null;

  const getTeamAName = (match) => {
    const id = getTeamAId(match);
    const directName = match.teamAName || match.team1Name || match.teamA?.name || match.team1?.name || null;
    const isIdLike = (value) => typeof value === "string" && (/^[a-f0-9]{24}$/i.test(value.trim()) || value === id);
    return (!isIdLike(directName) ? directName : null) || teamById[id]?.name || "TBD";
  };

  const getTeamBName = (match) => {
    const id = getTeamBId(match);
    const directName = match.teamBName || match.team2Name || match.teamB?.name || match.team2?.name || null;
    const isIdLike = (value) => typeof value === "string" && (/^[a-f0-9]{24}$/i.test(value.trim()) || value === id);
    return (!isIdLike(directName) ? directName : null) || teamById[id]?.name || "TBD";
  };

  const groupByLeague = (items) => {
    const grouped = new Map();
    items.forEach((match) => {
      const key = match.leagueName || "Other Matches";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(match);
    });
    return Array.from(grouped.entries()).map(([leagueName, groupedMatches]) => ({
      leagueName,
      matches: groupedMatches,
    }));
  };

  const loadSchedule = async () => {
    try {
      const [liveRes, upcomingRes] = await Promise.all([
        api.get("/api/matches/public/LIVE"),
        api.get("/api/matches/public/UPCOMING"),
      ]);

      const schedule = [...(liveRes.data || []), ...(upcomingRes.data || [])].sort((a, b) => {
        const aDate = new Date(getScheduledDate(a) || 0).getTime();
        const bDate = new Date(getScheduledDate(b) || 0).getTime();
        return aDate - bDate;
      });

      const teamIds = [
        ...new Set(schedule.flatMap((m) => [getTeamAId(m), getTeamBId(m)]).filter(Boolean)),
      ];

      if (teamIds.length) {
        const entries = await Promise.all(
          teamIds.map(async (id) => {
            try {
              const tr = await api.get(`/api/teams/${id}/details`);
              return [id, { name: tr?.data?.name || "TBD", logoUrl: tr?.data?.logoUrl || null }];
            } catch {
              return [id, { name: "TBD", logoUrl: null }];
            }
          })
        );
        setTeamById(Object.fromEntries(entries));
      }

      setMatches(schedule);
    } catch (e) {
      console.error("Failed to load schedule", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-black cursor-pointer tracking-tight" onClick={() => navigate("/")}>
            cricriser
          </h1>
          <div className="flex items-center gap-6 text-sm font-semibold">
            <button onClick={() => navigate("/")}>Live Scores</button>
            <button className="underline">Schedule</button>
            <button onClick={() => navigate("/matches/archive")}>Archives</button>
            <button onClick={() => navigate("/login")} className="bg-white text-teal-700 px-4 py-1.5 rounded-full">
              Login
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Match Schedule</h2>

        {loading && <p>Loading schedule...</p>}
        {!loading && matches.length === 0 && <p className="text-slate-500">No scheduled matches available.</p>}

        {groupByLeague(matches).map((group) => (
          <div key={group.leagueName} className="space-y-3 mb-8">
            <h3 className="text-sm font-semibold text-slate-700">{group.leagueName}</h3>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.matches.map((match) => (
                <Card key={match.id} className="cursor-pointer border border-slate-300 hover:shadow-md" onClick={() => navigate(`/match/${match.id}`)}>
                  <CardContent className="p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-600">{formatDate(getScheduledDate(match))}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-white">SCHEDULE</span>
                    </div>
                    <p className="font-semibold">{getTeamAName(match)} vs {getTeamBName(match)}</p>
                    <p className="text-sm text-slate-600">Venue: {match.venue || "TBD"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
