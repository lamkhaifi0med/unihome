import api from './axios'

export const ownerApi = {
  getEquipements: () => api.get('/api/equipements'),
  getUniversites: () => api.get('/api/universites'),
  getOwnerAnnonces: (proprietaireId) => api.get(`/api/annonces/proprietaire/${proprietaireId}`),

  createLogement: (logement, justificatifFile) => {
    const formData = new FormData()
    formData.append(
      'logement',
      new Blob([JSON.stringify(logement)], { type: 'application/json' }),
    )
    if (justificatifFile) {
      formData.append('justificatifFile', justificatifFile)
    }
    return api.post('/api/logements', formData)
  },

  publishAnnonce: (logementId, annonce, photos) => {
    const formData = new FormData()
    formData.append('titre', annonce.titre)
    formData.append('description', annonce.description)
    formData.append('loyer', annonce.loyer)
    formData.append('chargesIncluses', String(annonce.chargesIncluses))

    annonce.contacts.forEach((contact, index) => {
      formData.append(`contacts[${index}].plateforme`, contact.plateforme)
      formData.append(`contacts[${index}].valeur`, contact.valeur)
    })

    annonce.equipementIds.forEach((id) => {
      formData.append('equipementIds', id)
    })

    photos.forEach((photo) => {
      formData.append('photos', photo.file)
    })

    return api.post(`/api/annonces/publier?logementId=${logementId}`, formData)
  },
}
