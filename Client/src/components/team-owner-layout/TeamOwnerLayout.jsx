import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import TeamOwnerNavbar from "./TeamOwnerNavbar";
import TeamOwnerSidebar from "./TeamOwnerSidebar";

const getDefaultSidebarState = () => {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(min-width: 768px)").matches;
};

export default function TeamOwnerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(getDefaultSidebarState);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleBreakpointChange = (event) => {
      setSidebarOpen(event.matches);
    };

    handleBreakpointChange(mediaQuery);
    mediaQuery.addEventListener("change", handleBreakpointChange);

    return () => {
      mediaQuery.removeEventListener("change", handleBreakpointChange);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <TeamOwnerNavbar
        open={sidebarOpen}
        onMenuClick={() => setSidebarOpen((o) => !o)}
      />

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
