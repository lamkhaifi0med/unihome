import api from "./axios";

export const adminApi = {
  // Stats
  getStats: () => api.get("/api/admin/stats"),

  // Moderation queue (EN_ATTENTE + SUSPENDUE)
  getQueue: () => api.get("/api/admin/annonces/queue"),
  validerAnnonce: (id) => api.post(`/api/admin/annonces/${id}/valider`),
  rejeterAnnonce: (id, raison) =>
    api.post(`/api/admin/annonces/${id}/rejeter`, { raison }),

  // Users
  getUsers: (search) =>
    api.get("/api/admin/users", { params: search ? { search } : {} }),
  suspendreUser: (id, raison) =>
    api.post(`/api/admin/users/${id}/suspendre`, { raison }),
  reactiverUser: (id) => api.post(`/api/admin/users/${id}/reactiver`),
  validerCin: (id) => api.post(`/api/admin/users/${id}/valider-cin`),
  demanderNouveauCin: (id, raison) =>
    api.post(`/api/admin/users/${id}/demander-nouveau-cin`, { raison }),

  // Signalements
  getSignalements: (statut) =>
    api.get("/api/admin/signalements", { params: statut ? { statut } : {} }),
  traiterSignalement: (id) => api.post(`/api/admin/signalements/${id}/traiter`),
  rejeterSignalement: (id) => api.post(`/api/admin/signalements/${id}/rejeter`),
  suspendreAnnonceDepuisSignalement: (id, raison) =>
    api.post(`/api/admin/signalements/${id}/suspendre-annonce`, { raison }),
};

// Student: report an annonce
export const signalerAnnonce = (annonceId, data) =>
  api.post(`/api/annonces/${annonceId}/signaler`, data);
