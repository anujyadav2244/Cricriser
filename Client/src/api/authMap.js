import * as adminApi from "@/api/auth.api";
import * as playerApi from "@/api/player.api";
import * as teamOwnerApi from "@/api/teamOwner.api";

export const AUTH_API = {
  ADMIN: {
    login: adminApi.adminLogin,
    signup: adminApi.adminSignup,
    verifySignupOtp: adminApi.adminVerifyOtp,
    forgotPassword: adminApi.adminForgotPassword,
    verifyForgotOtp: adminApi.adminVerifyForgotOtp,
    resetPassword: adminApi.adminResetPassword,
    deleteAccount: adminApi.adminDelete,
  },

  PLAYER: {
    login: playerApi.playerLogin,
    signup: playerApi.playerSignup,
    verifySignupOtp: playerApi.playerVerifyOtp,
    forgotPassword: playerApi.playerForgotPassword,
    verifyForgotOtp: playerApi.playerVerifyForgotOtp,
    resetPassword: playerApi.playerResetPassword,
    deleteAccount: playerApi.playerDelete,
  },

  TEAM_OWNER: {
    login: teamOwnerApi.teamOwnerLogin,
    signup: teamOwnerApi.teamOwnerSignup,
    verifySignupOtp: teamOwnerApi.teamOwnerVerifyOtp,
    forgotPassword: teamOwnerApi.teamOwnerForgotPassword,
    verifyForgotOtp: teamOwnerApi.teamOwnerVerifyForgotOtp,
    resetPassword: teamOwnerApi.teamOwnerResetPassword,
    deleteAccount: teamOwnerApi.teamOwnerDelete,
  },
};

export const ROLE_ROUTES = {
  ADMIN: {
    label: "Admin",
    login: "/admin/login",
    signup: "/admin/signup",
    verifySignupOtp: "/admin/verify-otp", 
    dashboard: "/admin/dashboard",
    forgotPassword: "/admin/forgot-password",
    resetPassword: "/admin/reset-password",
  },

  PLAYER: {
    label: "Player",
    login: "/player/login",
    signup: "/player/signup",
    verifySignupOtp: "/player/verify-otp",
    dashboard: "/player/dashboard",
    forgotPassword: "/player/forgot-password",
    resetPassword: "/player/reset-password",
  },

  TEAM_OWNER: {
    label: "Team Owner",
    login: "/team-owner/login",
    signup: "/team-owner/signup",
    verifySignupOtp: "/team-owner/verify-otp", 
    dashboard: "/team-owner/dashboard",
    forgotPassword: "/team-owner/forgot-password",
    resetPassword: "/team-owner/reset-password",
  },
};
