import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import api from "@/api/axios";
import { formatDate } from "@/lib/utils";

export default function Home() {
  const [liveUpcomingMatches, setLiveUpcomingMatches] = useState([]);
  const [teamById, setTeamById] = useState({});
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadHomeMatches();
  }, []);

  const getStatus = (match) => (match.matchStatus || match.status || "").toUpperCase();

  const isLive = (match) => {
    const status = getStatus(match);
    return status === "LIVE" || status === "IN_PROGRESS" || status === "MATCH IN PROGRESS";
  };

  const isCompleted = (match) => {
    const status = getStatus(match);
    return status === "COMPLETED" || status === "MATCH COMPLETED";
  };

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
    const teamId = getTeamAId(match);
    const directName =
      match.teamAName ||
      match.team1Name ||
      match.teamA?.name ||
      match.team1?.name ||
      null;

    const isIdLike = (value) =>
      typeof value === "string" &&
      (/^[a-f0-9]{24}$/i.test(value.trim()) || value === teamId);

    return (
      (!isIdLike(directName) ? directName : null) ||
      teamById[teamId]?.name ||
      "TBD"
    );
  };

  const getTeamBName = (match) => {
    const teamId = getTeamBId(match);
    const directName =
      match.teamBName ||
      match.team2Name ||
      match.teamB?.name ||
      match.team2?.name ||
      null;

    const isIdLike = (value) =>
      typeof value === "string" &&
      (/^[a-f0-9]{24}$/i.test(value.trim()) || value === teamId);

    return (
      (!isIdLike(directName) ? directName : null) ||
      teamById[teamId]?.name ||
      "TBD"
    );
  };

  const getTeamLogo = (teamId) => teamById[teamId]?.logoUrl || null;
  const isValidTeamId = (value) => typeof value === "string" && /^[a-f0-9]{24}$/i.test(value.trim());

  const getMatchLabel = (match) => {
    if (isLive(match)) return "LIVE";
    if (isCompleted(match)) return "RESULT";

    const scheduledDate = getScheduledDate(match);
    if (!scheduledDate) return "Upcoming";

    const d = new Date(scheduledDate);
    d.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return d.getTime() === today.getTime() ? "Today" : "Upcoming";
  };

  const loadHomeMatches = async () => {
    try {
      const [liveRes, upcomingRes] = await Promise.all([
        api.get("/api/matches/public/LIVE"),
        api.get("/api/matches/public/UPCOMING"),
      ]);

      const liveMatches = liveRes.data || [];
      const upcomingMatches = upcomingRes.data || [];

      const liveUpcoming = [...liveMatches, ...upcomingMatches].sort((a, b) => {
        const aDate = new Date(getScheduledDate(a) || 0).getTime();
        const bDate = new Date(getScheduledDate(b) || 0).getTime();
        return aDate - bDate;
      });

      const allMatches = [...liveUpcoming];
      const teamIds = [
        ...new Set(
          allMatches
            .flatMap((m) => [getTeamAId(m), getTeamBId(m)])
            .filter((id) => isValidTeamId(id) && !teamById[id])
        ),
      ];

      if (teamIds.length > 0) {
        const entries = await Promise.all(
          teamIds.map(async (id) => {
            try {
              const res = await api.get(`/api/teams/${id}/details`);
              return [id, { name: res?.data?.name || res?.data?.teamName || null, logoUrl: res?.data?.logoUrl || null }];
            } catch {
              return [id, { name: null, logoUrl: null }];
            }
          })
        );

        setTeamById((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      }

      setLiveUpcomingMatches(liveUpcoming);
    } catch (e) {
      console.error("Failed to load matches", e);
    } finally {
      setLoading(false);
    }
  };

  const MatchCard = ({ match }) => {
    const teamAId = getTeamAId(match);
    const teamBId = getTeamBId(match);
    const teamAName = getTeamAName(match);
    const teamBName = getTeamBName(match);
    const teamALogo = getTeamLogo(teamAId);
    const teamBLogo = getTeamLogo(teamBId);

    return (
      <Card
        key={match.id}
        className="min-w-[320px] flex-shrink-0 cursor-pointer border border-slate-300 hover:shadow-lg transition"
        onClick={() => navigate(`/match/${match.id}`)}
      >
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-600 truncate">{match.leagueName || "League Match"}</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-white">{getMatchLabel(match)}</span>
          </div>

          <div className="p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {teamALogo ? (
                  <img src={teamALogo} alt={teamAName} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-slate-200" />
                )}
                <p className="font-semibold truncate">{teamAName}</p>
              </div>
              {(isLive(match) || isCompleted(match)) && (
                <p className="font-bold text-right whitespace-nowrap">
                  {match.team1Runs ?? 0}-{match.team1Wickets ?? 0}
                  <span className="text-slate-500 font-semibold"> ({match.team1Overs ?? "0.0"})</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {teamBLogo ? (
                  <img src={teamBLogo} alt={teamBName} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-slate-200" />
                )}
                <p className="font-semibold truncate">{teamBName}</p>
              </div>
              {(isLive(match) || isCompleted(match)) && (
                <p className="font-bold text-right whitespace-nowrap">
                  {match.team2Runs ?? 0}-{match.team2Wickets ?? 0}
                  <span className="text-slate-500 font-semibold"> ({match.team2Overs ?? "0.0"})</span>
                </p>
              )}
            </div>

            {isCompleted(match) ? (
              <p className="text-blue-600 text-sm font-medium">{match.result || "Match completed"}</p>
            ) : isLive(match) ? (
              <p className="text-red-600 text-sm font-semibold">Live now</p>
            ) : (
              <p className="text-amber-700 text-sm font-medium">{formatDate(getScheduledDate(match))}</p>
            )}
          </div>

          <div className="px-4 py-2 border-t bg-slate-50 flex items-center justify-end gap-4 text-xs font-medium text-slate-700">
            <button
              className="hover:text-black"
              onClick={(e) => {
                e.stopPropagation();
                if (match.leagueId) navigate(`/points/${match.leagueId}`);
              }}
            >
              POINTS TABLE
            </button>
            <button
              className="hover:text-black"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/match/${match.id}`);
              }}
            >
              SCORECARD
            </button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="h-10 w-10 rounded-md border border-teal-200/70 text-white text-2xl leading-none"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? "\u00D7" : "\u2630"}
            </button>
            <h1 className="text-3xl font-black cursor-pointer tracking-tight" onClick={() => navigate("/")}>
              Cricriser
            </h1>
          </div>
          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold">
            <button onClick={() => navigate("/")}>Live Scores</button>
            <button onClick={() => navigate("/matches/schedule")}>Schedule</button>
            <button onClick={() => navigate("/matches/archive")}>Archives</button>
            <button onClick={() => navigate("/login")} className="bg-white  text-teal-700 px-4 py-1.5 rounded-full">
              Login
            </button>
          </div>
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => navigate("/login")}
              className="bg-white text-teal-700 px-3 py-1.5 rounded-full text-sm font-semibold"
            >
              Log In
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />
          <aside className="relative h-full w-[86%] max-w-sm lg:w-[360px] bg-white shadow-2xl overflow-y-auto">
            <div className="bg-teal-700 text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-wide">Menu</h2>
              <button
                className="text-3xl leading-none text-white/90"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                &#215;
              </button>
            </div>

            <div className="h-4 bg-slate-100 border-y border-slate-200" />

            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/login");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">My Account</span>
            </button>

            <div className="h-4 bg-slate-100 border-y border-slate-200" />

            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">Live Scores</span>
            </button>
            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/matches/schedule");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">Schedule</span>
            </button>
            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/matches/archive");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">Archives</span>
            </button>

            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/browse/teams");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">Browse Team</span>
            </button>
            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left border-b border-slate-200"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/browse/players");
              }}
            >
              <span className="text-slate-500 text-lg">o</span>
              <span className="text-xl">Browse Player</span>
            </button>

            <div className="h-4 bg-slate-100 border-y border-slate-200" />
          </aside>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-6 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Live & Upcoming Matches</h2>
        </div>
        <Separator />
        {loading && <p>Loading...</p>}
        {!loading && liveUpcomingMatches.length === 0 && <p className="text-slate-500">No live/upcoming matches</p>}
        {liveUpcomingMatches.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {liveUpcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12">
        <div className="rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-600 text-white px-8 py-10 md:px-12 md:py-14 shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] font-semibold text-teal-100">Stay Match Ready</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black leading-tight">
            Track every ball, every stat, and every turning point with Cricriser.
          </h2>
          <p className="mt-4 text-teal-50/95 max-w-2xl">
            Follow live scorecards, upcoming fixtures, and archives from one place. Dive into detailed match insights
            built for players, analysts, and fans.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              className="bg-white text-teal-700 font-semibold px-5 py-2.5 rounded-full hover:bg-teal-50 transition"
              onClick={() => navigate("/matches/schedule")}
            >
              View Schedule
            </button>
            <button
              className="bg-teal-900/20 border border-white/60 text-white font-semibold px-5 py-2.5 rounded-full hover:bg-teal-900/35 transition"
              onClick={() => navigate("/login")}
            >
              Join Cricriser
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center">
        &copy; {new Date().getFullYear()} Cricriser. All rights reserved.
      </footer>
    </div>
  );
}

