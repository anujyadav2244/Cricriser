import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";

const getDefaultSidebarState = () => {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(min-width: 768px)").matches;
};

export default function AdminLayout() {
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
    <div className="h-screen flex flex-col bg-slate-950">
      {/* TOP NAVBAR */}
      <AdminNavbar
        open={sidebarOpen}
        onMenuClick={() => setSidebarOpen((o) => !o)}
      />

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
