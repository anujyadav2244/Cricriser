import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Card className="w-full max-w-sm bg-slate-900 border-slate-800">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-white text-lg text-center font-semibold">
            Login As
          </h2>

          {/* ADMIN */}
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600"
            onClick={() => navigate("/admin/login")}
          >
            League Admin
          </Button>

          {/* TEAM OWNER */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/team-owner/login")}
          >
            Team Owner
          </Button>

          {/* PLAYER */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/player/login")}
          >
            Player
          </Button>

          {/* BACK */}
          <Button
            variant="ghost"
            className="w-full text-slate-400"
            onClick={() => navigate("/")}
          >
            ← Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
