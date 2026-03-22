import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth.store";
import { useNavigate } from "react-router-dom";

export default function TeamOwnerNavbar({ onMenuClick, open }) {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          aria-expanded={open}
          className="text-slate-300 hover:bg-slate-800"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <span className="text-slate-100 font-semibold tracking-wide">
          CricRiser
        </span>
      </div>

      {/* RIGHT */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none">
            <Avatar className="h-9 w-9 bg-orange-500 text-white">
              <AvatarFallback className="font-semibold">
                T
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          {/* ✅ CREATE TEAM */}
          <DropdownMenuItem
            onClick={() => navigate("/team-owner/teams/create")}
          >
            Create Team
          </DropdownMenuItem>

          {/* ✅ RESET PASSWORD */}
          <DropdownMenuItem
            onClick={() => navigate("/team-owner/reset-password")}
          >
            Reset Password
          </DropdownMenuItem>

          {/*  DELETE ACCOUNT (ONLY HERE) */}
          <DropdownMenuItem
            onClick={() => navigate("/team-owner/delete-account")}
            className="text-red-600 focus:text-red-600"
          >
            Delete Account
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* 🚪 LOGOUT */}
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600"
          >
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
