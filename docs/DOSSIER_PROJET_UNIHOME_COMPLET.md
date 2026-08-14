# UniHome — Dossier de référence complet du projet

> **À quoi sert ce document.** C'est la **source de vérité unique** du projet UniHome, destinée à être donnée à une IA pour générer une présentation de soutenance fiable. Tout ce qui suit a été **vérifié directement dans le code source** (backend Java, service IA Python, frontend React, base PostgreSQL, Docker, CI), et non d'après d'anciens documents. Si une information contredit un ancien fichier, **c'est cette version qui fait foi**.
>
> **Langue :** français (pour une soutenance en français).

---

## 1. Identité du projet

- **Nom :** UniHome
- **Type :** Projet de Fin d'Année (2025–2026)
- **Pitch en une phrase :** Plateforme web de logement étudiant au Maroc qui centralise des annonces **vérifiées par IA**, avec **recherche géolocalisée par campus** et un **assistant conversationnel UniBot**.
- **Public cible :** étudiants marocains (18–25 ans) cherchant un logement proche de leur université, et propriétaires souhaitant louer à des étudiants.
- **Ce n'est pas :** une agence immobilière, une plateforme de paiement, une messagerie, ni une application mobile.

### Le problème traité

Aujourd'hui au Maroc, les étudiants trouvent un logement via WhatsApp, Facebook, le bouche-à-oreille ou en marchant près du campus. Conséquences : annonces avec photos volées, faux propriétaires, prix arbitraires, risque d'arnaque (acomptes versés avant visite), aucune source centralisée et vérifiée.

### La réponse UniHome

- Chaque annonce reçoit un **score de confiance (Trust Score) 0–100 calculé par IA** avant publication.
- L'identité du propriétaire est **vérifiée via sa CIN** (upload + validation manuelle par un admin).
- La recherche est **ancrée sur les coordonnées réelles des universités** (recherche par campus, pas seulement par ville).
- **Signalements communautaires** : 3 signalements ouverts suspendent automatiquement l'annonce.
- **Contacts transparents** : pas d'intermédiaire ni de chat ; le propriétaire affiche ses vrais contacts (téléphone / WhatsApp).

---

## 2. Les trois rôles (acteurs)

Le système définit exactement **3 rôles** (`role_enum` : `ETUDIANT`, `PROPRIETAIRE`, `ADMIN`).

### Étudiant (ETUDIANT)

