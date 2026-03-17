import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardStatCard from "@/components/dashboard/DashboardStatCard";
import { Trophy, Layers, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // get admin details (safe fallback)
  const authUser = useAuthStore((s) => s.user);
  const adminName =
    authUser?.name ||
    localStorage.getItem("name") ||
    "Admin";

  return (
    <DashboardLayout
      title={`Welcome, ${adminName} 👋`}
      subtitle="League & tournament overview"
    >
      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <DashboardStatCard
          title="Total Leagues"
          // value="0"
          icon={<Trophy />}
          onClick={() => navigate("/admin/leagues")}
        />

        {/* <DashboardStatCard
          title="Active Leagues"
          value="0"
          icon={<Layers />}
        /> */}

        {/* <DashboardStatCard
          title="Total Teams"
          value="0"
          icon={<Users />}
        /> */}
      </div>

      {/* ACTION ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <DashboardStatCard
          title="Create New League"
          value="Start a new tournament"
          onClick={() => navigate("/admin/leagues/create")}
        />

        <DashboardStatCard
          title="View All Leagues"
          value="Manage leagues & teams"
          onClick={() => navigate("/admin/leagues")}
        />
      </div>
    </DashboardLayout>
  );

  // <div>
  //   Hello World
  // </div>
}
