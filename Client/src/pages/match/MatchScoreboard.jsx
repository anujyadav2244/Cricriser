import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddMatchScoreForm from "./components/AddMatchScoreForm";
import StartInningsForm from "./components/StartInningsForm";
import ScoreHeader from "./components/ScoreHeader";
import Scorecard from "./components/Scorecard";

export default function MatchScoreboard() {
  const { matchId } = useParams();

  const [score, setScore] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [matchId]);

  useEffect(() => {
    console.log(matchDetails, score);
  }, [matchDetails, score]);
  const fetchAll = async () => {
    try {
      const token = localStorage.getItem("token");

      // ===== MATCH DETAILS =====
      const matchRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/matches/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMatchDetails(await matchRes.json());

      // ===== MATCH SCORE =====
      const scoreRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/match/score/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!scoreRes.ok || scoreRes.status === 204) {
        setScore(null);
      } else {
        const text = await scoreRes.text();
        setScore(text ? JSON.parse(text) : null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshScore = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/match/score/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok || res.status === 204) {
        setScore(null);
        return;
      }

      const text = await res.text();
      setScore(text ? JSON.parse(text) : null);
    } catch {
      setScore(null);
    }
  };

  /* ================= LOADING / ERROR ================= */

  if (loading) {
    return (
      <DashboardLayout title="Match Scoreboard">
        <p className="text-white">Loading match…</p>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Match Scoreboard">
        <p className="text-red-500">{error}</p>
      </DashboardLayout>
    );
  }

  /* ================= UI DECISION (FIXED) ================= */

  const showAddScore = !score;

  const showStartFirstInnings =
    score &&
    score.innings === 0 &&
    !score.firstInningsCompleted;

  // 🔥 FIXED CONDITION
  const showStartSecondInnings =
    score &&
    score.firstInningsCompleted &&
    !score.secondInningsCompleted &&
    score.strikerId === null &&
    score.nonStrikerId === null;

  const showLiveScoring =
    score &&
    score.innings > 0 &&
    score.strikerId !== null &&
    score.nonStrikerId !== null;

  return (
    <DashboardLayout title="Match Scoreboard">

      {/* Create score */}
      {showAddScore && matchDetails && (
        <AddMatchScoreForm
          matchDetails={matchDetails}
          onSuccess={setScore}
        />
      )}

      {/* Start 1st innings */}
      {showStartFirstInnings && matchDetails && (
        <StartInningsForm
          match={matchDetails}
          score={score}
          innings={1}
          onStarted={setScore}
        />
      )}

      {/* 🔥 Start 2nd innings (FIXED) */}
      {showStartSecondInnings && matchDetails && (
        <StartInningsForm
          match={matchDetails}
          score={score}
          innings={2}
          onStarted={setScore}
        />
      )}

      {/* Live scoring */}
      {showLiveScoring && matchDetails && (
        <div className="mt-4 space-y-4">
          <ScoreHeader
            matchDetails={matchDetails}
            matchScore={score}
          />
          <Scorecard
            matchId={matchId}
            matchDetails={matchDetails}
            matchScore={score}
            refreshScore={refreshScore}
          />
        </div>
      )}

    </DashboardLayout>);
}
