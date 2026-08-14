import api from "./axios";

export const ownerApi = {
  getEquipements: () => api.get("/api/equipements"),
  getUniversites: () => api.get("/api/universites"),
  getOwnerAnnonces: (proprietaireId) =>
    api.get(`/api/annonces/proprietaire/${proprietaireId}`),

  createLogement: (logement, justificatifFile) => {
    const formData = new FormData();
    formData.append(
      "logement",
      new Blob([JSON.stringify(logement)], { type: "application/json" }),
    );
    if (justificatifFile) {
      formData.append("justificatifFile", justificatifFile);
    }
    return api.post("/api/logements", formData);
  },

  publishAnnonce: (logementId, annonce, photos) => {
    const formData = new FormData();
    formData.append("titre", annonce.titre);
    formData.append("description", annonce.description);
    formData.append("loyer", annonce.loyer);
    formData.append("chargesIncluses", String(annonce.chargesIncluses));

    annonce.contacts.forEach((contact, index) => {
      formData.append(`contacts[${index}].plateforme`, contact.plateforme);
      formData.append(`contacts[${index}].valeur`, contact.valeur);
    });

    annonce.equipementIds.forEach((id) => {
      formData.append("equipementIds", id);
    });

    photos.forEach((photo) => {
      formData.append("photos", photo.file);
    });

    return api.post(`/api/annonces/publier?logementId=${logementId}`, formData);
  },

  // Modification d'une annonce rejetee : photos conservees par URL,
  // nouvelles photos par fichier. Re-passe le pipeline IA cote backend.
  updateAnnonce: (
    annonceId,
    annonce,
    keptPhotoUrls,
    newPhotos,
    justificatifFile,
    ordrePhotos,
  ) => {
    const formData = new FormData();
    formData.append("titre", annonce.titre);
    formData.append("description", annonce.description);
    formData.append("loyer", annonce.loyer);
    formData.append("chargesIncluses", String(annonce.chargesIncluses));

    annonce.contacts.forEach((contact, index) => {
      formData.append(`contacts[${index}].plateforme`, contact.plateforme);
      formData.append(`contacts[${index}].valeur`, contact.valeur);
    });

    annonce.equipementIds.forEach((id) => {
      formData.append("equipementIds", id);
    });
    (keptPhotoUrls || []).forEach((url) => {
      formData.append("photosConservees", url);
    });
    (newPhotos || []).forEach((photo) => {
      formData.append("photos", photo.file);
    });
    (ordrePhotos || []).forEach((token) => {
      formData.append("ordrePhotos", token);
    });
    if (justificatifFile) {
      formData.append("justificatifFile", justificatifFile);
    }
    return api.put(`/api/annonces/${annonceId}`, formData);
  },

  archiveAnnonce: (annonceId) =>
    api.post(`/api/annonces/${annonceId}/archiver`),
  unarchiveAnnonce: (annonceId) =>
    api.post(`/api/annonces/${annonceId}/desarchiver`),
  deleteAnnonce: (annonceId) => api.delete(`/api/annonces/${annonceId}`),
};
