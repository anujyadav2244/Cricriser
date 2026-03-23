import { Routes, Route, Navigate } from "react-router-dom";

/* ================= PUBLIC ================= */
import Home from "@/pages/Home";
import PublicMatchDetails from "@/pages/public/PublicMatchDetails";
import PublicPointsTable from "@/pages/public/PublicPointsTable";
import PublicPlayerProfile from "@/pages/public/PublicPlayerProfile";
import PublicMatchArchives from "@/pages/public/PublicMatchArchives";
import PublicMatchSchedule from "@/pages/public/PublicMatchSchedule";
import PublicBrowseTeams from "@/pages/public/PublicBrowseTeams";
import PublicBrowsePlayers from "@/pages/public/PublicBrowsePlayers";
import PublicTeamDetails from "@/pages/public/PublicTeamDetails";
import LoginSelector from "@/pages/auth/LoginSelector";

/* ================= ADMIN ================= */
import AdminLogin from "@/pages/auth/admin/AdminLogin";
import AdminRegister from "@/pages/auth/admin/AdminRegister";
import AdminVerifySignupOtp from "@/pages/auth/admin/AdminVerifySignupOtp";
import AdminForgotPassword from "@/pages/auth/admin/AdminForgotPassword";
import AdminVerifyForgotOtp from "@/pages/auth/admin/AdminVerifyForgotOtp";
import AdminResetPassword from "@/pages/auth/admin/AdminResetPassword";
import AdminDeleteAccount from "@/pages/auth/admin/AdminDeleteAccount";
import AdminLayout from "@/components/admin-layout/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";

/* ===== ADMIN LEAGUE PAGES ===== */
import CreateLeague from "@/pages/league/CreateLeague";
import Leagues from "@/pages/league/Leagues";
import LeagueDetails from "@/pages/league/LeagueDetails";
import UpdateLeague from "@/pages/league/UpdateLeague";
import DeleteLeague from "@/pages/league/DeleteLeague";
import MatchScoreboard from "@/pages/match/MatchScoreboard";
import UpdateMatchSchedule from "@/pages/match/UpdateMatchSchedule";

/* ===== ADMIN TEAM PAGES ===== */
import TeamDetails from "@/pages/team/TeamDetails";
import CreateTeam from "@/pages/team/CreateTeam";
import UpdateTeam from "@/pages/team/UpdateTeam";
import DeleteTeam from "@/pages/team/DeleteTeam";

/* ================= PLAYER ================= */
import PlayerLogin from "@/pages/auth/player/PlayerLogin";
import PlayerSignup from "@/pages/auth/player/PlayerSignup";
import PlayerVerifyOtp from "@/pages/auth/player/PlayerVerifySignupOtp";
import PlayerForgotPassword from "@/pages/auth/player/PlayerForgotPassword";
import PlayerVerifyForgotOtp from "@/pages/auth/player/PlayerVerifyForgotOtp";
import PlayerDashboard from "@/pages/player/PlayerDashboard";
import PlayerProfile from "@/pages/auth/player/PlayerProfile";
import PlayerResetPassword from "@/pages/auth/player/PlayerResetPassword";
import PlayerDeleteAccount from "@/pages/auth/player/PlayerDeleteAccount";
import PlayerLayout from "@/components/player-layout/PlayerLayout";

/* ================= TEAM OWNER ================= */
import TeamOwnerLogin from "@/pages/auth/team-owner/TeamOwnerLogin";
import TeamOwnerSignup from "@/pages/auth/team-owner/TeamOwnerSignup";
import TeamOwnerVerifyOtp from "@/pages/auth/team-owner/TeamOwnerVerifySignupOtp";
import TeamOwnerForgotPassword from "@/pages/auth/team-owner/TeamOwnerForgotPassword";
import TeamOwnerVerifyForgotOtp from "@/pages/auth/team-owner/TeamOwnerVerifyForgotOtp";
import TeamOwnerDashboard from "@/pages/team-owner/TeamOwnerDashBoard";
import TeamOwnerLayout from "@/components/team-owner-layout/TeamOwnerLayout";
import TeamOwnerResetPassword from "@/pages/auth/team-owner/TeamOwnerResetPassword";
import TeamOwnerDeleteAccount from "@/pages/auth/team-owner/TeamOwnerDeleteAccount";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

