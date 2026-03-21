import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { X } from "lucide-react";
import axios from "@/api/axios";
import { humanizeText } from "@/lib/utils";

export default function CreateTeam() {
  const navigate = useNavigate();

  /* ================= FORM ================= */
  const [form, setForm] = useState({
    name: "",
    coach: "",
    captainId: "",
    viceCaptainId: "",
    squadPlayerIds: [],
  });

  /* ================= PLAYER SEARCH ================= */
  const [emailInput, setEmailInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  /* ================= LOGO ================= */
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  /* ================= DEBOUNCE PLAYER SEARCH ================= */
  useEffect(() => {
    if (emailInput.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      axios
        .get(`/api/players/search?email=${emailInput}`)
        .then((res) => setSuggestions(res.data))
        .catch(() => setSuggestions([]));
    }, 400);

    return () => clearTimeout(timer);
  }, [emailInput]);

  /* ================= LOGO HANDLERS ================= */
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be less than 2MB");
      return;
    }

    if (logoPreview) URL.revokeObjectURL(logoPreview);

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview("");
  };

  /* ================= ADD PLAYER ================= */
  const selectPlayer = (player) => {
    if (form.squadPlayerIds.includes(player.id)) {
      toast.error("Player already added");
      return;
    }

    setSelectedPlayers((p) => [...p, player]);
    update("squadPlayerIds", [...form.squadPlayerIds, player.id]);

    setEmailInput("");
    setSuggestions([]);
  };

  /* ================= REMOVE PLAYER ================= */
  const removePlayer = (id) => {
    setSelectedPlayers((p) => p.filter((x) => x.id !== id));
    update(
      "squadPlayerIds",
      form.squadPlayerIds.filter((x) => x !== id)
    );

    if (form.captainId === id) update("captainId", "");
    if (form.viceCaptainId === id) update("viceCaptainId", "");
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!form.name) return "Team name required";
    if (!form.coach) return "Coach name required";

    if (form.squadPlayerIds.length < 15 || form.squadPlayerIds.length > 18)
      return "Squad must have 15–18 players";

    if (!form.captainId) return "Captain required";
    if (!form.viceCaptainId) return "Vice Captain required";
    if (form.captainId === form.viceCaptainId)
      return "Captain & Vice Captain cannot be same";

    return null;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    const err = validate();
    if (err) return toast.error(err);

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("team", JSON.stringify(form));
      if (logoFile) fd.append("logo", logoFile);

      await axios.post("/api/teams", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Team created successfully 🏏");
      navigate("/team-owner/dashboard");
    } catch (e) {
      toast.error(e.response?.data?.error || "Creation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="space-y-6 p-6">
          <h1 className="text-xl font-semibold">Create Team</h1>
          <Separator />

          {/* TEAM LOGO */}
          <div>
            <label className="text-sm font-medium">Team Logo</label>

            {logoPreview && (
              <div className="mt-2 flex items-center gap-4">
                <img
                  src={logoPreview}
                  className="h-20 w-20 rounded border object-contain"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={removeLogo}
                >
                  Remove
                </Button>
              </div>
            )}

            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="mt-2"
            />
          </div>

          <Input
            placeholder="Team Name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />

          <Input
            placeholder="Coach Name"
            value={form.coach}
            onChange={(e) => update("coach", e.target.value)}
          />

          {/* PLAYER SEARCH */}
          <Input
            placeholder="Search player by email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />

          {suggestions.length > 0 && (
            <div className="border rounded">
              {suggestions.map((p) => (
                <div
                  key={p.id}
                  onClick={() => selectPlayer(p)}
                  className="flex gap-3 p-2 cursor-pointer hover:bg-slate-100"
                >
                  <img
                    src={p.photoUrl || "/default-player.png"}
                    className="h-8 w-8 rounded-full border"
                  />
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">{humanizeText(p.role) || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SELECTED PLAYERS */}
          <div className="grid sm:grid-cols-2 gap-3">
            {selectedPlayers.map((p) => (
              <div key={p.id} className="border rounded p-3 space-y-2">
                <p className="font-medium">{p.name}</p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={form.captainId === p.id ? "default" : "outline"}
                    onClick={() => update("captainId", p.id)}
                  >
                    Captain
                  </Button>

                  <Button
                    size="sm"
                    variant={form.viceCaptainId === p.id ? "default" : "outline"}
                    onClick={() => update("viceCaptainId", p.id)}
                  >
                    Vice
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removePlayer(p.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Team"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
