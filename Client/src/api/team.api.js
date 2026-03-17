import axios from "./axios";

export const teamApi = {
  /* ================= GET ================= */

  // All teams (admin / public use)
  getAll: () => axios.get("/api/teams"),

  // Teams created by logged-in Team Owner
  getMyTeams: () => axios.get("/api/teams/my"),

  // Get team by ID
  getById: (id) => axios.get(`/api/teams/${id}`),

  // Get team details with players
  getDetails: (id) => axios.get(`/api/teams/${id}/details`),

  /* ================= CREATE ================= */
  create: (formData) =>
    axios.post("/api/teams", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /* ================= UPDATE ================= */
  update: (id, formData) =>
    axios.put(`/api/teams/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /* ================= DELETE ================= */
  delete: (id) => axios.delete(`/api/teams/${id}`),
};
