import axios from "./axios";

export const adminLogin = (data) =>
  axios.post("/api/admin/login", data);

export const adminSignup = (data) =>
  axios.post("/api/admin/signup", data);

export const adminVerifyOtp = ({ email, otp }) =>
  axios.post("/api/admin/verify-otp", { email, otp });

export const adminForgotPassword = (email) =>
  axios.post("/api/admin/forgot-password", { email });

export const adminVerifyForgotOtp = ({ email, otp }) =>
  axios.post("/api/admin/verify-forgot-otp", { email, otp });

export const adminResetPassword = (data) =>
  axios.put("/api/admin/reset-password", data);

export const adminDelete = () =>
  axios.delete("/api/admin/delete");
