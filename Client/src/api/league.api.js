import api from "./axios";

export const leagueApi = {
  getAll: () => api.get("/api/leagues/all"),

  getById: (id) => api.get(`/api/leagues/${id}`),

  delete: (id) => api.delete(`/api/leagues/delete/${id}`),

  update: (id, formData) =>
    api.put(`/api/leagues/update/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

