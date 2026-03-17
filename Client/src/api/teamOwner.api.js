import axios from "./axios";

export const teamOwnerSignup = data =>
  axios.post("/api/team-owner/signup", data);

export const teamOwnerVerifyOtp = ({email, otp}) =>
  axios.post("/api/team-owner/verify-otp", { email, otp:String(otp) });

export const teamOwnerLogin = data =>
  axios.post("/api/team-owner/login", data);

export const teamOwnerForgotPassword = email =>
  axios.post("/api/team-owner/forgot-password", { email });

export const teamOwnerVerifyForgotOtp = ({email, otp}) =>
  axios.post("/api/team-owner/verify-forgot-otp", { email, otp:String(otp) });

export const teamOwnerResetPassword = data =>
  axios.put("/api/team-owner/reset-password", data);

export const teamOwnerDelete = () =>
  axios.delete("/api/team-owner/delete");
