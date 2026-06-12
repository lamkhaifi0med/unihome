import api from "./axios";

export const searchApi = {
  getAnnonces: () => api.get("/api/annonces/recherche"),
  searchNearUniversity: ({ universiteId, rayon = 5000, page = 0, size = 60 }) =>
    api.get("/api/annonces/recherche/campus", {
      params: { universiteId, rayon, page, size },
    }),
};
