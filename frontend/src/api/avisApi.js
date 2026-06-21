import api from "./axios";

export const avisApi = {
  // Public: list of avis for an annonce (newest first)
  getByAnnonce: (annonceId) => api.get(`/api/avis/annonce/${annonceId}`),

  // Authenticated: tells the current student whether they can leave an avis.
  // We use _silentAuth so a 401 does not trigger the global logout flow:
  // unauthenticated visitors get a clean "cannot review" response from us
  // rather than being kicked out of the page.
  getEligibilite: (annonceId) =>
    api.get(`/api/avis/eligibilite/${annonceId}`, { _silentAuth: true }),

  // Authenticated: post a review. Server derives student identity from JWT.
  create: ({ annonceId, note, commentaire }) =>
    api.post("/api/avis", { annonceId, note, commentaire }),
};
