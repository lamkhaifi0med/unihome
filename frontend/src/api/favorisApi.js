import api from "./axios";

export const favorisApi = {
  getMine: () => api.get("/api/favoris/me", { _silentAuth: true }),
  add: (annonceId) => api.post(`/api/favoris/${annonceId}`),
  remove: (annonceId) => api.delete(`/api/favoris/${annonceId}`),
};
