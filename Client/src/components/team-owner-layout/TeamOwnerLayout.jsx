import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import TeamOwnerNavbar from "./TeamOwnerNavbar";
import TeamOwnerSidebar from "./TeamOwnerSidebar";

export default function TeamOwnerLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <TeamOwnerNavbar onMenuClick={() => setSidebarOpen(o => !o)} />

      <div className="flex flex-1 overflow-hidden">
        <TeamOwnerSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />


        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
