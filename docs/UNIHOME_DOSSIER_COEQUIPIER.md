# UniHome — Documentation du projet

### Tout ce qui est RÉELLEMENT réalisé dans le projet (vérifié dans le code)

> **À qui s'adresse ce document :** à mon coéquipier, comme référence de ce qui est réellement réalisé dans le projet, pour servir de base à la création de la présentation.
>
> **Règle d'or :** tout ce qui est écrit ici a été vérifié directement dans le code. On ne présente que ce qui existe vraiment. Les fonctionnalités non encore livrées servent de **référence interne** (§14) et se présentent en soutenance comme des **perspectives** (§16) — jamais comme des manques, et **jamais** comme déjà réalisées.
>
> Ce document est **autosuffisant** : il regroupe **tout** ce qu'il faut savoir pour bâtir la présentation — la **stack technique** réelle, l'**architecture**, les **deux modules IA**, mais aussi les **règles métier et workflows détaillés** (inscription, CIN, publication, recherche), un tableau des **idées reçues à corriger** et un **glossaire**. Le coéquipier n'a besoin **d'aucun autre fichier**.

---

## 1. Pitch en 30 secondes

**UniHome** est une plateforme web de **logement étudiant au Maroc** qui résout un vrai problème : aujourd'hui les étudiants cherchent un logement via des groupes WhatsApp/Facebook non vérifiés, avec des **annonces frauduleuses, des photos volées et des arnaques au paiement** avant même d'avoir visité.

UniHome apporte 3 choses qui n'existent pas ailleurs :

1. **Chaque annonce est notée par une IA (Trust Score 0–100)** avant publication — analyse multimodale (texte + photos + justificatif) par Google Gemini.
2. **Recherche géolocalisée par campus** (PostGIS) : on cherche autour des **coordonnées réelles de l'université**, pas juste par ville, avec **carte interactive + itinéraires**.
3. **Assistant IA UniBot** (Gemini) intégré, qui recommande uniquement des annonces réelles et validées.

La mise en relation se fait par **contact direct** (téléphone / WhatsApp affichés sur l'annonce). Pas de messagerie interne, pas de réservation, pas de paiement en ligne — c'est un choix assumé.

**Phrase d'intro/conclusion prête à dire :**

> « UniHome centralise des annonces de logement étudiant **vérifiées par IA** (Trust Scoring Gemini, 0–100), avec **recherche géolocalisée par campus (PostGIS)** et un **assistant UniBot**. La mise en relation se fait par contact direct (téléphone/WhatsApp) : la plateforme ne gère ni paiement, ni messagerie interne, ni réservation — ce sont des perspectives assumées. »

---

## 2. Les 3 acteurs (rôles)

Il existe **exactement 3 rôles** (`role_enum` en base : `ETUDIANT`, `PROPRIETAIRE`, `ADMIN`).

### Étudiant (ETUDIANT)

- S'inscrit (prénom, nom, email, mot de passe, université, budget max, ville de recherche) → confirmation par email obligatoire.
- Recherche géolocalisée par campus + filtres (ville, type, budget, surface, rayon, équipements).
- Carte interactive (Leaflet) avec itinéraires et anneaux de distance.
- Consulte le détail d'une annonce, **révèle les contacts réels** du propriétaire (téléphone/WhatsApp).
- **Favoris** (sauvegarder des annonces).
- **Avis & notation** (1–5) — uniquement après avoir consulté/révélé les contacts.
- **Signaler** une annonce frauduleuse (1 signalement max par annonce).
- Utilise l'**assistant UniBot**.

### Propriétaire (PROPRIETAIRE)

- S'inscrit avec en plus : **téléphone, numéro CIN et photo de la CIN** (uploadée sur Cloudinary, vérifiée manuellement par l'admin).
- Publie une annonce via un **formulaire en 4 étapes** (logement → photos → équipements → contacts).
- Voit le **Trust Score** de son annonce + un **message IA dédié** au propriétaire (comment améliorer).
- Gère ses annonces (liste, statuts, signalements reçus).
- Reçoit des **emails** (annonce validée/rejetée/suspendue, CIN à re-soumettre).
- **Peut publier même avant la vérification CIN**, mais ses annonces passent alors par la modération admin.

### Admin (ADMIN)

- **Pas d'auto-inscription** : les comptes admin sont créés directement en base.
- **Modère les annonces** en attente (file `EN_ATTENTE` / `SUSPENDUE`) : valider / rejeter (avec motif → email au propriétaire).
- **Vérifie les CIN** des propriétaires (valider ou demander une nouvelle photo).
- **Traite les signalements** : suspendre l'annonce, marquer traité, ou rejeter (non fondé).
- **Gère les utilisateurs** : recherche, suspendre / réactiver un compte.
- **Tableau de bord** : statistiques de la plateforme.

---

## 3. Stack technique exacte (versions réelles)

