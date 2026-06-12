# Frontend <-> Backend integration guide (UniHome)

This doc is for the frontend dev to connect to the Spring Boot API. It explains base URL, auth, required headers, and payload shapes in simple terms.

## 1) Base URL
- Local (run with Docker or local Spring): `http://localhost:8080`
- Recommendation: use an env var in the frontend (ex: `VITE_API_URL` or `NEXT_PUBLIC_API_URL`).

## 2) Auth overview (simple)
- Register returns a confirmation token (email confirmation flow).
- Login is blocked until email is confirmed.
- After login, the API returns a JWT in `token`.
- For protected endpoints, send header: `Authorization: Bearer <token>`

## 3) Public vs protected routes
- Public: `/api/auth/**`
- Public: `GET /api/annonces/recherche`
- Protected: `POST /api/annonces/publier`, `/api/logements`, `/api/avis`, and any other endpoint not listed above.

## 4) Endpoints and payloads

### 4.1 Auth

#### POST `/api/auth/register`
Use this for ETUDIANT (and ADMIN if needed).

Request (JSON):
```json
{
  "nom": "Ali",
  "prenom": "Z",
  "email": "ali@example.com",
  "motDePasse": "secret123",
  "role": "ETUDIANT",
  "numeroCin": null,
  "telephone": null
}
```

Response (JSON):
```json
{
  "token": null,
  "confirmationToken": "uuid-token-string"
}
```

Notes:
- If role is PROPRIETAIRE, use the multipart endpoint below.
- If email already exists -> 400/409.

#### POST `/api/auth/register` (multipart)
For PROPRIETAIRE with CIN file.

FormData fields:
- `user`: JSON string for `RegisterRequestDTO`
- `cinFile`: file

Example (JS):
```js
const fd = new FormData();
fd.append(
  "user",
  new Blob([
    JSON.stringify({
      nom: "Sara",
      prenom: "B",
      email: "sara@example.com",
      motDePasse: "secret123",
      role: "PROPRIETAIRE",
      numeroCin: "AB123456",
      telephone: "0612345678"
    })
  ], { type: "application/json" })
);
fd.append("cinFile", fileInput.files[0]);

fetch(`${API_URL}/api/auth/register`, {
  method: "POST",
  body: fd
});
```

Errors:
- CIN already used -> 400 "CIN deja utilise"
- Missing file/fields -> 400

#### POST `/api/auth/login`
Request (JSON):
```json
{
  "email": "ali@example.com",
  "motDePasse": "secret123"
}
```
Response (JSON):
```json
{
  "token": "jwt-token",
  "confirmationToken": null
}
```

If email not confirmed -> 403 "Email non confirme".

#### GET `/api/auth/confirm?token=...`
Confirm email with the token sent by email or returned at register.
Response: plain text string.

#### POST `/api/auth/resend-confirmation`
Request (JSON):
```json
{ "email": "ali@example.com" }
```
Response: plain text string.

---

### 4.2 Logements

#### POST `/api/logements`
Protected. Multipart request.

FormData fields:
- `logement`: JSON for `LogementRequestDTO`
- `justificatifFile` (optional): file

`LogementRequestDTO` fields:
```json
{
  "proprietaireId": "uuid",
  "adresse": "Rue 123",
  "ville": "Rabat",
  "superficie": 30.5,
  "typeLogement": "STUDIO",
  "latitude": 34.01,
  "longitude": -6.83,
  "justificatifUrl": null,
  "adresseConfirmee": null
}
```

Response: `LogementResponseDTO`.

---

### 4.3 Annonces

#### POST `/api/annonces/publier`
Protected. Multipart request.

Query param:
- `logementId` (UUID)

Form fields for `AnnonceRequestDTO`:
- `titre` (string)
- `description` (string)
- `loyer` (number)
- `chargesIncluses` (boolean)
- `contacts` (array of objects)
- `photos` (2-10 files)

Contacts object format:
```json
{ "plateforme": "WHATSAPP", "valeur": "+212612345678" }
```

