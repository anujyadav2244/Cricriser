import axios from "./axios";

export const teamOwnerSignup = data =>
  axios.post("/api/auth/signup", { ...data, role: "TEAM_OWNER" });

export const teamOwnerVerifyOtp = ({email, otp}) =>
  axios.post("/api/auth/verify-otp", { email, otp:String(otp) });

export const teamOwnerLogin = data =>
  axios.post("/api/auth/login", { ...data, role: "TEAM_OWNER" });

export const teamOwnerForgotPassword = email =>
  axios.post("/api/auth/forgot-password", { email });

export const teamOwnerVerifyForgotOtp = ({email, otp}) =>
  axios.post("/api/auth/verify-forgot-otp", { email, otp:String(otp) });

export const teamOwnerResetPassword = data =>
  axios.put("/api/auth/reset-password", data);

export const teamOwnerDelete = () =>
  axios.delete("/api/auth/delete");
