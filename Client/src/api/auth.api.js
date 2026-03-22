import axios from "./axios";

export const adminLogin = (data) =>
  axios.post("/api/auth/login", { ...data, role: "ADMIN" });

export const adminSignup = (data) =>
  axios.post("/api/auth/signup", { ...data, role: "ADMIN" });

export const adminVerifyOtp = ({ email, otp }) =>
  axios.post("/api/auth/verify-otp", { email, otp });

export const adminForgotPassword = (email) =>
  axios.post("/api/auth/forgot-password", { email });

export const adminVerifyForgotOtp = ({ email, otp, newPassword }) =>
  axios.post("/api/auth/verify-forgot-otp", { email, otp, newPassword });

export const adminResetPassword = (data) =>
  axios.put("/api/auth/reset-password", data);

export const adminDelete = () =>
  axios.delete("/api/auth/delete");