| Couche               | Technologies réelles                                                                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | React **18.2** + Vite **5.1** · TailwindCSS **3.4** · React Router **6.22** · Axios **1.7** · react-hook-form **7.5** · lucide-react (icônes) · **Leaflet 1.9.4** (chargé via CDN) · routage **OSRM** · JavaScript, interface **en français** |
| **API Core**         | **Spring Boot 4.0.5 · Java 17** · Spring Security · Spring Data JPA (Hibernate) · hibernate-spatial · Spring Mail · `jjwt` 0.11.5 (JWT) · Lombok · `cloudinary-http44` 1.39.0                                                                 |
| **Service IA**       | **FastAPI** · `google-generativeai` (**Gemini**) · `httpx` (async) · `tenacity` (retries) · `redis` (asyncio) · Pydantic · Uvicorn                                                                                                            |
| **Base de données**  | **PostgreSQL 15 + PostGIS 3.3** (image `postgis/postgis:15-3.3`)                                                                                                                                                                              |
| **Cache / mémoire**  | **Redis 7-alpine** — utilisé **uniquement** pour l'historique de conversation du chatbot (TTL ~1h, ~10 messages)                                                                                                                              |
| **Stockage objet**   | **Cloudinary** (photos d'annonces, CIN, justificatifs)                                                                                                                                                                                        |
| **Modèle IA**        | **`gemini-flash-latest`** par défaut (configurable via `GEMINI_MODEL_NAME`, avec modèles de secours), **free tier**. **Même clé et même modèle** pour le Trust Scoring ET pour UniBot.                                                        |
| **Auth**             | **JWT stateless** (HS256), expiration **1h** (`JWT_EXPIRATION_MS=3600000`). Mots de passe hashés **BCrypt**.                                                                                                                                  |
| **Conteneurisation** | **Docker Compose**, 5 conteneurs                                                                                                                                                                                                              |
| **CI**               | **GitHub Actions** (tests JUnit backend uniquement)                                                                                                                                                                                           |

> ✅ **Versions à citer telles quelles** : **Spring Boot 4.0.5**, **PostgreSQL 15 + PostGIS 3.3**, **Cloudinary** pour le stockage, modèle **`gemini-flash-latest`**. (Note interne : le commentaire en haut de `ai-service/main.py` mentionne encore « Gemini 1.5 Flash », mais le **code** charge bien `gemini-flash-latest`.)

---

## 4. Architecture & conteneurs Docker

### Les 5 conteneurs (réels, depuis `docker-compose.yml`)

| Conteneur            | Image / techno                    | Port (hôte → conteneur) | Rôle                                                 |
| -------------------- | --------------------------------- | ----------------------- | ---------------------------------------------------- |
| `unihome-db`         | `postgis/postgis:15-3.3`          | 5432 → 5432             | PostgreSQL + PostGIS, init via `backend/unihome.sql` |
| `unihome-redis`      | `redis:7-alpine`                  | 6379 → 6379             | Historique conversation UniBot                       |
| `unihome-ai-service` | FastAPI (build local)             | 8000 → 8000             | Trust Scoring + UniBot                               |
| `unihome-api`        | Spring Boot 4 (build local)       | **8095 → 8080**         | API REST principale                                  |
| `unihome-frontend`   | **Vite dev server** (build local) | **5173 → 5173**         | Front React (HMR, bind-mount)                        |

> Le front tourne avec le **serveur de dev Vite** (port 5173), pas nginx. L'API est exposée côté hôte sur **8095** (8080 = interne). `VITE_API_URL=http://localhost:8095`.

### Comment les services communiquent (important pour le slide architecture)

```
[ Navigateur ]
      │  HTTP (Axios, JWT Bearer)
      ▼
[ Frontend Vite :5173 ] ──HTTP──► [ Spring Boot API :8095/8080 ]
                                         │   ▲
                    HTTP/REST synchrone  │   │  HTTP + clé X-Internal-API-Key
                    (POST /analyze-listing,  │   │  (endpoints /api/internal/chatbot/**)
                     POST /chat)         ▼   │
                                   [ FastAPI service IA :8000 ]
                                         │
                                         ├──► Google Gemini API (cloud)
                                         └──► Redis :6379 (historique UniBot)

[ Spring Boot ] ──► PostgreSQL/PostGIS :5432
[ Spring Boot ] ──► Cloudinary (upload photos / CIN / justificatifs)
[ Spring Boot ] ──► SMTP (emails de confirmation, rejet, suspension…)
```

**Points clés à retenir :**

- Spring Boot ↔ FastAPI = **HTTP/REST synchrone** (PAS de Redis pub/sub, PAS de file de messages).
- Le service IA n'exécute **jamais** de SQL : pour le chatbot, il appelle des **endpoints internes en lecture seule** de Spring (`/api/internal/chatbot/**`), protégés par une **clé partagée** (`X-Internal-API-Key`, comparaison à temps constant).
- Redis sert **uniquement** à mémoriser la conversation UniBot.

---

## 5. Concepts métier essentiels

### 5.1 Logement et Annonce (détail interne du modèle de données — à NE PAS mettre en avant)

> ⚠️ **Ne présentez PAS cette séparation comme une fonctionnalité.** C'est un simple choix de **modélisation en base**, **invisible côté utilisateur** : il n'existe **aucun écran** pour « créer un logement » d'un côté puis « republier des annonces dessus » de l'autre. Côté front, la publication se fait dans **un seul formulaire** (les infos du bien et de l'annonce sont saisies ensemble). Si on insiste sur ce point en soutenance, on vous demandera de montrer un parcours qui n'existe pas — autant ne pas l'exposer.
>
> **Si la question est posée**, réponse honnête et courte : « C'est une séparation **technique en base de données** (une table `logements` pour le bien, une table `annonces` pour la publication) qui garde l'historique propre ; côté utilisateur, c'est transparent — un seul formulaire de publication. »

- En base : **`logements`** = le bien (adresse, ville, coordonnées GPS, surface, type) ; **`annonces`** = la publication (titre, loyer, photos, **Trust Score**, contacts, équipements, date d'expiration).
- À la publication, le backend crée le logement **puis** l'annonce en **une seule opération** déclenchée par le formulaire — l'utilisateur ne voit qu'une étape.
- Règle technique : **une seule annonce active par logement**. Publier de nouveau passe par le **même formulaire** ; l'ancienne annonce active est alors **archivée automatiquement** (mécanisme interne, **pas** un bouton « republier »).

### 5.2 Cycle de vie d'une annonce (`statut_annonce_enum`)

`EN_ATTENTE` → `VALIDEE` / `REJETEE` / `SUSPENDUE` / `ARCHIVEE`

- **Expiration automatique** : `date_expiration = date_publication + 90 jours` (trigger SQL).
- **Suspension automatique** : **3 signalements ouverts ⇒ annonce `SUSPENDUE`** (trigger SQL).

### 5.3 Les seuils de décision du Trust Score (à connaître par cœur)

| Score     | Décision                       | Statut       |
| --------- | ------------------------------ | ------------ |
| **≥ 70**  | Publication automatique        | `VALIDEE`    |
| **40–69** | Revue par l'admin (modération) | `EN_ATTENTE` |
| **< 40**  | Rejet automatique              | `REJETEE`    |

> La note IA est calculée par le service Python ; **la décision (le statut) est appliquée côté Spring Boot** selon ces seuils.

### 5.4 Le mécanisme Consultation → Avis

Quand un étudiant **révèle les contacts** d'une annonce, une **Consultation** est enregistrée (`contacts_affiches = true`). Un étudiant ne peut **laisser un avis** que s'il a une consultation avec contacts révélés (1 avis max par couple étudiant/annonce). Les avis recalculent automatiquement la note moyenne du propriétaire (trigger).

---

## 6. ⭐ Module IA n°1 — Trust Scoring (le cœur de l'innovation)

> **C'est LE point fort à montrer.** Endpoint : `POST /analyze-listing` (service FastAPI).

### 6.1 Ce qu'il fait

Quand un propriétaire publie une annonce, Spring Boot envoie les données au service IA, qui :

1. **Télécharge en parallèle** jusqu'à **5 photos échantillonnées** (début/milieu/fin de la galerie) + le **justificatif** (max 5 Mo chacun).
2. Envoie tout à **Gemini en multimodal** (texte + images + document) avec un prompt système strict.
3. Reçoit une note 0–100 par critère, applique des **garde-fous métier en Python**, et renvoie le score final + le détail + le raisonnement + **3 messages adaptés par rôle**.

### 6.2 Les 5 critères pondérés (la vraie formule)

```
scoreGlobal = justificatif×0.35 + photos×0.20 + prix×0.20 + description×0.15 + cohérence×0.10
```

| Critère          | Poids    | Ce qui est évalué                                                                                                                                              |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Justificatif** | **35 %** | Document marocain (facture ONEE/Redal/Amendis eau-électricité, acte…) : nom du propriétaire cohérent, adresse liée au logement. **Critère le plus important.** |
| **Photos**       | 20 %     | Qualité, cohérence, nombre, watermark, image de banque, suspicion d'image IA.                                                                                  |
| **Prix**         | 20 %     | Plausibilité selon ville / type / surface / marché étudiant marocain (en MAD).                                                                                 |
| **Description**  | 15 %     | Cohérence, longueur, **mots-clés à risque** (western union, mandat cash, avance/caution avant visite, propriétaire à l'étranger…).                             |
| **Cohérence**    | 10 %     | Est-ce que titre / description / prix / photos / justificatif racontent la même histoire ?                                                                     |

### 6.3 Scoring hybride (à valoriser : un LLM **encadré par des règles métier**)

Le système combine **2 couches**, et la couche Python ne peut **jamais remonter** un score — uniquement le maintenir ou le baisser (`apply_strict_business_rules()`) :

- **Couche LLM (Gemini)** : jugement qualitatif multimodal sur les 5 critères.
- **Couche règles métier (Python)**, en 2 temps :
  1. **Sous-scores déterministes** pour le **prix**, la **description** et les **photos** : un score « règles » est calculé en Python et on retient le **minimum** entre lui et celui de Gemini (on garde toujours le plus prudent). Ex. : prix < 800 MAD ⇒ score prix ≈ 18 ; description < 20 mots ⇒ forte pénalité ; mots de paiement à risque ⇒ −55 ; « propriétaire à l'étranger » ⇒ −35.
  2. **Plafonds globaux (caps)** : chaque alerte ajoute un plafond, et le score final ne peut pas dépasser le **plus bas** de tous les plafonds. Garde-fous réels :
     - Pas de justificatif (ou non téléchargeable) ⇒ **plafond 69** (jamais auto-validé).
     - Langage de paiement frauduleux (Western Union, mandat cash…) ⇒ **plafond 39** (rejet).
     - Nom ou adresse du justificatif clairement différents ⇒ **plafond 39**.
     - Prix extrêmement bas (< 800 MAD) ⇒ **plafond 55** (ou **39** si justificatif faible).
     - Moins de 2 photos ⇒ **plafond 69** (+ score photos plafonné à 35).

### 6.4 Messages séparés par rôle (vraie force à montrer)

Le score produit **3 messages distincts** (stockés en base dans `raison_statut`, format `unihome-ai-reason-v1`) :

- **student** : court, rassurant/prudent (« visitez avant tout paiement »).
- **owner** : actionnable (« ajoutez un justificatif lisible, plus de photos… »).
- **admin** : détaillé (preuves, incohérences, décision).

### 6.5 Robustesse technique (détails qui impressionnent)

- **Retries automatiques** avec backoff exponentiel (`tenacity`, 3 tentatives) + **modèles de secours**.
- **Parsing JSON défensif** (gère les réponses Gemini bruitées / fences Markdown).
- **Téléchargements asynchrones** des assets (`httpx`).
- Output **structuré** (`response_mime_type=application/json`, température 0.1).

### 6.6 Stockage du résultat (base de données)

- `annonces.score_confiance` (0–100)
- `annonces.detail_score` (**JSONB** : description, prix, photos, justificatif, coherence)
- `annonces.raison_statut` (**TEXT** : soit un message court — « IA indisponible… », « Archivée automatiquement… » —, soit un **JSON sérialisé** : scoreGlobal, decision, messages student/owner/admin, adminRaison)

---

## 7. ⭐ Module IA n°2 — UniBot (assistant conversationnel)

> Endpoint : `POST /chat` (service FastAPI). Intégré au frontend (widget flottant + page dédiée).

### 7.1 Ce qu'il fait

Assistant propulsé par **Gemini** qui aide les étudiants à trouver un logement, comprendre le Trust Score, publier/signaler une annonce. Il **recommande uniquement des annonces réelles et validées** (jamais d'invention), en mentionnant **ID / titre / prix / score + 2 raisons**.

### 7.2 Architecture = Tool-calling (function calling)

**À retenir :** UniBot repose sur le **tool-calling de Gemini** : le modèle décide d'appeler des **outils typés** qui interrogent la base **en lecture seule** via les endpoints internes de Spring Boot, puis formule sa réponse à partir de **données réelles**. (Si la question est posée : l'approche retenue est le tool-calling sur la vraie base, et non une recherche vectorielle.)

**3 outils exposés à Gemini :**
| Outil | Rôle |
| --- | --- |
| `search_annonces(filtres)` | Cherche des annonces **VALIDÉES** (ville, type, prix min/max, surface min, charges, score min, **équipements requis ET exclus**, autour d'une université, rayon). Gère les négations (« studio **sans** réfrigérateur »). |
| `get_annonce_details(annonceId)` | Détail complet d'une annonce précise. |
| `get_owner_listings()` | Annonces du propriétaire connecté (seulement si autorisé) — pour expliquer pourquoi une annonce est en attente/rejetée. |

**Boucle réelle :** Gemini reçoit le message → décide d'appeler un outil → FastAPI exécute l'appel HTTP vers Spring (`/api/internal/chatbot/search`, etc.) → renvoie le JSON à Gemini → Gemini formule la réponse finale. Boucle **bornée** (max 3 tours, timeout, max 20 résultats).

### 7.3 Réponse (format réel)

JSON complet (pas de streaming) : `reply`, `suggestedListingIds` (UUID validés par regex), `listingReasons` (2 raisons/annonce), `quickReplies` (suggestions rapides).

### 7.4 Langues

**Français + arabe standard + darija marocaine.** (⚠️ **Pas d'anglais** — ne pas annoncer « FR/AR/EN ».)

### 7.5 Mémoire & sécurité

- **Historique** de conversation stocké dans **Redis** (clé par `sessionId`, TTL ~1h, ~10 messages). C'est **le seul usage de Redis** dans le projet.
- **Garde-fous** : ne révèle jamais les contacts/CIN/justificatifs/notes admin ; ne recommande jamais les annonces privées du propriétaire comme résultats publics ; ne donne pas de conseil légal/financier.
- **Fallback local** : si Gemini est indisponible, une réponse de secours est renvoyée (jamais d'erreur brute à l'utilisateur).

---

## 8. Géolocalisation PostGIS

- Colonnes `coordonnees` de type **`GEOGRAPHY(Point, 4326)`** sur les tables `logements` et `universites`, avec **index spatiaux GIST**.
- Distance réelle calculée via **`ST_Distance`**, exposée par la **vue SQL `v_annonces_avec_distance`** (jointure annonces + logements + propriétaire + université, filtrée sur `VALIDEE` + non expirée).
- **Recherche ancrée sur l'université** : on cherche autour des **coordonnées réelles du campus** de l'étudiant (recherche par campus, pas seulement par ville).
- **Carte interactive (frontend, composant `SearchMap.jsx`)** :
  - **Leaflet 1.9.4** chargé dynamiquement via CDN.
  - **Itinéraires OSRM** : à pied / vélo / voiture (distance + durée estimées).
  - **Anneaux de distance** 1 km (vert), 3 km (violet), 5 km (orange), activables.
  - **Marqueur campus** (🎓) + **marqueurs d'annonces colorés selon le Trust Score** (≥70 vert, ≥40 violet, <40 rouge), badge « TOP » sur les meilleures.
- Le **formulaire de publication** utilise un `LocationPicker` Leaflet (marqueur déplaçable, géolocalisation du navigateur).

> ⚠️ Le chiffre « < 50 ms sur 10 000 annonces » parfois cité n'est **pas mesuré** dans le projet (aucun benchmark réalisé).

---

## 9. Backend — endpoints REST réels (par contrôleur)

> Base hôte : `http://localhost:8095`. Auth : `Authorization: Bearer <JWT>`.

### Auth — `/api/auth` (public)

- `POST /register` — inscription étudiant/admin (JSON) **ou** propriétaire (multipart + fichier CIN).
- `POST /login` — connexion (vérifie compte actif + email confirmé) → JWT.
- `GET /confirm?token=` — confirmation d'email.
- `POST /resend-confirmation` — renvoyer le lien de confirmation.
- `POST /forgot-password` · `POST /reset-password` — réinitialisation du mot de passe.

### Annonces — `/api/annonces`

- `POST /publier` (multipart, authentifié) — créer une annonce (déclenche le scoring IA, archive l'ancienne annonce active, upload photos Cloudinary).
- `GET /{annonceId}` (public, `?includeContacts=`) — détail d'une annonce.
- `GET /proprietaire/{proprietaireId}` (public) — annonces d'un propriétaire.
- `GET /recherche` (public) — toutes les annonces actives.
- `GET /recherche/campus?universiteId=&rayon=&page=&size=` (public) — recherche paginée autour d'un campus.
- `POST /{annonceId}/signaler` (ETUDIANT) — signaler une annonce.

### Logements — `/api/logements`

- `POST /` (multipart, propriétaire) — créer un logement (point PostGIS + justificatif optionnel).

### Favoris — `/api/favoris` (étudiant)

- `GET /me` · `POST /{annonceId}` · `DELETE /{annonceId}`.

### Avis — `/api/avis`

- `GET /annonce/{annonceId}` (public) — liste des avis.
- `GET /eligibilite/{annonceId}` (authentifié) — l'utilisateur peut-il noter ?
- `POST /` (étudiant) — créer un avis (note 1–5).

### Utilisateurs — `/api/users` (authentifié)

- `GET /me` · `PUT /me` · `GET /me/stats` · `POST /me/cin` (propriétaire).

### Chatbot — `/api/chatbot`

- `POST /` (public) — relaie vers le service IA et renvoie la réponse UniBot.

### Internes chatbot — `/api/internal/chatbot` (clé `X-Internal-API-Key`, lecture seule, uniquement `VALIDEE`)

- `POST /search` · `GET /annonces/{id}` · `GET /owner/{ownerId}/annonces`.

### Admin annonces — `/api/admin` (ROLE_ADMIN)

- `GET /stats` · `GET /annonces/queue` · `POST /annonces/{id}/valider` · `POST /annonces/{id}/rejeter`.

### Admin utilisateurs — `/api/admin/users` (ROLE_ADMIN)

- `GET /` (recherche) · `POST /{id}/suspendre` · `POST /{id}/reactiver` · `POST /{id}/valider-cin` · `POST /{id}/demander-nouveau-cin`.

### Admin signalements — `/api/admin/signalements` (ROLE_ADMIN)

- `GET /` · `POST /{id}/traiter` · `POST /{id}/rejeter` · `POST /{id}/suspendre-annonce`.

### Référentiels (public)

- `GET /api/universites` · `GET /api/equipements`.

### Services backend principaux

`AuthService`, `AnnonceService` (cycle de vie + scoring), `AnnonceAiClient` (HTTP → `/analyze-listing`), `ChatbotService` (HTTP → `/chat`), `AnnonceSearchService` (recherche JPA + PostGIS), `PhotoService` (Cloudinary), `EmailService` (SMTP), `AvisService`, `FavoriService`, `LogementService`, `ContactAnnonceService`.

### Sécurité (réelle)

- **JWT stateless** HS256 (`jjwt`), expiration **1h**, sessions **STATELESS**, mots de passe **BCrypt**.
- `JwtFilter` (Bearer) + `InternalApiKeyFilter` (clé interne, comparaison à temps constant, ≥ 32 caractères, l'app **refuse de démarrer** si la clé est absente/trop courte).
- **CORS** restreint à `http://localhost:5173`.
- Contrôle d'accès par rôle (`@PreAuthorize` sur admin, signalement…).

---

## 10. Frontend — pages, composants, UX réels

### Routes (23)

- **Publiques :** `/` et `/home-preview` (landing), `/login`, `/register`, `/confirm-email`, `/forgot-password`, `/reset-password`, `/annonces`, `/annonces/:id`, `/search`, `/chatbot`, `/score-rejet`.
- **Étudiant :** `/dashboard-etudiant`, `/favoris`, `/profil`.
- **Propriétaire :** `/dashboard-proprietaire`, `/publier-annonce`, `/mes-annonces`, `/profil-proprietaire`.
- **Admin :** `/admin`, `/admin/moderation`, `/admin/signalements`, `/admin/utilisateurs`.
- `PrivateRoute` redirige selon le rôle ; non connecté → `/login`.

### Pages notables

- **Search** : barre de filtres + tri (distance, prix, score) + grille de cartes + **carte Leaflet** + pagination « charger plus ».
- **AnnonceDetail** : carrousel photos, description, équipements, infos propriétaire, **contacts**, mini-carte, **avis + formulaire d'avis**, bouton **signaler**, bouton **favori**.
- **PublierAnnonce** : formulaire **4 étapes** (Logement → Photos → Équipements → Contacts) avec `LocationPicker` Leaflet.
- **Dashboards** étudiant / propriétaire / admin (stats + actions).
- **AdminModeration** : file d'attente + panneau détail + indicateurs de risque + boutons valider/rejeter.
- **AdminSignalements** : file des signalements + actions (suspendre/traiter/rejeter).
- **AdminUtilisateurs** : recherche, suspendre/réactiver, **revue CIN** (zoom image, valider / demander nouvelle photo).
- **Chatbot** : page plein écran (+ contexte annonce/propriétaire).

### Composants clés

- **`ChatbotWidget` / `ChatbotPanel`** : bulle flottante (sur toutes les pages sauf `/chatbot`), quick replies, sessionId, badge de score coloré. « Assistant UniHome, propulsé par Gemini ».
- **`SearchMap`** : carte Leaflet + OSRM + anneaux + marqueurs colorés (cf. §8).
- **`SearchBar`** : filtres campus/ville/budget/surface/type/rayon/équipements.
- **`AnnonceCard` / `ScoreBadge`** : carte d'annonce + **badge Trust Score** (≥70 vert « Annonce sérieuse », ≥40 ambre « À vérifier », <40 rouge « Annonce risquée »).
- **`Navbar` / `Sidebar` / `Footer`**, **`StatCard`**, **`ThemeToggle`** (mode sombre).

### Couche API & UX

- `axios.js` : base URL `VITE_API_URL` (def. `:8095`), **intercepteur 401 → logout + redirection `/login`** (sauf appels « silencieux » comme favoris/éligibilité avis), gestion multipart.
- Fichiers API : `authApi`, `annoncesApi`, `searchApi`, `favorisApi`, `avisApi`, `ownerApi`, `usersApi`, `adminApi`, `chatbotApi`.
- **Stockage du JWT : `localStorage`** (clé `auth_token`) synchronisé vers Axios ; rechargé au refresh, effacé au logout / 401.
- Hooks : `useAuth` (contexte d'auth), `useFavoris` (favoris + sync via `CustomEvent`), `useTheme` (dark/light).
- **Tout en français**, mode sombre, design responsive (Tailwind), polices Google (Syne, DM Sans, JetBrains Mono).

---

## 11. Base de données (PostgreSQL + PostGIS)

### Extensions

`postgis`, `pgcrypto`, `unaccent` (recherche insensible aux accents/casse pour le chatbot).

### Énumérations

- `role_enum` : ETUDIANT, PROPRIETAIRE, ADMIN
- `statut_annonce_enum` : EN_ATTENTE, VALIDEE, REJETEE, SUSPENDUE, ARCHIVEE
- `statut_logement_enum` : DISPONIBLE, OCCUPE, ARCHIVE
- `statut_signalement_enum` : OUVERT, TRAITE, REJETE
- `type_contact_enum` : TELEPHONE, WHATSAPP, EMAIL, FACEBOOK, INSTAGRAM
- `type_logement_enum` : STUDIO, CHAMBRE, COLOCATION, APPARTEMENT

### Tables principales

- **`utilisateurs`** (héritage single-table par `role`) : email unique, mot de passe, `email_confirme`, `is_active` ; étudiant (`budget_max`, `ville_recherche`, `universite_id`) ; propriétaire (`numero_cin` unique, `photo_cin_url`, `est_verifie_cin`, `note_moyenne`, `nb_avis_total`, `telephone`).
- **`logements`** : `adresse`, `ville`, `superficie`, `type_logement`, `statut_logement`, **`coordonnees GEOGRAPHY(Point,4326)`**, `justificatif_url`.
- **`annonces`** : `titre`, `description`, `loyer`, `charges_incluses`, `statut`, **`score_confiance`** (SMALLINT 0–100), **`detail_score` JSONB** (5 sous-scores), **`raison_statut` TEXT** (message court ou JSON sérialisé), `nb_signalements`, `date_publication`, `date_expiration`.
- **`photos`** : `url`, **`phash`** (colonne présente mais **non calculée** aujourd'hui), `est_principale`, `ordre`.
- **`contacts_annonce`** : `plateforme` + `valeur` (unique par annonce/plateforme).
- **`equipements`** (**15** au catalogue : WiFi, Meublé, Cuisine équipée, Climatisation, Ascenseur, Eau chaude, Parking, Gardien, Balcon, Lit, Bureau d'étude, Armoire/rangement, Machine à laver, Terrasse, Chauffage) + **`annonce_equipements`** (table de jointure).
- **`consultations`** : `contacts_affiches` (porte d'entrée vers les avis).
- **`avis`** : `note` (1–5), `commentaire` (unique par étudiant/annonce).
- **`favoris`** (clé composite étudiant/annonce).
- **`signalements`** : `raison`, `description`, `statut` (unique par étudiant/annonce).
- **`universites`** : `coordonnees GEOGRAPHY` (**41 universités** marocaines en seed).
- **`confirmation_tokens`** : confirmation email + reset mot de passe.
- **`recommandations`** : table présente avec triggers, mais **pas encore alimentée par l'application** (perspective).

### Vue

- **`v_annonces_avec_distance`** : jointure annonces/logements/propriétaire/université + **`ST_Distance`** (distance au campus), filtrée `VALIDEE` non expirée.

### Triggers / fonctions

- `set_annonce_expiration()` → `date_expiration = date_publication + 90 jours`.
- `auto_suspend_annonce()` → **3 signalements OUVERT ⇒ `SUSPENDUE`** + maj `nb_signalements`.
- `recalcule_note_proprietaire()` → recalcule `note_moyenne` / `nb_avis_total` à chaque avis (INSERT/UPDATE/DELETE).
- `check_photos_count()` → **max 10 photos** par annonce.
- `set_recommandation_expiration()` → +24 h. `set_updated_at()` → `updated_at`.

### Index

GIST spatiaux sur les `coordonnees`, GIN sur `detail_score` (JSONB), + index btree sur les colonnes de recherche.

---

## 12. Récapitulatif des fonctionnalités RÉELLES par rôle

**Étudiant :** recherche géolocalisée par campus + filtres · carte interactive Leaflet (itinéraires OSRM, anneaux de distance) · favoris · consultation d'annonces · **contact direct propriétaire (tél/WhatsApp)** · UniBot · avis & notation · signalement.

**Propriétaire :** publication guidée (4 étapes) · upload photos + **justificatif** (Cloudinary) · affichage **Trust Score** + message IA dédié · gestion des annonces · suivi des signalements reçus · vérification CIN (par l'admin) · emails de notification.

**Admin :** modération des annonces (valider/rejeter + email) · **vérification CIN** · traitement des **signalements** (3 signalements = suspension auto) · gestion des utilisateurs (suspendre/réactiver) · tableau de bord & statistiques.

---

## 13. CI/CD — la réalité (à ne pas survendre)

Le fichier réel `.github/workflows/ci.yml` fait **une seule chose** :

- Déclencheur : push sur `main` + pull requests.
- Démarre un service **PostGIS**, configure **JDK 17**, puis **lance les tests JUnit du backend**.

**N'existe PAS** dans la CI : ESLint (front), pytest (IA), build d'images Docker, push vers un registry, déploiement SSH. ⇒ Dire : **« CI : tests backend automatisés sur GitHub Actions »**. Il y a de l'**intégration continue**, pas de **déploiement continu**.

---

## 14. 🔒 Référence interne — périmètre actuel (à NE PAS transformer en slide de « manques »)

> **Pour vous, pas pour un slide.** Cette liste sert à **ne pas survendre** l'existant en Q&A. En soutenance : côté périmètre, dites ce que la plateforme **fait** ; côté évolution, présentez ces éléments comme **perspectives** (voir **§16**), **jamais** comme des manques — et **jamais** comme déjà réalisés.

Fonctionnalités **non encore livrées** (→ à présenter en perspectives, §16) :

- Messagerie / chat temps réel intégré — _aujourd'hui :_ contacts directs (tél/WhatsApp) affichés sur l'annonce.
- Réservation / booking en ligne — _aujourd'hui :_ mise en relation + consultation.
- Paiement en ligne.
- Application mobile native — _aujourd'hui :_ web responsive.
- Notifications temps réel — _aujourd'hui :_ emails.
- RAG / pgvector / embeddings / streaming pour UniBot — _aujourd'hui :_ tool-calling, réponse JSON complète.
- Reverse image search / lecture EXIF / comparaison inter-annonces — _aujourd'hui :_ analyse visuelle qualitative par Gemini.
- Scoring prix statistique (z-score / médiane géolocalisée) — _aujourd'hui :_ évaluation qualitative.

> _Notes purement internes (ne pas évoquer spontanément) : `phash` et la table `recommandations` existent en base mais ne sont pas encore exploités ; le scoring s'appuie sur l'API Gemini (pas de modèle entraîné en interne)._

---

## 15. Points forts du projet (arguments techniques)

1. **Trust Scoring IA hybride** (LLM Gemini **+ règles métier déterministes**) — des **garde-fous business** encadrent et sécurisent la décision finale.
2. **Analyse multimodale réelle** : texte **+ photos + justificatif** envoyés à Gemini Vision.
3. **UniBot en tool-calling** : l'IA **interroge la vraie base** en lecture seule via des endpoints sécurisés (pas d'hallucination d'annonces).
4. **Géolocalisation PostGIS par campus** + **carte interactive** (itinéraires OSRM, scoring couleur).
5. **Architecture multi-services conteneurisée** (5 conteneurs, 2 services applicatifs, séparation claire Spring/FastAPI).
6. **Sécurité** : JWT stateless, BCrypt, clé interne à temps constant, CORS restreint, validation au démarrage.
7. **Modèle de données soigné** : triggers (expiration, suspension auto, recalcul des notes), JSONB pour le détail du score, index spatiaux GIST.
8. **Messages IA séparés par rôle** (étudiant / propriétaire / admin) — UX pensée pour chaque acteur.

---

## 16. Limites assumées & perspectives produit

> **Comment le présenter (conseil soutenance).** Annoncez les limites comme des **choix de périmètre maîtrisés**, pas comme des oublis (« nous avons cadré le scope pour livrer un cœur fiable »), puis enchaînez sur les **perspectives** pour montrer une vraie **vision produit**. Mettez en avant **2-3 idées fortes** (matching colocation, paiement sécurisé, anti-fraude visuelle) plutôt que de tout lister. Une limite bien assumée + une perspective ambitieuse = signe de **maturité**, pas de faiblesse.

### 16.1 Limites assumées (lecture critique, choix de périmètre)

- **Périmètre « mise en relation », pas « transaction ».** UniHome sécurise la _découverte_ (annonces vérifiées par IA, contact direct) et s'arrête volontairement avant le bail et le paiement : choix de **simplicité et de sécurité**, et point de départ de notre roadmap réservation/paiement.
- **Confiance = IA + supervision humaine.** La zone grise du score (40–69) passe par une **modération admin** et la CIN est vérifiée manuellement : gage de fiabilité, mais qui suppose une capacité humaine → enjeu de **passage à l'échelle** (d'où l'automatisation prévue, ex. OCR de la CIN).
- **Couverture ancrée sur les universités référencées.** La recherche par campus s'appuie sur un référentiel d'universités marocaines : très pertinent pour la cible étudiante, mais l'extension nationale demande d'**enrichir les données**.
- **Dépendance maîtrisée à un service d'IA tiers.** Le scoring et UniBot reposent sur Gemini ; le risque est **anticipé par conception** (retries avec backoff, modèles de secours, fallback local) — le service ne renvoie jamais d'erreur brute à l'utilisateur.
- **Dynamique de marketplace (effet réseau).** La valeur croît avec le volume d'annonces vérifiées et d'étudiants actifs : enjeu d'**amorçage** classique, adressable par des partenariats universitaires et une stratégie de contenu.

### 16.2 Perspectives — feuille de route produit

**A. Renforcer la confiance (notre ADN)**

- 🌟 **Matching colocation intelligent** — recommander des binômes/trinômes de colocataires **compatibles** (budget, campus/quartier, rythme de vie, préférences). Répond à un besoin étudiant majeur et prolonge naturellement notre moteur de recommandation.
- **Recommandations personnalisées** — proposer à chaque étudiant les annonces les plus pertinentes (université, budget, favoris, historique de recherche).
- **Anti-fraude visuelle avancée** — reverse image search, lecture EXIF, comparaison inter-annonces et **hashing perceptuel** pour repérer les photos volées/réutilisées, en complément de l'analyse qualitative actuelle.
- **Scoring prix statistique** — objectiver le loyer par **z-score / médiane géolocalisée**, en appui du jugement IA.
- **Recherche sémantique (RAG) pour UniBot** — enrichir le tool-calling actuel d'une compréhension sémantique des descriptions.

**B. Fluidifier la mise en relation**

- **Messagerie intégrée temps réel** entre étudiant et propriétaire (au-delà du contact direct).
- **Notifications temps réel** (push / in-app) en complément des emails.
- **Application mobile native** (iOS / Android).

**C. Sécuriser la transaction**

- **Réservation + paiement sécurisé avec séquestre (escrow)** — dépôt de garantie protégé, libéré après visite/accord : prolongement logique du périmètre actuel.

---

## 17. Parcours & règles métier détaillés (vérifiés dans le code)

> Cette section reprend les workflows métier en ne gardant **que ce qui est réellement codé** (les détails ci-dessous ont été recoupés avec les DTO de validation, `AuthService`, `AnnonceService`, `AvisService`).

### 17.1 Inscription & confirmation par email

- **Étudiant** : prénom, nom, email, mot de passe, université, budget max, ville de recherche. Le compte est créé avec `email_confirme = false` (inactif), un **email de confirmation** est envoyé.
- **Propriétaire** : en plus → téléphone, numéro CIN, **photo de la CIN**. Le compte est créé avec `email_confirme = false` **et** `est_verifie_cin = false` (l'admin vérifiera la CIN ensuite).
- **Token de confirmation valide 24 h** (`plusHours(24)`). Clic sur le lien → `email_confirme = true` → compte actif.
- **Connexion** : refusée si email non confirmé (`403 « Email non confirme »`) ou compte suspendu (`403 « Compte suspendu »`).
- **Mot de passe oublié** : token de réinitialisation valide **1 h** (`plusHours(1)`), préfixé `reset-`.
- **Unicité** : email unique et `numero_cin` unique (contraintes base). Un propriétaire **peut publier avant** la vérification de sa CIN.

### 17.2 Publication d'une annonce — validations réelles

Le formulaire en 4 étapes (Logement → Photos → Équipements → Contacts) applique ces règles (validation backend) :

| Champ                | Règle réelle                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Titre**            | obligatoire, **max 200 caractères**                                                                         |
| **Description**      | obligatoire (**aucune longueur minimale imposée côté backend**)                                             |
| **Loyer**            | obligatoire, **> 0** (en MAD)                                                                               |
| **Charges incluses** | obligatoire (oui/non)                                                                                       |
| **Photos**           | **2 à 10** (obligatoire) — un **trigger SQL** bloque aussi tout dépassement de 10                           |
| **Équipements**      | **au moins 1 équipement requis**                                                                            |
| **Contacts**         | **au moins 1 contact** (plateforme + valeur). Plateformes : TELEPHONE, WHATSAPP, EMAIL, FACEBOOK, INSTAGRAM |

> Côté technique : le logement est d'abord créé (`POST /api/logements`, avec justificatif optionnel), puis l'annonce (`POST /api/annonces/publier`). L'annonce part en `EN_ATTENTE`, le **scoring IA** s'exécute, puis la décision est appliquée (≥70 / 40–69 / <40). Si l'IA est **indisponible** ou renvoie une réponse **incomplète** (messages par rôle manquants), l'annonce reste en `EN_ATTENTE` **sans score** (validation manuelle). Publier une nouvelle annonce **auto-archive** l'annonce active précédente du même logement.

### 17.3 Avis — règles d'éligibilité

- **Réservé aux étudiants** (sinon : « Seuls les etudiants peuvent laisser un avis »).
- L'étudiant doit avoir une **consultation avec contacts révélés** (`contacts_affiches = true`) sur l'annonce.
- **1 seul avis par couple (étudiant, annonce)** (sinon : « Vous avez deja laisse un avis pour cette annonce »).
- **Note 1 à 5**, commentaire **max 2000 caractères**.
- **Sécurité** : l'identité de l'étudiant et la consultation sont **déduites côté serveur du JWT** — le client ne les envoie jamais (impossible d'usurper un autre étudiant).
- **Anonymat** : dans la liste publique des avis, le nom de l'étudiant est **masqué en initiale** (ex. « Sara B. »).
- Un endpoint d'éligibilité (`GET /api/avis/eligibilite/{annonceId}`) renvoie un **code** : `OK`, `DEJA_AVIS`, `CONTACTS_NON_AFFICHES`, `PAS_ETUDIANT`, `NON_AUTHENTIFIE`.

### 17.4 Visibilité & confidentialité

- Seules les annonces **`VALIDEE`** sont consultables publiquement au détail (une annonce non validée renvoie « Annonce introuvable »).
- Quand un étudiant connecté ouvre une annonce, une **Consultation** est enregistrée ; révéler les contacts passe `contacts_affiches` à `true` (c'est ce qui débloque l'avis).
- Le propriétaire ne voit **pas** l'identité des étudiants qui ont consulté son annonce.

### 17.5 Affichage du Trust Score (frontend)

Le score est **toujours affiché publiquement** sur les annonces, avec un code couleur. Le badge réutilisable (`ScoreBadge`, affiché sur les cartes/détails) montre `{score}% · libellé` :

| Score     | Couleur | Libellé du badge (`ScoreBadge`) | Variante cartes (AnnonceCard / Favoris) |
| --------- | ------- | ------------------------------- | --------------------------------------- |
| **≥ 70**  | Vert    | « Vérifié »                     | « Annonce sérieuse »                    |
| **40–69** | Ambre   | « En vérification »             | « À vérifier »                          |
| **< 40**  | Rouge   | « Risqué »                      | « Annonce risquée »                     |

> Quand l'admin valide une annonce de la file (40–69), c'est un **jugement humain** : le **statut** passe à `VALIDEE`, mais le **score ne change pas** (il reste celui calculé par l'IA).

### 17.6 Recherche d'annonces

La recherche existe sous **deux formes** dans le code :

**a) Recherche publique (page React, ancrée sur le campus)**

- L'étudiant choisit une **université** (+ un **rayon**, 5 km par défaut) → le backend renvoie les annonces **proches du campus** via PostGIS (`ST_Distance`, tri par distance possible).
- Filtres additionnels appliqués : **ville**, **budget max**, **surface min**, **type de logement**, **équipements** (tous requis), et seules les annonces **`VALIDEE`** sont affichées.
- Tri au choix : **distance**, **prix croissant/décroissant**, **score**.
- Résultats affichés en liste **et** sur une **carte interactive** (Leaflet + itinéraires OSRM).

**b) Recherche du chatbot (moteur backend `AnnonceSearchService`)**

- Utilisée par l'outil `search_annonces` d'UniBot. Filtres typés : ville, type de logement, **prix min/max**, surface min, charges incluses, **score de confiance min**, **équipements requis** et **équipements exclus**, rayon autour d'un campus.
- Toujours restreinte aux annonces **`VALIDEE` et non expirées** ; tri par **score décroissant** puis date ; **max 20 résultats**.

### 17.7 Modération & cycle de vie des comptes (admin)

- **Suspendre un compte** → le compte est désactivé **et toutes ses annonces actives passent en `SUSPENDUE`** (+ email au propriétaire). La **réactivation ne restaure pas** automatiquement les annonces (action manuelle).
- **Rejeter / suspendre une annonce** → email au propriétaire avec le **motif** éventuel.
- **Vérification CIN** → valider (`est_verifie_cin = true`) ou **demander une nouvelle photo** (email, repasse `est_verifie_cin = false`).
- **Signalements** → l'admin peut **traiter**, **rejeter** (non fondé) ou **suspendre l'annonce**. Rappel : **3 signalements ouverts ⇒ suspension automatique** (trigger SQL, sans intervention admin).

---

## 18. ⚠️ Idées reçues à corriger (à NE PAS présenter)

> Certaines notes internes plus anciennes décrivaient le projet différemment de ce qui a été **réellement** codé. Voici les points à corriger pour ne rien présenter de faux.

| Idée reçue (fausse)                                                                                 | Réalité dans le code                                                                                                                                  |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spring Boot 3 · PostgreSQL 16 · MinIO/S3 · Gemini 1.5                                               | **Spring Boot 4.0.5 · PostgreSQL 15 · Cloudinary · `gemini-flash-latest`**                                                                            |
| JWT 24 h, token gardé « en mémoire seule »                                                          | **JWT 1 h**, token stocké en **`localStorage`** côté front                                                                                            |
| Scoring = pipeline « 4 couches » (identité/texte/photos/prix)                                       | **5 critères pondérés** (justificatif 35 %, photos 20 %, prix 20 %, description 15 %, cohérence 10 %) jugés par **Gemini multimodal + règles Python** |
| Détection reverse-image / EXIF / z-score prix (médiane PostGIS)                                     | **Non implémenté** — analyse **qualitative** par Gemini                                                                                               |
| « CIN non vérifiée ⇒ annonce forcée en attente »                                                    | **Faux** : la décision dépend **uniquement du score**. Le statut CIN est transmis à l'IA comme contexte, sans forcer le statut                        |
| Description « min 50 caractères », équipements « aucun minimum », regex téléphone marocaine stricte | **Description sans minimum**, **≥ 1 équipement obligatoire**, **pas de regex téléphone stricte** (téléphone juste requis pour le propriétaire)        |
| Redis : sessions / cache de recherche / pub-sub                                                     | Redis = **historique du chatbot uniquement** (TTL ~1 h)                                                                                               |
| UniBot : RAG · pgvector · streaming · 3 langues FR/AR/EN                                            | **Tool-calling** (pas de RAG/embeddings/streaming), langues **FR + arabe + darija** (pas d'EN)                                                        |
| `phash` calculé à l'upload des photos                                                               | Colonne `phash` **présente mais non calculée** aujourd'hui                                                                                            |
| CI/CD complet (ESLint + pytest + build + push + déploiement)                                        | CI = **tests JUnit backend uniquement** sur GitHub Actions                                                                                            |

---

## 19. Glossaire

- **Annonce** : publication d'un logement à un instant T (titre, loyer, photos, score, contacts…). Temporaire (90 jours).
- **Logement** : le bien physique permanent (adresse, GPS, surface, type). Une annonce est rattachée à un logement.
- **Trust Score / `score_confiance`** : note 0–100 calculée par l'IA, qui décide le statut de l'annonce.
- **`detail_score`** : décomposition JSONB du score (description, prix, photos, justificatif, cohérence).
- **Justificatif** : document fourni par le propriétaire (facture eau/électricité ONEE/Redal/Amendis, acte…) — critère n°1 du scoring.
- **CIN** : Carte d'Identité Nationale du propriétaire (numéro + photo), vérifiée manuellement par l'admin (`est_verifie_cin`).
- **Consultation** : trace qu'un étudiant a ouvert une annonce ; `contacts_affiches = true` quand il a révélé les contacts (prérequis pour laisser un avis).
- **Signalement** : report d'une annonce suspecte par un étudiant ; **3 signalements ⇒ suspension automatique**.
- **UniBot** : assistant conversationnel Gemini intégré, qui interroge la base par **tool-calling**.
- **PostGIS** : extension géospatiale de PostgreSQL (type `GEOGRAPHY`, fonction `ST_Distance`) utilisée pour la recherche par campus.
- **OSRM** : service de calcul d'itinéraires utilisé par la carte (à pied / vélo / voiture).
- **Cloudinary** : service externe de stockage des images (photos, CIN, justificatifs).
- **`X-Internal-API-Key`** : clé partagée qui protège les endpoints internes appelés par le service IA.

---

_Document généré à partir d'un audit du code réel (backend Spring Boot, service IA FastAPI, frontend React, schéma PostgreSQL/PostGIS, docker-compose, CI). En cas de doute, la source de vérité reste le code._
