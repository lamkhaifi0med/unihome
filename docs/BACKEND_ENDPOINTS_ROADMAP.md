# UniHome Backend Endpoints Roadmap

This document lists backend endpoints required by the UniHome Bible, split into **Done** (implemented in code) and **To Do** (not yet implemented). It is meant as a completion checklist for the backend.

Sources:

- Bible: `../backend/UniHome_Bible.md`
- Current controllers:
  - `backend/src/main/java/com/unihome/api/controller/AuthController.java`
  - `backend/src/main/java/com/unihome/api/controller/AnnonceController.java`
  - `backend/src/main/java/com/unihome/api/controller/LogementController.java`
  - `backend/src/main/java/com/unihome/api/controller/AvisController.java`

---

## 1) Auth & Registration

### Done

- `POST /api/auth/register` (etudiant/admin)
- `POST /api/auth/register` (multipart, proprietaire + CIN file)
- `POST /api/auth/login`
- `GET /api/auth/confirm?token=...`
- `POST /api/auth/resend-confirmation`

### To Do (Bible)

- Account suspension check in login (`is_active = true`)
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/users/me` (profile of logged-in user)
- `PUT /api/users/me` (complete/update student or owner fields after register)

---

## 2) Logements (properties)

### Done

- `POST /api/logements` (multipart create + optional justificatif)

### To Do (Bible)

- `GET /api/logements/{id}`
- `PUT /api/logements/{id}` (edit logement fields allowed by Bible)
- `DELETE /api/logements/{id}` (archive logement)
- `GET /api/logements?proprietaireId=...` (owner dashboard)

---

## 3) Annonces (listings)

### Done

- `POST /api/annonces/publier` (multipart)
- `GET /api/annonces/recherche` (simple list)
- `GET /api/annonces/recherche?universiteId=...` (distance search)

### To Do (Bible)

- `GET /api/annonces/{id}` (detail page)
- `PUT /api/annonces/{id}` (edit annonce + re-run AI pipeline)
- `DELETE /api/annonces/{id}` (archive annonce)
- `GET /api/annonces?proprietaireId=...` (owner listings)
- `GET /api/annonces/{id}/photos` (optional)

---

## 4) Consultations (contacts gate)

### To Do (Bible)

- `POST /api/consultations` (create on listing view)
- `PATCH /api/consultations/{id}/show-contacts`
- `GET /api/annonces/{id}/contacts` (requires contacts_affiches)

---

## 5) Contacts

### To Do (Bible)

- `GET /api/annonces/{id}/contacts` (gated by consultation)
- Validate Moroccan phone format in backend
- Enforce 1 contact per platform (DB UNIQUE already exists)

---

## 6) Favoris (favorites)

### To Do (Bible)

- `POST /api/favoris` (add)
- `DELETE /api/favoris/{annonceId}` (remove)
- `GET /api/favoris` (list for student)

---

## 7) Avis (reviews)

### Done

- `POST /api/avis`

### To Do (Bible)

- Gate: only after consultation with contacts_affiches = true
- `GET /api/annonces/{id}/avis`
- `GET /api/utilisateurs/{id}/avis` (owner rating details)

---

## 8) Signalements (fraud reports)

### To Do (Bible)

- `POST /api/signalements`
- `GET /api/signalements` (admin)
- `PATCH /api/signalements/{id}` (valider/rejeter)
- Auto-suspension after 3 open reports (DB triggers already exist)

---

## 9) Recommandations (AI)

### To Do (Bible)

- `GET /api/recommandations` (generate + return 3 items)

---

## 10) Universites

### To Do (Bible)

- `GET /api/universites` (list)
- `GET /api/universites/{id}` (detail)

---

## 11) Admin (moderation & management)

### To Do (Bible)

- `GET /api/admin/annonces/en-attente`
- `PATCH /api/admin/annonces/{id}/valider`
- `PATCH /api/admin/annonces/{id}/rejeter`
- `PATCH /api/admin/annonces/{id}/suspendre`
- `PATCH /api/admin/cin/{userId}/valider`
- `PATCH /api/admin/cin/{userId}/rejeter`
- `PATCH /api/admin/users/{id}/suspendre`
- `PATCH /api/admin/users/{id}/reactiver`
- `POST /api/admin/users/{id}/reset-password`

---

## 12) Chatbot

### To Do (Bible)

- `POST /api/chatbot` (proxy to Python service)

---

## 13) AI Fraud Pipeline

### To Do (Bible)

- Internal call to Python microservice `/analyse`
- Timeouts and fallback: set annonce to EN_ATTENTE if AI unavailable

---

## 14) Search extras (Bible)

### To Do (Bible)

- Filters: budget max, type, equipment, distance
- Sorting: distance, price asc/desc, score
- Pagination: default 12 (or 20) with load more

---

## Guide chronologique de completion (ordre recommande)

### Phase 0 — Base et securite

1. Verifier les regles d'acces et roles

- ETUDIANT/PROPRIETAIRE/ADMIN sur chaque action sensible.
- Bloquer login si `is_active = false`.

2. Auth de base a finaliser

- `GET /api/users/me`
- `PUT /api/users/me` (completer profil)
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Phase 1 — Navigation publique (MVP)

3. Recherche + listing details

- `GET /api/universites`
- `GET /api/universites/{id}`
- `GET /api/annonces/{id}`
- Search extras: filtres, tri, pagination

4. Details annonce + contacts gate

- `POST /api/consultations`
- `PATCH /api/consultations/{id}/show-contacts`
- `GET /api/annonces/{id}/contacts`

### Phase 2 — Cote proprietaire (MVP)

5. Logements

- `GET /api/logements/{id}`
- `PUT /api/logements/{id}`
- `DELETE /api/logements/{id}` (archive)
- `GET /api/logements?proprietaireId=...`

6. Annonces

- `PUT /api/annonces/{id}` (re-run IA)
- `DELETE /api/annonces/{id}` (archive)
- `GET /api/annonces?proprietaireId=...`

Regles metier a appliquer ici:

- 1 annonce active par logement (archiver l'ancienne avant la nouvelle)
- Expiration annonces a 90 jours (trigger deja en DB, verifier usage)

### Phase 3 — Cote etudiant (MVP)

7. Favoris

- `POST /api/favoris`
- `DELETE /api/favoris/{annonceId}`
- `GET /api/favoris`

8. Avis

- Gate: avis uniquement si `contacts_affiches = true`
- `GET /api/annonces/{id}/avis`
- `GET /api/utilisateurs/{id}/avis`

### Phase 4 — Trust & moderation

9. Signalements

- `POST /api/signalements`
- `GET /api/signalements` (admin)
- `PATCH /api/signalements/{id}`
- Auto-suspension 3 signalements (trigger DB deja OK)

10. Admin

- `GET /api/admin/annonces/en-attente`
- `PATCH /api/admin/annonces/{id}/valider`
- `PATCH /api/admin/annonces/{id}/rejeter`
- `PATCH /api/admin/annonces/{id}/suspendre`
- `PATCH /api/admin/cin/{userId}/valider`
- `PATCH /api/admin/cin/{userId}/rejeter`
- `PATCH /api/admin/users/{id}/suspendre`
- `PATCH /api/admin/users/{id}/reactiver`
- `POST /api/admin/users/{id}/reset-password`

### Phase 5 — IA et services externes

11. Pipeline IA

- Appel Python `/analyse`
- Timeouts + fallback EN_ATTENTE

12. Recommandations

- `GET /api/recommandations`

13. Chatbot

- `POST /api/chatbot`

### Phase 6 — Qualite et robustesse

14. Validations

- Telephone Maroc (regex)
- CIN unique (DB deja OK) + message clair
- 2-10 photos (trigger deja OK) + erreurs propres

15. Performance

- Vue `v_annonces_avec_distance` pour distance
- (Optionnel) cache Redis si prevu

16. Observabilite

- Codes HTTP coherents
- Messages d'erreur clairs

---

## Notes

- The Bible specifies JWT should live in React memory only. Backend still accepts `Authorization: Bearer <token>` for protected routes.
- CORS may be required if frontend runs on a different origin (ex: `http://localhost:5173`).
