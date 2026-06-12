import api from "./axios";

export const usersApi = {
  getMe: () => api.get("/api/users/me"),
  updateMe: (data) => api.put("/api/users/me", data),
  updateCin: (formData) => api.post("/api/users/me/cin", formData),
  getStats: () => api.get("/api/users/me/stats"),
};