Example (JS):
```js
const fd = new FormData();
fd.append("titre", "Studio proche fac");
fd.append("description", "Calme et meuble");
fd.append("loyer", "2000");
fd.append("chargesIncluses", "true");
fd.append(
  "contacts",
  new Blob([JSON.stringify([{ plateforme: "WHATSAPP", valeur: "+212612345678" }])], {
    type: "application/json"
  })
);
photos.forEach((p) => fd.append("photos", p));

fetch(`${API_URL}/api/annonces/publier?logementId=${logementId}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: fd
});
```

#### GET `/api/annonces/recherche`
Public. Two modes:

A) Simple list:
```
GET /api/annonces/recherche
```
Response: `List<AnnonceRechercheDTO>`

B) With distance filter:
```
GET /api/annonces/recherche?universiteId=<uuid>&rayon=2000&page=0&size=20
```
Response: `Page<AnnonceRechercheDTO>` sorted by distance.

---

### 4.4 Avis

#### POST `/api/avis`
Protected.

Request (JSON):
```json
{
  "etudiantId": "uuid",
  "annonceId": "uuid",
  "consultationId": "uuid",
  "note": 4,
  "commentaire": "Bon logement"
}
```

Response: `Avis` entity.

---

## 5) Enums used by the API
- `RoleEnum`: `ETUDIANT`, `PROPRIETAIRE`, `ADMIN`
- `TypeLogementEnum`: `STUDIO`, `CHAMBRE`, `COLOCATION`, `APPARTEMENT`
- `StatutLogementEnum`: `DISPONIBLE`, `OCCUPE`, `ARCHIVE`
- `StatutAnnonceEnum`: `EN_ATTENTE`, `VALIDEE`, `REJETEE`, `SUSPENDUE`, `ARCHIVEE`
- `TypeContactEnum`: `TELEPHONE`, `WHATSAPP`, `EMAIL`, `FACEBOOK`, `INSTAGRAM`

## 6) Common headers
- JSON requests: `Content-Type: application/json`
- Multipart requests: **do not set** `Content-Type` manually, let the browser set it.
- Protected endpoints: `Authorization: Bearer <jwt>`

## 7) CORS note
There is no explicit CORS config in the backend. If the frontend runs on a different origin (ex: `http://localhost:5173`), we may need to add CORS rules in Spring.

## 8) Minimal frontend setup
- Store token in memory or storage after login.
- Add `Authorization` header for protected routes.
- Use env var for API base URL.

## 9) Files used in backend
- Controllers: `backend/src/main/java/com/unihome/api/controller/*Controller.java`
- DTOs: `backend/src/main/java/com/unihome/api/dto/*`
- Security config: `backend/src/main/java/com/unihome/api/config/SecurityConfig.java`
- Auth service: `backend/src/main/java/com/unihome/api/service/AuthService.java`

## 10) React integration (frontend guide)

### 10.1 Base URL (env)
Use an env variable so you can switch environments without changing code.

- Vite:
```
VITE_API_URL=http://localhost:8080
```

- CRA (Create React App):
```
REACT_APP_API_URL=http://localhost:8080
```

### 10.2 Fetch example (login)
```js
const API_URL = import.meta.env.VITE_API_URL; // Vite

const res = await fetch(`${API_URL}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, motDePasse })
});

const data = await res.json();
localStorage.setItem("token", data.token);
```

### 10.3 Fetch example (protected route)
```js
const token = localStorage.getItem("token");

await fetch(`${API_URL}/api/annonces/publier?logementId=${logementId}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});
```

### 10.4 Axios setup (optional)
```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 10.5 Axios example (login)
```js
import api from "./api";

const { data } = await api.post("/api/auth/login", {
  email,
  motDePasse
});

localStorage.setItem("token", data.token);
```

### 10.6 Common pitfalls
- For `FormData`, do NOT set `Content-Type` manually.
- If you get CORS errors from `http://localhost:5173`, we need to enable CORS in Spring.
- Login only works after email confirmation.

