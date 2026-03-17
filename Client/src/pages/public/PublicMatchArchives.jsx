import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { formatDate } from "@/lib/utils";

export default function PublicMatchArchives() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [teamById, setTeamById] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompletedMatches();
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
    const directName =
      match.teamAName ||
      match.team1Name ||
      match.teamA?.name ||
      match.team1?.name ||
      null;
    const isIdLike = (value) =>
      typeof value === "string" &&
      (/^[a-f0-9]{24}$/i.test(value.trim()) || value === id);
    return (
      (!isIdLike(directName) ? directName : null) ||
      teamById[id]?.name ||
      "TBD"
    );
  };

  const getTeamBName = (match) => {
    const id = getTeamBId(match);
    const directName =
      match.teamBName ||
      match.team2Name ||
      match.teamB?.name ||
      match.team2?.name ||
      null;
    const isIdLike = (value) =>
      typeof value === "string" &&
      (/^[a-f0-9]{24}$/i.test(value.trim()) || value === id);
    return (
      (!isIdLike(directName) ? directName : null) ||
      teamById[id]?.name ||
      "TBD"
    );
  };

  const groupByLeague = (items) => {
    const grouped = new Map();
    items.forEach((match) => {
      const key = match.leagueName || "Other Matches";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(match);
    });
    return Array.from(grouped.entries()).map(([leagueName, matches]) => ({
      leagueName,
      matches,
    }));
  };

  const formatResultText = (match) => {
    const raw = match.result || "Match completed";
    const teamAId = getTeamAId(match);
    const teamBId = getTeamBId(match);
    const teamAName = getTeamAName(match);
    const teamBName = getTeamBName(match);

    return raw
      .replaceAll(teamAId || "", teamAName)
      .replaceAll(teamBId || "", teamBName);
  };

  const loadCompletedMatches = async () => {
    try {
      const res = await api.get("/api/matches/public/COMPLETED");
      const completed = res.data || [];

      completed.sort((a, b) => {
        const aDate = new Date(getScheduledDate(a) || 0).getTime();
        const bDate = new Date(getScheduledDate(b) || 0).getTime();
        return bDate - aDate;
      });

      const teamIds = [
        ...new Set(completed.flatMap((m) => [getTeamAId(m), getTeamBId(m)]).filter(Boolean)),
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

      setMatches(completed);
    } catch (e) {
      console.error("Failed to load archives", e);
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
            <button onClick={() => navigate("/matches/schedule")}>Schedule</button>
            <button className="underline">Archives</button>
            <button onClick={() => navigate("/login")} className="bg-white text-teal-700 px-4 py-1.5 rounded-full">
              Login
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Match Archives</h2>

        {loading && <p>Loading archives...</p>}
        {!loading && matches.length === 0 && <p className="text-slate-500">No past matches available.</p>}

        {groupByLeague(matches).map((group) => (
          <div key={group.leagueName} className="space-y-3 mb-8">
            <h3 className="text-sm font-semibold text-slate-700">{group.leagueName}</h3>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.matches.map((match) => {
                const teamAId = getTeamAId(match);
                const teamBId = getTeamBId(match);
                const teamALogo = teamById[teamAId]?.logoUrl;
                const teamBLogo = teamById[teamBId]?.logoUrl;

                return (
                  <Card
                    key={match.id}
                    className="cursor-pointer border border-slate-300 hover:shadow-md"
                    onClick={() => navigate(`/match/${match.id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
                        <p className="text-xs text-slate-600 truncate">{match.leagueName || "League Match"}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-white">RESULT</span>
                      </div>

                      <div className="p-4 space-y-3 bg-white">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {teamALogo ? <img src={teamALogo} className="h-6 w-6 rounded-full object-cover" /> : <div className="h-6 w-6 rounded-full bg-slate-200" />}
                            <p className="font-semibold truncate">{getTeamAName(match)}</p>
                          </div>
                          <p className="font-bold whitespace-nowrap">
                            {match.team1Runs ?? 0}-{match.team1Wickets ?? 0}
                            <span className="text-slate-500 font-semibold"> ({match.team1Overs ?? "0.0"})</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {teamBLogo ? <img src={teamBLogo} className="h-6 w-6 rounded-full object-cover" /> : <div className="h-6 w-6 rounded-full bg-slate-200" />}
                            <p className="font-semibold truncate">{getTeamBName(match)}</p>
                          </div>
                          <p className="font-bold whitespace-nowrap">
                            {match.team2Runs ?? 0}-{match.team2Wickets ?? 0}
                            <span className="text-slate-500 font-semibold"> ({match.team2Overs ?? "0.0"})</span>
                          </p>
                        </div>

                        <p className="text-blue-600 text-sm font-medium">{formatResultText(match)}</p>
                        <p className="text-xs text-slate-500">{formatDate(getScheduledDate(match))}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
