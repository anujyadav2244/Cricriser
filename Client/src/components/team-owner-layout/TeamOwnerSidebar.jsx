import { NavLink } from "react-router-dom";
import { PlusCircle, Users } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function TeamOwnerSidebar({ open, onClose }) {
  const { name, email } = useAuthStore();

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
      <div className="w-64">
        {/* PROFILE SECTION */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500 text-white
                            flex items-center justify-center font-semibold">
              {name?.charAt(0).toUpperCase() || "T"}
            </div>

            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {name || "Team Owner"}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* NAV LINKS */}
        <nav className="p-4 space-y-2">
          <NavLink
            to="/team-owner/dashboard"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm
              ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Users size={18} />
            My Teams
          </NavLink>

          <NavLink
            to="/team-owner/teams/create"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm
              ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <PlusCircle size={18} />
            Create Team
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
