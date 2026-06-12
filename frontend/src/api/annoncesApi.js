import api from './axios'

export const annoncesApi = {
  getDetail: (annonceId, includeContacts = false) =>
    api.get(`/api/annonces/${annonceId}`, {
      params: { includeContacts },
    }),
}
