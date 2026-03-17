import axios from "./axios";

export const getMatchScoreboard = async (matchId) => {
  const response = await axios.get(`/api/match/scoreboard/${matchId}`);
  return response.data;
};
