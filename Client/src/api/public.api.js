import axios from "./axios";

/* ================= MATCH TABS ================= */
export const getMatchesByTab = (tab) =>
  axios.get(`/api/matches/public/${tab}`);

/* ================= SCOREBOARD ================= */
export const getMatchScoreboard = (matchId) =>
  axios.get(`/api/match/scoreboard/${matchId}`);

/* ================= COMMENTARY ================= */
export const getCommentary = (matchId) =>
  axios.get(`/api/ballbyball/${matchId}`);

/* ================= POINTS TABLE ================= */
export const getPointsTable = (leagueId) =>
  axios.get(`/api/points/${leagueId}`);
