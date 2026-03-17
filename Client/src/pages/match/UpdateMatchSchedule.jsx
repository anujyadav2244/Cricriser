import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/api/axios";

export default function UpdateMatchSchedule() {
  const { leagueId, matchId } = useParams();
  const navigate = useNavigate();

  const [league, setLeague] = useState(null);
  const [match, setMatch] = useState(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        /* ================= FETCH LEAGUE ================= */
        const leagueRes = await api.get(`/api/leagues/${leagueId}`);
        const leagueData = leagueRes.data;
        setLeague(leagueData);

        /* ================= FETCH MATCH FROM LEAGUE SCHEDULE ================= */
        const matchesRes = await api.get(`/api/matches/league/${leagueId}`);
        const matchData = matchesRes.data?.find((m) => m.id === matchId);

        if (!matchData) {
          throw new Error("Match not found in this league");
        }

        setMatch(matchData);

        if (matchData.scheduledDate) {
          const date = new Date(matchData.scheduledDate);
          const formattedDate = date.toISOString().split("T")[0];
          setScheduledDate(formattedDate);
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leagueId, matchId]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const getMinDate = () => {
    return league?.startDate ? formatDateForInput(league.startDate) : "";
  };

  const getMaxDate = () => {
    return league?.endDate ? formatDateForInput(league.endDate) : "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!scheduledDate) {
      toast.error("Please select a scheduled date");
      return;
    }

    // Validate date is within league range
    const selectedDate = new Date(scheduledDate);
    const leagueStart = league?.startDate ? new Date(league.startDate) : null;
    const leagueEnd = league?.endDate ? new Date(league.endDate) : null;

    if (leagueStart && selectedDate < leagueStart) {
      toast.error("Scheduled date cannot be before league start date");
      return;
    }

    if (leagueEnd && selectedDate > leagueEnd) {
      toast.error("Scheduled date cannot be after league end date");
      return;
    }

    try {
      setSubmitting(true);
      const updatePayload = {
        scheduledDate: new Date(scheduledDate).toISOString(),
      };

      await api.put(`/api/matches/${matchId}`, updatePayload);

      toast.success("Match schedule updated successfully");
      navigate(`/admin/leagues/${leagueId}`);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to update match schedule";
      toast.error(message);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Update Match Schedule">
        <p className="text-slate-400">Loading match details...</p>
      </DashboardLayout>
    );
  }

  if (error && !league) {
    return (
      <DashboardLayout title="Update Match Schedule">
        <p className="text-red-500">{error}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Update Match Schedule"
      subtitle={`Match ${match?.matchNo} - ${match?.team1Name} vs ${match?.team2Name}`}
      backTo={`/admin/leagues/${leagueId}`}
    >
      <div className="max-w-2xl">
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-6">
            {/* ================= LEAGUE DATE RANGE ================= */}
            <div className="mb-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-sm font-semibold text-slate-300 mb-2">
                League Date Range
              </p>
              <p className="text-sm text-slate-400">
                {league?.startDate
                  ? new Date(league.startDate).toDateString()
                  : "—"}{" "}
                to{" "}
                {league?.endDate
                  ? new Date(league.endDate).toDateString()
                  : "—"}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Match scheduled date must be within this range
              </p>
            </div>

            {/* ================= FORM ================= */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Match Info */}
              <div className="space-y-2">
                <Label className="text-slate-300">Match Info</Label>
                <div className="p-3 bg-slate-800 rounded text-sm">
                  <p>
                    <strong>Match No:</strong> {match?.matchNo ?? "-"}
                  </p>
                  <p>
                    <strong>Type:</strong> {match?.matchType ?? "-"}
                  </p>
                  <p>
                    <strong>Teams:</strong> {match?.team1Name || "TBD"} vs{" "}
                    {match?.team2Name || "TBD"}
                  </p>
                  <p>
                    <strong>Status:</strong> {match?.status ?? "-"}
                  </p>
                </div>
              </div>

              {/* Scheduled Date */}
              <div className="space-y-2">
                <Label htmlFor="scheduledDate" className="text-slate-300">
                  Scheduled Date
                </Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
                <p className="text-xs text-slate-400">
                  Must be between {formatDateForInput(league?.startDate)} and{" "}
                  {formatDateForInput(league?.endDate)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? "Updating..." : "Update Schedule"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/admin/leagues/${leagueId}`)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
