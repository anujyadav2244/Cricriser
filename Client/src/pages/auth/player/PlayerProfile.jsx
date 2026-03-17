import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/api/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ROLES = ["BATTER", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"];
const BATTING_HANDS = ["RIGHT_HAND", "LEFT_HAND"];
const BOWLING_TYPES = ["FAST", "MEDIUM_FAST", "SPIN"];
const BOWLING_HANDS = ["RIGHT", "LEFT"];

export default function PlayerProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [player, setPlayer] = useState({
    name: "",
    role: "",
    battingStyle: "",
    bowlingType: "",
    bowlingHand: "",
    bowlingStyle: "",
    photoUrl: ""
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    api.get("/api/player/me")
      .then(res => {
        setPlayer({
          name: res.data.name || "",
          role: res.data.role || "",
          battingStyle: res.data.battingStyle || "",
          bowlingType: res.data.bowlingType || "",
          bowlingHand: res.data.bowlingHand || "",
          bowlingStyle: res.data.bowlingStyle || "",
          photoUrl: res.data.photoUrl || ""
        });
        setIsEditMode(true);
      })
      .catch(err => {
        if (err.response?.status === 404) return;
        navigate("/login");
      });
  }, [navigate]);

  /* ================= PHOTO HANDLERS ================= */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview("");
    setPlayer(p => ({ ...p, photoUrl: "" }));
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!player.name.trim()) return "Name is required";
    if (!player.role) return "Role is required";

    const bowlingRequired =
      player.role === "BOWLER" || player.role === "ALL_ROUNDER";

    if (bowlingRequired && !player.bowlingType)
      return "Bowling type is required";

    if (player.bowlingType && !player.bowlingHand)
      return "Bowling hand is required";

    if (player.bowlingType === "SPIN" && !player.bowlingStyle)
      return "Spin bowling style is required";

    return null;
  };

  /* ================= SAVE PROFILE ================= */
  const handleSave = async () => {
    const error = validate();
    if (error) return toast.error(error);

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", player.name);
      formData.append("role", player.role);

      if (player.battingStyle) formData.append("battingStyle", player.battingStyle);
      if (player.bowlingType) formData.append("bowlingType", player.bowlingType);
      if (player.bowlingHand) formData.append("bowlingHand", player.bowlingHand);
      if (player.bowlingStyle) formData.append("bowlingStyle", player.bowlingStyle);

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      if (isEditMode) {
        await api.put("/api/player/update", formData);
      } else {
        await api.post("/api/player/profile", formData);
      }

      toast.success("Profile saved successfully");

      navigate("/player/dashboard");
      setTimeout(() => window.location.reload(), 400);

    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SPIN OPTIONS ================= */
  const spinStyles =
    player.bowlingHand === "LEFT"
      ? ["FINGER_SPINNER", "WRIST_SPINNER"]
      : ["OFF_SPINNER", "LEG_SPINNER"];

  /* ================= UI ================= */
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardContent className="space-y-6 p-6">

          <h1 className="text-2xl font-bold">
            {isEditMode ? "Update Player Profile" : "Create Player Profile"}
          </h1>

          {/* PHOTO */}
          <div>
            <Label>Profile Photo</Label>

            {(photoPreview || player.photoUrl) && (
              <div className="mb-3">
                <img
                  src={photoPreview || player.photoUrl}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={removePhoto}
                >
                  Remove Photo
                </Button>
              </div>
            )}

            <Input type="file" accept="image/*" onChange={handlePhotoChange} />
          </div>

          {/* NAME */}
          <div>
            <Label>Full Name *</Label>
            <Input
              value={player.name}
              onChange={e => setPlayer(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* ROLE */}
          <div>
            <Label>Primary Role *</Label>
            <select
              className="w-full border p-2 rounded"
              value={player.role}
              onChange={e => setPlayer(p => ({ ...p, role: e.target.value }))}
            >
              <option value="">Select role</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* BATTING HAND */}
          <div>
            <Label>Batting Hand</Label>
            <select
              className="w-full border p-2 rounded"
              value={player.battingStyle}
              onChange={e =>
                setPlayer(p => ({ ...p, battingStyle: e.target.value }))
              }
            >
              <option value="">Select</option>
              {BATTING_HANDS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* BOWLING SECTION */}
          <div className="pt-4 border-t space-y-4">
            <h2 className="font-semibold">Bowling Details</h2>

            <div>
              <Label>Bowling Type</Label>
              <select
                className="w-full border p-2 rounded"
                value={player.bowlingType}
                onChange={e =>
                  setPlayer(p => ({
                    ...p,
                    bowlingType: e.target.value,
                    bowlingHand: "",
                    bowlingStyle: ""
                  }))
                }
              >
                <option value="">Select</option>
                {BOWLING_TYPES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {player.bowlingType && (
              <div>
                <Label>Bowling Hand *</Label>
                <select
                  className="w-full border p-2 rounded"
                  value={player.bowlingHand}
                  onChange={e =>
                    setPlayer(p => ({
                      ...p,
                      bowlingHand: e.target.value,
                      bowlingStyle: ""
                    }))
                  }
                >
                  <option value="">Select</option>
                  {BOWLING_HANDS.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            )}

            {player.bowlingType === "SPIN" && player.bowlingHand && (
              <div>
                <Label>Spin Style *</Label>
                <select
                  className="w-full border p-2 rounded"
                  value={player.bowlingStyle}
                  onChange={e =>
                    setPlayer(p => ({ ...p, bowlingStyle: e.target.value }))
                  }
                >
                  <option value="">Select</option>
                  {spinStyles.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* SAVE */}
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-orange-500 w-full"
          >
            {loading ? "Saving..." : "Save Profile"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
