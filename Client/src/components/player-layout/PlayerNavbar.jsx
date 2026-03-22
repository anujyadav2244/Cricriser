import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

export default function PlayerNavbar({ onMenuClick, player, open }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          aria-expanded={open}
          className="text-slate-300 hover:bg-slate-800 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        <span className="text-white font-semibold">
          CricRiser · Player
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none">
            <Avatar className="h-9 w-9">
              {player?.photoUrl ? (
                <AvatarImage src={player.photoUrl} />
              ) : (
                <AvatarFallback className="bg-orange-500 text-white font-semibold">
                  {player?.name?.charAt(0) || "P"}
                </AvatarFallback>
              )}
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate("/player/profile")}>
            Edit Profile
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate("/player/reset-password")}>
            Reset Password
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/player/delete-account")}
            className="text-red-600"
          >
            Delete Account
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={logout}
            className="text-red-600 font-medium"
          >
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