- S'inscrit, confirme son email, renseigne son **université**, son **budget max** et sa **ville**.
- Recherche géolocalisée par campus + filtres ; **carte interactive Leaflet**.
- **Favoris** (ajout/retrait).
- Consulte le détail d'une annonce et **contacte directement le propriétaire** (téléphone / WhatsApp affichés).
- **Avis & notation** sur les annonces (avec règle d'éligibilité).
- **Signale** une annonce suspecte.
- Utilise l'assistant **UniBot**.
- Sur son tableau de bord : un bloc « Recommandations » = **les 3 annonces validées les plus proches de son université** (voir §7, nuance importante).

### Propriétaire (PROPRIETAIRE)

- S'inscrit avec **upload de la CIN obligatoire** (vérifiée ensuite par l'admin).
- Crée un **Logement** (coordonnées GPS, justificatif) puis publie une **Annonce** (photos, équipements).
- À la publication, l'**IA calcule automatiquement le Trust Score** et décide du statut.
- Voit le **Trust Score** + un **message IA dédié** (conseils d'amélioration).
- Gère ses annonces, suit les **consultations**.

### Administrateur (ADMIN)

- **Modère** les annonces (file d'attente, validation / rejet manuels).
- **Vérifie les CIN** des propriétaires (valider / demander un nouveau document).
- Gère les **utilisateurs** (suspendre / réactiver).
- Traite les **signalements** (traiter / rejeter / suspendre l'annonce).
- Tableau de bord avec **statistiques** globales.
- ⚠️ Il n'existe **pas** de page d'inscription admin (par conception).

---

## 3. Architecture technique (réelle)

Architecture **multi-services conteneurisée** (à ne pas survendre comme « micro-services » : il y a 2 services applicatifs).

```
┌────────────────────────────────────────────────────────────┐
│  CLIENT                                                     │
│   Frontend React + Vite (SPA, Tailwind, Leaflet via CDN)   │
└───────────────┬────────────────────────────────────────────┘
                │ HTTP/REST (Axios, JWT)
┌───────────────▼────────────────────────────────────────────┐
│  SERVICE 1 — API CORE : Spring Boot (Java 17)              │
│   Auth JWT · Annonces · Recherche géo · Trust · Favoris    │
│   Avis · Signalements · Admin · Orchestration chatbot      │
└───────┬──────────────────────────────┬─────────────────────┘
        │ HTTP/REST (WebClient)        │ JDBC
        │  ⇅ clé X-Internal-API-Key    │
┌───────▼───────────────────────┐  ┌───▼─────────────────────┐
│  SERVICE 2 — AI : FastAPI     │  │  PostgreSQL 15 + PostGIS │
│   Trust Scoring (Gemini)      │  │  (géographie, triggers)  │
│   UniBot (Gemini tool-calling)│  └─────────────────────────┘
│   Historique chat → Redis     │
└───────────────┬───────────────┘
                │
        ┌───────▼───────┐     ┌──────────────────────────────┐
        │ Redis 7-alpine│     │ Cloudinary (photos + CIN +   │
        │ (hist. chat)  │     │ justificatifs) — externe     │
        └───────────────┘     └──────────────────────────────┘
```

**Communication clé :** Spring Boot ↔ FastAPI se fait **en HTTP/REST synchrone** (pas de file de messages). Spring appelle le service IA (`/analyze-listing` pour le scoring, `/chat` pour UniBot) ; le service IA rappelle des **endpoints internes** de Spring (`/api/internal/chatbot/**`) protégés par une **clé partagée** (`X-Internal-API-Key`).

### Les 5 conteneurs Docker (docker-compose)

| Conteneur            | Image / techno                | Port hôte → conteneur | Rôle                                    |
| -------------------- | ----------------------------- | --------------------- | --------------------------------------- |
| `unihome-db`         | `postgis/postgis:15-3.3`      | 5432 → 5432           | PostgreSQL 15 + PostGIS 3.3             |
| `unihome-redis`      | `redis:7-alpine`              | 6379 → 6379           | Historique de conversation UniBot (TTL) |
| `unihome-ai-service` | FastAPI (build local)         | 8000 → 8000           | Trust Scoring + UniBot (Gemini)         |
| `unihome-api`        | Spring Boot (build local)     | **8095 → 8080**       | API métier                              |
| `unihome-frontend`   | Vite dev server (build local) | 5173 → 5173           | Interface React                         |

> Le frontend tourne avec le **serveur de développement Vite** (port 5173), pas avec nginx. L'API est accessible de l'extérieur sur **8095** (8080 est le port interne du conteneur).

---

## 4. Stack technique — versions exactes (vérifiées)

| Couche                | Technologie réelle                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**          | React **18**, Vite **5**, **TailwindCSS 3**, React Router **6**, Axios, react-hook-form, lucide-react. Carte : **Leaflet 1.9.4 chargé via CDN** (pas en dépendance npm) + routage **OSRM**.                                    |
| **Backend**           | **Spring Boot 4.0.5**, **Java 17**, Spring Web MVC + WebFlux (WebClient), Spring Security, Spring Data JPA / Hibernate, **Hibernate Spatial**, Lombok, **jjwt 0.11.5** (JWT), **Cloudinary** (cloudinary-http44), Spring Mail. |
| **Service IA**        | **FastAPI**, **Uvicorn**, **google-generativeai** (Gemini), **httpx** (async), **tenacity** (retry), **redis** (async), python-dotenv, pydantic.                                                                               |
| **Base de données**   | **PostgreSQL 15 + PostGIS 3.3** ; extensions `postgis`, `pgcrypto`, `unaccent`.                                                                                                                                                |
| **Cache**             | **Redis 7-alpine** — uniquement l'historique des conversations UniBot.                                                                                                                                                         |
| **Stockage fichiers** | **Cloudinary** (photos d'annonces, CIN, justificatifs).                                                                                                                                                                        |
| **Modèle IA**         | **Gemini Flash** (`gemini-flash-latest` par défaut, `gemini-flash-lite-latest` en local). **Offre gratuite (free tier).** Même modèle pour le Trust Scoring et UniBot.                                                         |
| **Conteneurisation**  | Docker + Docker Compose (5 services).                                                                                                                                                                                          |
| **CI**                | GitHub Actions — **tests JUnit du backend uniquement** (voir §11).                                                                                                                                                             |

---

## 5. Base de données (PostgreSQL + PostGIS)

### Tables principales (entités JPA réelles)

- `utilisateurs` (base commune) + spécialisations `etudiants`, `proprietaires`, `admins`.
- `universites` — avec **coordonnées GPS** `GEOGRAPHY(Point, 4326)`.
- `logements` — bien physique : adresse, ville, surface, **coordonnées GPS** `GEOGRAPHY(Point, 4326)`, justificatif, statut.
- `annonces` — publication liée à un logement : titre, description, loyer, charges, **score_confiance**, **detail_score** (JSON), statut, nb_signalements, raison_statut.
- `photos` — photos d'une annonce (**max 10**, imposé par trigger).
- `equipements` + `annonce_equipements` (table d'association).
- `favoris` (étudiant ↔ annonce).
- `avis` — note + commentaire.
- `signalements` — fraude signalée.
- `consultations` — suivi des vues d'annonces.
- `contacts_annonce` — coordonnées de contact (téléphone, WhatsApp, email, etc.).
- `confirmation_tokens` — confirmation email / reset mot de passe.
- `recommandations` — **table présente mais non exposée par une API** (voir §7).
- Vue **`v_annonces_avec_distance`** — joint annonces + logements + universités et calcule `ST_Distance` (cœur de la recherche géo).

### Énumérations (types PostgreSQL)

- `role_enum` : ETUDIANT, PROPRIETAIRE, ADMIN
- `statut_annonce_enum` : EN_ATTENTE, VALIDEE, REJETEE, SUSPENDUE, ARCHIVEE
- `statut_logement_enum` : DISPONIBLE, OCCUPE, ARCHIVE
- `statut_signalement_enum` : OUVERT, TRAITE, REJETE
- `type_contact_enum` : TELEPHONE, WHATSAPP, EMAIL, FACEBOOK, INSTAGRAM
- `type_logement_enum` : STUDIO, CHAMBRE, COLOCATION, APPARTEMENT

### Logique en base (triggers PL/pgSQL réels)

- **`auto_suspend_annonce`** : dès qu'une annonce atteint **3 signalements OUVERT**, elle passe en **SUSPENDUE** ; met aussi à jour le compteur `nb_signalements`.
- **`check_photos_count`** : interdit plus de **10 photos** par annonce.
- **`recalcule_note_proprietaire`** : recalcule automatiquement la note moyenne du propriétaire à chaque ajout/suppression d'avis.

> Point fort à valoriser : une partie de la logique métier (sécurité anti-fraude, intégrité) est **dans la base**, donc robuste quel que soit le service appelant.

---

## 6. Cœur de l'innovation n°1 — Le Trust Scoring IA

Moteur **hybride règles + LLM (Gemini)** qui attribue un **score 0–100** à chaque annonce et décide automatiquement de son statut.

### Les 5 critères réels et leur pondération exacte

| Critère               | Poids    | Ce que l'IA évalue                                                                                                                 |
| --------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Justificatif**      | **35 %** | Document marocain (facture ONEE / Redal / Amendis, acte) : nom et adresse cohérents avec l'annonce. **Critère le plus important.** |
| **Photos**            | 20 %     | Qualité, cohérence, watermark, banque d'images, suspicion d'image générée par IA.                                                  |
| **Prix**              | 20 %     | Plausibilité selon ville / type / surface / marché étudiant marocain.                                                              |
| **Description**       | 15 %     | Cohérence, langue, mots-clés à risque (western union, mandat cash, acompte avant visite…).                                         |
| **Cohérence globale** | 10 %     | Titre, description, prix, photos et justificatif racontent-ils la même histoire.                                                   |

**Formule :** `score = justificatif×0.35 + photos×0.20 + prix×0.20 + description×0.15 + cohérence×0.10`

### Analyse multimodale

Le service IA télécharge en parallèle jusqu'à **5 photos échantillonnées** (début/milieu/fin) **+ le justificatif**, puis les envoie à **Gemini Vision** avec le contexte de l'annonce. Réponse imposée en **JSON strict** (température basse 0.1).

### Décision automatique (seuils — identiques côté Python et côté Java)

| Score       | Statut       | Effet                           |
| ----------- | ------------ | ------------------------------- |
| **≥ 70**    | `VALIDEE`    | Publication automatique         |
| **40 – 69** | `EN_ATTENTE` | Modération manuelle par l'admin |
| **< 40**    | `REJETEE`    | Rejet automatique               |

**Sécurités réelles du flux :** si l'IA est indisponible **ou** si la réponse ne contient pas les 3 messages de rôle, l'annonce passe en `EN_ATTENTE` (validation manuelle) — jamais publiée à l'aveugle.

### Sortie enrichie (vrai plus à montrer)

Le scoring renvoie, en plus du score : le **détail par critère**, un **raisonnement** pour l'admin, et **3 messages séparés par rôle** (étudiant / propriétaire / admin). Le message étudiant est rassurant et non technique ; le message propriétaire est actionnable ; le message admin est détaillé (preuves, risques, décision).

### Ce que le Trust Scoring ne fait PAS (à ne pas affirmer)

- Pas de **reverse image search**, pas de lecture **EXIF**, pas de comparaison entre annonces.
- Pas de **Z-score** statistique du prix : l'évaluation du prix est **qualitative** par l'IA.

---

## 7. Géolocalisation & « recommandations »

### Géolocalisation (PostGIS) — réelle et solide

- Les tables `logements` et `universites` stockent des **coordonnées `GEOGRAPHY(Point, 4326)`**.
- La distance réelle (en mètres) est calculée avec **`ST_Distance`** via la vue **`v_annonces_avec_distance`**.
- **Recherche par campus** : l'étudiant cherche autour des **coordonnées réelles de son université** dans un rayon (ex. 5 km), résultats triés par distance — endpoint `GET /api/annonces/recherche/campus`.
- **Carte interactive (frontend, `SearchMap.jsx`)** : Leaflet + **itinéraires OSRM** (à pied / vélo / voiture), anneaux de distance **1 / 3 / 5 km**, marqueur campus, et **marqueurs colorés selon le Trust Score** (≥ 70 vert, ≥ 40 violet, < 40 rouge).

### « Recommandations » — nuance importante (à présenter honnêtement)

Le tableau de bord étudiant et la page d'accueil affichent un bloc **« Recommandations IA »**. En réalité, ce bloc appelle la **recherche par campus** et affiche les **3 annonces validées les plus proches de l'université** de l'étudiant.

- ✅ À dire : « recommandations basées sur la **proximité campus** + annonces validées ».
- ❌ À ne pas dire : « moteur de recommandation personnalisé / machine learning ». La table `recommandations` (et son entité/trigger) existe mais **aucune API ne l'expose** — c'est une **perspective**, pas une fonctionnalité livrée.

---

## 8. Cœur de l'innovation n°2 — L'assistant UniBot

Assistant conversationnel propulsé par **Google Gemini**, intégré au site (page `/chatbot` + widget).

### Comment il fonctionne réellement

- **Orchestration :** le backend Spring (`ChatbotService`) prépare une charge utile « légère » et la transmet au service IA (`POST /chat`, via WebClient, timeout 60 s).
- **Tool-calling (function calling) :** Gemini interroge la base **en appelant des outils** qui pointent vers les **endpoints internes** de Spring (`/api/internal/chatbot/search`, `/annonces/{id}`, `/owner/{id}/annonces`). **Il n'y a ni RAG, ni base vectorielle, ni pgvector, ni embeddings.**
- **Réponse :** un **JSON complet** (`reply`, `suggestedListingIds`, `listingReasons`, `quickReplies`) — **pas de streaming**.
- **Ré-ancrage des résultats :** Spring reprend les IDs suggérés par Gemini et **recharge les annonces fraîches** depuis la base pour afficher des cartes à jour (titre, score, photos).
- **Robustesse :** si le service IA est injoignable, Spring renvoie une **réponse de repli** + des suggestions rapides par défaut.

### Règles & sécurité du chatbot

- Recommande **uniquement de vraies annonces** du contexte (jamais d'annonce inventée).
- **Ne révèle jamais** les contacts (sauf autorisation explicite — `canRevealContacts=false` par défaut), ni les données privées (CIN, justificatifs, notes admin).
- Les annonces privées d'un propriétaire servent seulement à expliquer **son** statut, jamais comme résultat public.
- Le score de confiance est rappelé comme **non garantie légale** ; conseille toujours de **visiter avant de payer**.

### Langues (réel)

- **Français + Arabe standard + Darija marocaine.** (L'anglais n'est **pas** prévu.)

### Historique

- Conservé dans **Redis** (durée limitée, ~1 h, nombre de messages plafonné).

---

## 9. Sécurité (vérifiée)

- **Authentification JWT stateless** (bibliothèque jjwt) ; pas de session serveur. Expiration ~1 h.
- **Mots de passe hachés en BCrypt**.
- **Confirmation d'email** obligatoire (tokens), + **mot de passe oublié / réinitialisation**.
- **Autorisation par rôle** (Spring Security `@EnableMethodSecurity`) : routes étudiant / propriétaire / admin protégées (`PrivateRoute` côté frontend également).
- **Endpoints publics** (lecture seule) : consultation des annonces, avis d'une annonce, universités, équipements, et `POST /api/chatbot`.
- **Endpoints internes** (`/api/internal/**`) protégés par un **filtre à clé partagée** `X-Internal-API-Key` (le démarrage **échoue** si la clé fait moins de 32 caractères — sécurité « fail-fast »).
- **CORS** restreint à l'origine du frontend (`http://localhost:5173`).
- **Anti-fraude communautaire** : 3 signalements ⇒ suspension automatique (trigger DB).

---

## 10. Cartographie des endpoints API (réelle)

**Auth** (`/api/auth`, public) : `POST /register` (JSON et multipart pour la CIN), `POST /login`, `GET /confirm`, `POST /resend-confirmation`, `POST /forgot-password`, `POST /reset-password`.

**Utilisateur** (`/api/users`) : `GET /me`, `PUT /me`, `GET /me/stats`, `POST /me/cin`.

**Annonces** (`/api/annonces`) : `POST /publier` (multipart, déclenche le scoring IA), `GET /{id}`, `GET /proprietaire/{id}`, `GET /recherche`, `GET /recherche/campus`, `POST /{annonceId}/signaler`.

**Logements** (`/api/logements`) : `POST` (multipart, avec justificatif).

**Favoris** (`/api/favoris`) : `GET /me`, `POST /{annonceId}`, `DELETE /{annonceId}`.

**Avis** (`/api/avis`) : `GET /annonce/{annonceId}` (public), `GET /eligibilite/{annonceId}`, `POST` (créer un avis).

**Référentiels** : `GET /api/universites`, `GET /api/equipements`.

**Chatbot** : `POST /api/chatbot` (public) ; internes : `POST /api/internal/chatbot/search`, `GET /api/internal/chatbot/annonces/{id}`, `GET /api/internal/chatbot/owner/{id}/annonces`.

**Admin annonces / signalements** (`/api/admin`) : `GET /stats`, `GET /annonces/queue`, `POST /annonces/{id}/valider`, `POST /annonces/{id}/rejeter`, `GET /signalements`, `POST /signalements/{id}/traiter`, `POST /signalements/{id}/rejeter`, `POST /signalements/{id}/suspendre-annonce`.

**Admin utilisateurs** (`/api/admin/users`) : `GET`, `POST /{id}/suspendre`, `POST /{id}/reactiver`, `POST /{id}/valider-cin`, `POST /{id}/demander-nouveau-cin`.

### Pages frontend (réelles)

- **Public :** Accueil, Login, Register, Liste des annonces, Détail annonce, Recherche (carte), Chatbot, Confirmation email, Score rejeté, Mot de passe oublié/réinitialisation.
- **Étudiant :** Dashboard, Favoris, Profil.
- **Propriétaire :** Dashboard, Publier une annonce, Mes annonces, Profil.
- **Admin :** Dashboard, Modération, Signalements, Utilisateurs.

---

## 11. Ce qui N'EXISTE PAS (à ne jamais présenter comme livré)

Pour rester crédible en soutenance, **ne pas affirmer** :

- ❌ **Messagerie / chat temps réel** entre étudiant et propriétaire → remplacé par **contact direct (tél/WhatsApp)**.
- ❌ **Réservation / booking en ligne** avec statuts.
- ❌ **Paiement en ligne** (CMI, Stripe…).
- ❌ **Notifications temps réel**, WebSockets.
- ❌ **Moteur de recommandation personnalisé / ML** (le bloc « recommandations » = 3 plus proches validées).
- ❌ **RAG / pgvector / embeddings** pour UniBot (c'est du **tool-calling**).
- ❌ **Streaming** des réponses du chatbot.
- ❌ **Stockage MinIO / S3** (c'est **Cloudinary**).
- ❌ **Pipeline CI/CD complet avec déploiement** : la CI (GitHub Actions) exécute **seulement les tests JUnit du backend** (sur push `main` + pull requests). Pas d'ESLint, pas de pytest, pas de build/push d'images, pas de déploiement SSH automatique.
- ❌ **Anglais** dans UniBot (FR + arabe/darija uniquement).

---

## 12. Limites assumées & perspectives (slide « bilan critique »)

**Limites actuelles (honnêtes) :**

- Trust Score = **jugement d'un LLM (Gemini)** : il dépend de la qualité des informations fournies (justificatif, photos, description), peut se tromper, et **n'est pas validé contre un référentiel de fraude réel**. (⚠️ Ce n'est **pas** un modèle entraîné sur un dataset — donc ne pas parler de « ré-entraînement ».)
- Vérification d'identité (CIN) **partiellement manuelle** (admin).
- Pas de paiement ni de réservation intégrés.
- Pas d'application mobile native (web responsive uniquement).
- Couverture géographique : villes universitaires pilotes.
- Recommandations personnalisées **non encore exposées** (table présente).

**Perspectives :**

- Recommandations IA personnalisées (exploiter la table `recommandations`).
- Paiement / réservation (CMI, virement).
- Vérification CIN automatisée (OCR + liveness).
- Application mobile.
- Pipeline CI/CD complet avec déploiement automatique.
- Partenariats universités & cités universitaires.

---

## 13. Chiffres clés réels (pour la conclusion)

- **2** modules IA : Trust Scoring + UniBot.
- **5** conteneurs Docker orchestrés.
- **3** rôles utilisateurs (étudiant / propriétaire / admin).
- **5** critères pondérés du Trust Score (35/20/20/15/10).
- **0–100** : échelle du score, seuils de décision **70 / 40**.
- **3** signalements ⇒ suspension automatique.
- **Free tier** Gemini (coût IA nul).

> ⚠️ Éviter les chiffres non mesurés (ex. « < 50 ms sur 10 000 annonces », « temps divisé par 5 ») sauf si vous les mesurez réellement. Les présenter comme objectifs au besoin.

---

## 14. Plan de présentation proposé (soutenance)

1. **Couverture** — UniHome, PFA 2025–2026, sous-titres : Géolocalisation · Trust Scoring IA · UniBot · Contacts vérifiés. (Remplir encadrant/auteur/établissement.)
2. **Mise en situation** — le problème du logement étudiant au Maroc (offre dispersée, arnaques, recherche difficile).
3. **Notre réponse** — UniHome : centralisation + vérification IA + géolocalisation + contact direct.
4. **Avant / Après** — tableau problème → solution (sans messagerie ni booking).
5. **Architecture système** — 3 couches, 5 conteneurs, communication HTTP, versions exactes.
6. **Trois rôles, trois expériences** — étudiant / propriétaire / admin (une seule slide, pas de doublon).
7. **Trust Scoring IA (cœur 1)** — 5 critères pondérés, analyse multimodale, seuils 70/40, messages par rôle.
8. **Pipeline de publication** — soumission → analyse Gemini (HTTP) → score → décision auto + garde-fous.
9. **UniBot (cœur 2)** — tool-calling vers endpoints internes, JSON, FR/arabe/darija, garde-fous sécurité.
10. **Géolocalisation PostGIS** — GEOGRAPHY + ST_Distance + vue + carte Leaflet/OSRM + marqueurs par score.
11. **Sécurité** — JWT/BCrypt, confirmation email, rôles, clé interne fail-fast, triggers anti-fraude.
12. **Conteneurisation & CI** — docker-compose (5 services), CI = tests backend automatisés.
13. **Démonstration** — captures réelles : carte + liste, détail + Trust Score, conversation UniBot, dashboard admin.
14. **Bilan critique** — limites assumées + perspectives.
15. **Conclusion** — chiffres clés, 2 modules IA, remerciements.

### Scénario de démo conseillé

1. Un propriétaire publie une annonce avec photos + justificatif → l'IA calcule le score en direct et décide du statut.
2. Un étudiant cherche par campus → carte Leaflet avec itinéraires et marqueurs colorés par score.
3. L'étudiant ouvre une annonce → Trust Score + message IA + contact (tél/WhatsApp).
4. L'étudiant discute avec UniBot (« studio proche FSR < 2500 DH ») → suggestions d'annonces réelles.
5. Un admin modère la file d'attente, vérifie une CIN, traite un signalement.

---

## 15. Formulation de cadrage honnête (intro/conclusion)

> « UniHome centralise des annonces de logement étudiant **vérifiées par une IA** (Trust Scoring Gemini, score 0–100 avec décision automatique aux seuils 70/40), propose une **recherche géolocalisée par campus** (PostgreSQL/PostGIS + carte Leaflet) et un **assistant UniBot** qui interroge le catalogue par appels d'outils. La mise en relation se fait par **contact direct vérifié** (téléphone / WhatsApp) : la plateforme ne gère ni paiement, ni messagerie interne, ni réservation — ce sont des **perspectives assumées**. »
