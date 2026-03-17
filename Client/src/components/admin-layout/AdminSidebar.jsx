import { NavLink } from "react-router-dom";
import { LayoutDashboard, Trophy } from "lucide-react";

export default function AdminSidebar() {
  return (
    <aside className="bg-slate-900 border-r border-slate-800 h-full w-64 p-4">
      <nav className="space-y-2">

        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded text-sm
            ${isActive
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"}`
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/leagues"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded text-sm
            ${isActive
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"}`
          }
        >
          <Trophy size={18} />
          Leagues
        </NavLink>

      </nav>
    </aside>
  );
}
