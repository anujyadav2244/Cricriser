import { NavLink } from "react-router-dom";
import { LayoutDashboard, Trophy } from "lucide-react";

export default function AdminSidebar({ open, onClose }) {
  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onClose?.();
    }
  };

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      <aside
        className={`
          fixed md:static z-50
          h-full w-64 md:shrink-0
          bg-slate-900 border-r border-slate-800
          transform transition-all duration-300
          overflow-hidden md:translate-x-0
          ${open ? "translate-x-0 md:w-64" : "-translate-x-full md:w-0"}
        `}
      >
        <nav className="space-y-2 p-4">

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
    </>
  );
}
