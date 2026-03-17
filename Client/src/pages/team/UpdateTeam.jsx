import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { X } from "lucide-react";
import axios from "@/api/axios";
import { teamApi } from "@/api/team.api";

export default function UpdateTeam() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* ================= FORM ================= */
  const [form, setForm] = useState({
    name: "",
    coach: "",
    captainId: "",
    viceCaptainId: "",
    squadPlayerIds: [],
  });

  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  /* ================= LOGO ================= */
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  /* ================= LOAD TEAM ================= */
  useEffect(() => {
    teamApi
      .getDetails(id)
      .then((res) => {
        const t = res.data;

        setForm({
          name: t.name || "",
          coach: t.coach || "",
          captainId: t.captainId || "",
          viceCaptainId: t.viceCaptainId || "",
          squadPlayerIds: t.players ? t.players.map((p) => p.id) : [],
        });

        setSelectedPlayers(t.players || []);
        setLogoPreview(t.logoUrl || "");
      })
      .catch(() => toast.error("Failed to load team"));
  }, [id]);

  /* ================= PLAYER SEARCH ================= */
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

  /* ================= LOGO ================= */
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files allowed");
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
  const addPlayer = (player) => {
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
  const removePlayer = (pid) => {
    setSelectedPlayers((p) => p.filter((x) => x.id !== pid));
    update(
      "squadPlayerIds",
      form.squadPlayerIds.filter((x) => x !== pid)
    );

    if (form.captainId === pid) update("captainId", "");
    if (form.viceCaptainId === pid) update("viceCaptainId", "");
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!form.coach) return "Coach name required";

    if (form.squadPlayerIds.length < 15 || form.squadPlayerIds.length > 18)
      return "Squad must have 15–18 players";

    if (!form.captainId) return "Captain required";
    if (!form.viceCaptainId) return "Vice Captain required";

    if (form.captainId === form.viceCaptainId)
      return "Captain & Vice Captain cannot be same";

    return null;
  };

  const isFormValid = () => validate() === null;

  /* ================= SUBMIT ================= */
  const handleUpdate = async () => {
    const err = validate();
    if (err) return toast.error(err);

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("team", JSON.stringify(form));
      if (logoFile) fd.append("logo", logoFile);

      const token = localStorage.getItem("token");

      await axios.put(`/api/teams/${id}`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Team updated successfully 🏏");
      navigate("/team-owner/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="space-y-6 p-6">
          <h1 className="text-xl font-semibold">Update Team</h1>
          <Separator />

          {/* TEAM NAME */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Team</label>
            <Input value={form.name} disabled />
          </div>

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
                  onClick={() => addPlayer(p)}
                  className="p-2 cursor-pointer hover:bg-slate-100 flex gap-3"
                >
                  <img
                    src={p.photoUrl || "/default-player.png"}
                    className="h-8 w-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SELECTED PLAYERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedPlayers.map((p) => (
              <div key={p.id} className="border rounded p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <img
                    src={p.photoUrl || "/default-player.png"}
                    className="h-10 w-10 rounded-full"
                  />
                  <span className="font-medium">{p.name}</span>
                </div>

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
            onClick={handleUpdate}
            disabled={loading || !isFormValid()}
          >
            {loading ? "Updating..." : "Update Team"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