export default function AppRoutes() {
  return (
    <Routes>

      {/* ===== PUBLIC ===== */}
      <Route path="/" element={<Home />} />
      <Route path="/match/:matchId" element={<PublicMatchDetails />} />
      <Route path="/matches/schedule" element={<PublicMatchSchedule />} />
      <Route path="/matches/archive" element={<PublicMatchArchives />} />
      <Route path="/browse/teams" element={<PublicBrowseTeams />} />
      <Route path="/browse/teams/:teamId" element={<PublicTeamDetails />} />
      <Route path="/browse/players" element={<PublicBrowsePlayers />} />
      <Route path="/points/:leagueId" element={<PublicPointsTable />} />
      <Route path="/players/:playerId" element={<PublicPlayerProfile />} />
      <Route path="/login" element={<LoginSelector />} />

      {/* ===== ADMIN AUTH ===== */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/signup" element={<AdminRegister />} />
      <Route path="/admin/verify-otp" element={<AdminVerifySignupOtp />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/verify-forgot-otp" element={<AdminVerifyForgotOtp />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />

      {/* ===== TEAM OWNER AUTH ===== */}
      <Route path="/team-owner/login" element={<TeamOwnerLogin />} />
      <Route path="/team-owner/signup" element={<TeamOwnerSignup />} />
      <Route path="/team-owner/verify-otp" element={<TeamOwnerVerifyOtp />} />
      <Route path="/team-owner/forgot-password" element={<TeamOwnerForgotPassword />} />
      <Route path="/team-owner/verify-forgot-otp" element={<TeamOwnerVerifyForgotOtp />} />
      <Route path="/team-owner/reset-password" element={<TeamOwnerResetPassword />} />

      {/* ===== PLAYER AUTH ===== */}
      <Route path="/player/login" element={<PlayerLogin />} />
      <Route path="/player/signup" element={<PlayerSignup />} />
      <Route path="/player/verify-otp" element={<PlayerVerifyOtp />} />
      <Route path="/player/forgot-password" element={<PlayerForgotPassword />} />
      <Route path="/player/verify-forgot-otp" element={<PlayerVerifyForgotOtp />} />
      <Route path="/player/reset-password" element={<PlayerResetPassword />} />

      {/* ===== ADMIN PROTECTED ===== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="reset-password" element={<AdminResetPassword />} />
        <Route path="delete-account" element={<AdminDeleteAccount />} />

        <Route path="leagues" element={<Leagues />} />
        <Route path="leagues/create" element={<CreateLeague />} />
        <Route path="leagues/:id" element={<LeagueDetails />} />
        <Route path="leagues/update/:id" element={<UpdateLeague />} />
        <Route path="leagues/delete/:id" element={<DeleteLeague />} />
        <Route
          path="leagues/:leagueId/match/:matchId"
          element={<MatchScoreboard />}
        />
        <Route
          path="leagues/:leagueId/match/:matchId/update"
          element={<UpdateMatchSchedule />}
        />

        <Route path="teams/:id" element={<TeamDetails />} />
      </Route>

      {/* ===== PLAYER PROTECTED ===== */}
      <Route
        path="/player"
        element={
          <ProtectedRoute>
            <PlayerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PlayerDashboard />} />
        <Route path="profile" element={<PlayerProfile />} />
        <Route path="reset-password" element={<PlayerResetPassword />} />
        <Route path="delete-account" element={<PlayerDeleteAccount />} />
      </Route>

      {/* ===== TEAM OWNER PROTECTED ===== */}
      <Route
        path="/team-owner"
        element={
          <ProtectedRoute>
            <TeamOwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<TeamOwnerDashboard />} />
        <Route path="teams/create" element={<CreateTeam />} />
        <Route path="teams/:id" element={<TeamDetails />} />
        <Route path="teams/update/:id" element={<UpdateTeam />} />
        <Route path="teams/delete/:id" element={<DeleteTeam />} />
        <Route path="reset-password" element={<TeamOwnerResetPassword />} />
        <Route path="delete-account" element={<TeamOwnerDeleteAccount />} />
      </Route>

    </Routes>
  );
}
