import { NavLink } from "react-router-dom";
import { LayoutDashboard, Trophy } from "lucide-react";

export default function AdminSidebar({ open, onClose }) {
  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose?.();
    }
  };

  return (
    <aside
      className={`
        h-full shrink-0
        bg-slate-900 border-r border-slate-800
        transition-all duration-300 overflow-hidden
        ${open ? "w-64" : "w-0 border-r-0"}
      `}
    >
      <nav className="space-y-2 p-4 w-64">

        <NavLink
          to="/admin/dashboard"
          onClick={handleNavClick}
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
          onClick={handleNavClick}
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
