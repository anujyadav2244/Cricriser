import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { toast } from "sonner";
import PlayerNavbar from "@/components/player-layout/PlayerNavbar";
import PlayerSidebar from "@/components/player-layout/PlayerSidebar";

export default function PlayerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get("/api/player/me")
      .then(res => {
        setPlayer(res.data);
      })
      .catch(err => {
        const status = err.response?.status;

        if (status === 401 || status === 403) {
          localStorage.clear();
          toast.error("Session expired. Please login again.");
          navigate("/login");
          return;
        }

        if (status === 404) {
          // Profile not created yet → allow profile page
          if (location.pathname !== "/player/profile") {
            navigate("/player/profile");
          }
          return;
        }

        toast.error("Something went wrong");
      })
      .finally(() => setLoading(false));
  }, [navigate, location.pathname]);

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col">
      <PlayerNavbar
        player={player}
        open={sidebarOpen}
        onMenuClick={() => setSidebarOpen(o => !o)}
      />

      <div className="flex flex-1 overflow-hidden">
        <PlayerSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet context={{ player }} />
        </main>
      </div>
    </div>
  );
}
