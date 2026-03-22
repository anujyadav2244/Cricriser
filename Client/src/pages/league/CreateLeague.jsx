import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "@/api/axios";
import BASE_URL from "@/api/config";

export default function CreateLeague() {

  /* ================= STATE ================= */

  const [loading, setLoading] = useState(false);

  const [leagueFormat, setLeagueFormat] = useState("");       // SINGLE | DOUBLE | GROUP
  const [groupRoundType, setGroupRoundType] = useState("");   // SINGLE | DOUBLE
  const [knockoutType, setKnockoutType] = useState("");       // SEMIFINAL | ELIMINATOR

  const [teamInput, setTeamInput] = useState("");
  const [teamSuggestions, setTeamSuggestions] = useState([]);
  const [umpireInput, setUmpireInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    leagueType: "",          // BILATERAL | TOURNAMENT
    noOfTeams: "",
    noOfMatches: "",         // only for bilateral
    oversPerInnings: "",
    teams: [],
    umpires: [],
    tour: "",
    startDate: "",
    endDate: "",
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const isTournament = form.leagueType === "TOURNAMENT";
  const isBilateral = form.leagueType === "BILATERAL";

  const teamLimit = Number(form.noOfTeams);
  const teamCount = form.teams.length;

  /* ================= TEAM SEARCH ================= */

  useEffect(() => {
    if (!teamInput.trim()) {
      setTeamSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      axios.get(`/api/teams/search?name=${encodeURIComponent(teamInput)}`)
        .then(res => setTeamSuggestions(res.data))
        .catch(() => setTeamSuggestions([]));
    }, 300);

    return () => clearTimeout(timer);
  }, [teamInput]);

  const addTeam = team => {
    if (form.teams.find(t => t.id === team.id))
      return toast.error("Team already added");

    if (isBilateral && teamCount >= 2)
      return toast.error("Bilateral allows only 2 teams");

    if (isTournament && teamLimit && teamCount >= teamLimit)
      return toast.error(`Only ${teamLimit} teams allowed`);

    update("teams", [...form.teams, team]);
    setTeamInput("");
    setTeamSuggestions([]);
  };

  const removeTeam = id =>
    update("teams", form.teams.filter(t => t.id !== id));

  /* ================= UMPIRES ================= */

  const addUmpire = () => {
    if (!umpireInput.trim()) return;
    if (form.umpires.includes(umpireInput.trim())) return;
    update("umpires", [...form.umpires, umpireInput.trim()]);
    setUmpireInput("");
  };

  const removeUmpire = u =>
    update("umpires", form.umpires.filter(x => x !== u));

  /* ================= VALIDATION ================= */

  const validate = () => {

    if (!form.name) return "League name required";
    if (!form.leagueType) return "League type required";
    if (!form.oversPerInnings) return "Overs per innings required";

    if (isBilateral) {
      if (teamCount !== 2) return "Bilateral must have exactly 2 teams";
      if (!form.noOfMatches || Number(form.noOfMatches) < 1)
        return "Number of matches required for bilateral";
    }

    if (isTournament) {
      if (!teamLimit) return "Number of teams required";
      if (teamCount !== teamLimit)
        return `Add exactly ${teamLimit} teams`;

      if (!leagueFormat) return "League format required";

      if (leagueFormat === "GROUP" && !groupRoundType)
        return "Group round type required";

      if (teamLimit >= 6 && !knockoutType)
        return "Knockout type required";
    }

    if (!form.startDate || !form.endDate)
      return "Start & End date required";

    return null;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    const err = validate();
    if (err) return toast.error(err);

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        leagueType: form.leagueType,

        noOfMatches:
          isBilateral ? Number(form.noOfMatches) : null,

        leagueFormat:
          isTournament ? leagueFormat : null,

        groupRoundType:
          leagueFormat === "GROUP" ? groupRoundType : null,

        knockoutType:
          isTournament
            ? (teamLimit < 6 ? "ELIMINATOR" : knockoutType)
            : null,

        oversPerInnings: Number(form.oversPerInnings),
        teamIds: form.teams.map(t => t.id),
        umpires: form.umpires,
        tour: form.tour,
        startDate: form.startDate,
        endDate: form.endDate,
      };

      const fd = new FormData();
      fd.append("league", JSON.stringify(payload));

      const res = await fetch(`${BASE_URL}/api/leagues/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: fd,
      });

      const text = await res.text();
      let data = {};

      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!res.ok) {
        throw new Error(data.message || "Create league failed");
      }

      toast.success("League created successfully 🎉");

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Card>
        <CardContent className="space-y-8 p-6">

          <h1 className="text-2xl font-semibold">Create League</h1>
          <Separator />

          <Field label="League Name">
            <Input value={form.name}
              onChange={e => update("name", e.target.value)} />
          </Field>

          <Field label="League Type">
            <Select onValueChange={v => update("leagueType", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BILATERAL">Bilateral</SelectItem>
                <SelectItem value="TOURNAMENT">Tournament</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {isTournament && (
            <Field label="Number of Teams">
              <Input type="number"
                value={form.noOfTeams}
                onChange={e => update("noOfTeams", e.target.value)} />
            </Field>
          )}

          {isBilateral && (
            <Field label="Number of Matches">
              <Input type="number"
                value={form.noOfMatches}
                onChange={e => update("noOfMatches", e.target.value)} />
            </Field>
          )}

          <Field label="Overs per Innings">
            <Input type="number"
              value={form.oversPerInnings}
              onChange={e => update("oversPerInnings", e.target.value)} />
          </Field>

          {isTournament && (
            <>
              <Field label="League Format">
                <Select onValueChange={setLeagueFormat}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single Round Robin</SelectItem>
                    <SelectItem value="DOUBLE">Double Round Robin</SelectItem>
                    <SelectItem value="GROUP">Group</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {leagueFormat === "GROUP" && (
                <Field label="Group Round Type">
                  <Select onValueChange={setGroupRoundType}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single</SelectItem>
                      <SelectItem value="DOUBLE">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {teamLimit >= 6 && (
                <Field label="Knockout Type">
                  <Select onValueChange={setKnockoutType}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEMIFINAL">Semi Final</SelectItem>
                      <SelectItem value="ELIMINATOR">Eliminator (IPL)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </>
          )}

          <SectionTeams
            input={teamInput}
            setInput={setTeamInput}
            suggestions={teamSuggestions}
            teams={form.teams}
            teamLimit={isTournament ? teamLimit : null}
            onAdd={addTeam}
            onRemove={removeTeam}
          />

          <SectionSimple
            label="Umpires"
            input={umpireInput}
            setInput={setUmpireInput}
            items={form.umpires}
            onAdd={addUmpire}
            onRemove={removeUmpire}
          />

          <Field label="Tour">
            <Input value={form.tour}
              onChange={e => update("tour", e.target.value)} />
          </Field>

          {/* DATES AT THE END (AS REQUESTED) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Start Date">
              <Input type="date"
                value={form.startDate}
                onChange={e => update("startDate", e.target.value)} />
            </Field>
            <Field label="End Date">
              <Input type="date"
                value={form.endDate}
                onChange={e => update("endDate", e.target.value)} />
            </Field>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create League
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}

/* ================= HELPERS ================= */

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function SectionTeams({ input, setInput, suggestions, teams, teamLimit, onAdd, onRemove }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Teams ({teams.length}{teamLimit ? ` / ${teamLimit}` : ""})
      </label>

      <Input
        placeholder="Search team"
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={teamLimit && teams.length >= teamLimit}
      />

      {suggestions.map(t => (
        <div
          key={t.id}
          onClick={() => onAdd(t)}
          className="flex items-center gap-3 p-2 cursor-pointer hover:bg-slate-100 rounded"
        >
          {t.logoUrl ? (
            <img
              src={t.logoUrl}
              alt={t.name}
              className="h-8 w-8 object-contain"
            />
          ) : (
            <div className="h-8 w-8 bg-slate-300 rounded-full flex items-center justify-center text-sm font-semibold">
              {t.name.charAt(0)}
            </div>
          )}
          <span>{t.name}</span>
        </div>
      ))}


      <div className="flex flex-wrap gap-2">
        {teams.map(t => (
          <span key={t.id}
            className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded">
            {t.name}
            <X className="h-4 w-4 cursor-pointer"
              onClick={() => onRemove(t.id)} />
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionSimple({ label, input, setInput, items, onAdd, onRemove }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input value={input}
          onChange={e => setInput(e.target.value)} />
        <Button onClick={onAdd}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(i => (
          <span key={i}
            className="px-3 py-1 bg-slate-100 rounded">
            {i}
            <X className="inline ml-2 cursor-pointer"
              onClick={() => onRemove(i)} />
          </span>
        ))}
      </div>
    </div>
  );
}
