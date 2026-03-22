import api from "./axios";

/* ================= AUTH ================= */

// SIGNUP
export const playerSignup = ({ email, password }) =>
  api.post("/api/auth/signup", {
    email,
    password,
    role: "PLAYER",
  });

// VERIFY SIGNUP OTP
export const playerVerifyOtp = ({ email, otp }) =>
  api.post("/api/auth/verify-otp", { email, otp });

// LOGIN ✅ FIXED
export const playerLogin = ({ email, password }) =>
  api.post("/api/auth/login", {
    email,
    password,
    role: "PLAYER",
  });

// FORGOT PASSWORD
export const playerForgotPassword = (email) =>
  api.post("/api/auth/forgot-password", { email });

// VERIFY FORGOT OTP
export const playerVerifyForgotOtp = ({
  email,
  otp,
  newPassword,
}) =>
  api.post("/api/auth/verify-forgot-otp", {
    email,
    otp,
    newPassword,
  });

// RESET PASSWORD
export const playerResetPassword = ({
  oldPassword,
  newPassword,
}) =>
  api.put("/api/auth/reset-password", {
    oldPassword,
    newPassword,
  });

// DELETE ACCOUNT
export const deletePlayerAccount = () =>
  api.delete("/api/auth/delete");
export const playerDelete = deletePlayerAccount;

/* ================= PLAYER PROFILE ================= */

export const createPlayerProfile = (profile) =>
  api.post("/api/player/profile", profile);

export const getMyPlayerProfile = () =>
  api.get("/api/player/me");

export const updatePlayerProfile = (profile) =>
  api.put("/api/player/update", profile);

export const deletePlayerProfile = () =>
  api.delete("/api/player/delete");
