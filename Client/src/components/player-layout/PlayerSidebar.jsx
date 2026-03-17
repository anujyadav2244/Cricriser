import { NavLink } from "react-router-dom";
import { LayoutDashboard, User } from "lucide-react";

export default function PlayerSidebar({ open, onClose }) {
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
          h-full w-64
          bg-slate-900 border-r border-slate-800
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <nav className="p-4 space-y-2">
          <NavLink
            to="/player/dashboard"
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
            to="/player/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm
              ${isActive
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"}`
            }
          >
            <User size={18} />
            Edit Profile
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
