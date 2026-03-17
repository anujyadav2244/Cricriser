import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { leagueApi } from "@/api/league.api";

export default function UpdateLeague() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [umpireInput, setUmpireInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    leagueType: "",
    leagueFormatType: "",
    noOfMatches: "",
    oversPerInnings: "",
    umpires: [],
    tour: "",
    startDate: "",
    endDate: "",
    logo: null,
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const isTournament = form.leagueType === "TOURNAMENT";
  const isBilateral = form.leagueType === "BILATERAL";

  /* ================= FETCH LEAGUE ================= */
  useEffect(() => {
    leagueApi
      .getById(id)
      .then((res) => {
        const l = res.data;

        setForm({
          name: l.name,
          leagueType: l.leagueType,
          leagueFormatType: l.leagueFormatType || "",
          noOfMatches: l.noOfMatches || "",
          oversPerInnings: l.oversPerInnings || "",
          umpires: l.umpires || [],
          tour: l.tour || "",
          startDate: l.startDate?.substring(0, 10) || "",
          endDate: l.endDate?.substring(0, 10) || "",
          logo: null,
        });

        setLogoPreview(l.logoUrl || null);
      })
      .catch(() => toast.error("Failed to load league"));
  }, [id]);

  /* ================= LOGO PREVIEW ================= */
  useEffect(() => {
    if (!form.logo) return;
    const url = URL.createObjectURL(form.logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.logo]);

  /* ================= UMPIRES ================= */
  const addUmpire = () => {
    if (!umpireInput.trim()) return;
    if (form.umpires.includes(umpireInput.trim())) return;
    update("umpires", [...form.umpires, umpireInput.trim()]);
    setUmpireInput("");
  };

  const removeUmpire = (u) =>
    update("umpires", form.umpires.filter((x) => x !== u));

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = {
        leagueFormatType: isTournament ? form.leagueFormatType : null,
        noOfMatches: isBilateral ? Number(form.noOfMatches) : null,
        oversPerInnings: Number(form.oversPerInnings),
        umpires: form.umpires,
        tour: form.tour,
        startDate: form.startDate,
        endDate: form.endDate,
      };

      const fd = new FormData();
      fd.append("league", JSON.stringify(payload)); // ✅ FIXED
      if (form.logo) fd.append("logo", form.logo);

      await leagueApi.update(id, fd);

      toast.success("League updated successfully");
      navigate("/admin/leagues");
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Card>
        <CardContent className="space-y-8 p-6">

          <div>
            <h1 className="text-2xl font-semibold">Update League</h1>
            <p className="text-sm text-slate-500">
              League structure cannot be changed
            </p>
          </div>

          <Separator />

          <Field label="League Name">
            <Input value={form.name} disabled />
          </Field>

          <Field label="League Type">
            <Input value={form.leagueType} disabled />
          </Field>

          <Field label="Overs per Innings">
            <Input
              type="number"
              value={form.oversPerInnings}
              onChange={(e) => update("oversPerInnings", e.target.value)}
            />
          </Field>

          {isTournament && (
            <Field label="Tournament Format">
              <Select
                value={form.leagueFormatType}
                onValueChange={(v) => update("leagueFormatType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                  <SelectItem value="GROUP">Group</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}

          {isBilateral && (
            <Field label="Number of Matches">
              <Input
                type="number"
                value={form.noOfMatches}
                onChange={(e) => update("noOfMatches", e.target.value)}
              />
            </Field>
          )}

          <Field label="Tour / Venue">
            <Input value={form.tour} onChange={(e) => update("tour", e.target.value)} />
          </Field>

          <SectionSimple
            label="Umpires"
            input={umpireInput}
            setInput={setUmpireInput}
            items={form.umpires}
            onAdd={addUmpire}
            onRemove={removeUmpire}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Start Date">
              <Input type="date" value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)} />
            </Field>
            <Field label="End Date">
              <Input type="date" value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)} />
            </Field>
          </div>

          <Field label="League Logo">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <Upload className="h-4 w-4" />
              Upload Logo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => update("logo", e.target.files?.[0] || null)}
              />
            </label>

            {logoPreview && (
              <div className="relative w-40 h-40 mt-2 border rounded">
                <img src={logoPreview} className="w-full h-full object-contain" />
                <button
                  onClick={() => update("logo", null)}
                  className="absolute top-1 right-1 bg-white p-1 rounded"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            )}
          </Field>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Update League
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

function SectionSimple({ label, input, setInput, items, onAdd, onRemove }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} />
        <Button onClick={onAdd}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-sm">
            {i}
            <button onClick={() => onRemove(i)}>
              <X className="h-4 w-4 text-red-500" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
