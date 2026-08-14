# UniHome — Source de Vérité pour la Présentation

> **But de ce document :** corriger le contenu du PPT (voir [ppt-content-extracted.md](ppt-content-extracted.md)) pour qu'il corresponde **exactement** à ce qui est réellement codé dans le projet.
> À donner tel quel à une IA pour régénérer une présentation avec les **vraies** informations.
>
> Toutes les affirmations ci-dessous ont été vérifiées dans le code réel : `docker-compose.yml`, `backend/pom.xml`, `ai-service/main.py` + `requirements.txt`, `frontend/package.json` + `src/`, `.github/workflows/ci.yml`, et le document de référence interne `backend/UniHome_Bible.md`.
>
> Légende : **[CORRECT]** = le PPT dit vrai · **[FAUX]** = à supprimer/corriger · **[À NUANCER]** = partiellement vrai.

---

## 0. Règle d'or (la plus importante)

Le document interne `UniHome_Bible.md` définit explicitement **« Ce que UniHome n'est PAS »**. Trois fonctionnalités mises en avant dans le PPT **n'existent pas dans le projet** :

- **[FAUX] Messagerie / Messagerie temps réel** → **Il n'y a AUCUN système de messagerie.** Les propriétaires affichent leurs **vrais contacts (téléphone / WhatsApp)** sur l'annonce. Pas de chat, pas de temps réel, pas de WebSocket.
- **[FAUX] Réservation en ligne / Module de booking** → **Il n'y a AUCun module de réservation.** L'étudiant **contacte** le propriétaire (mécanisme `Contact` + `Consultation`). Aucun engagement formel, aucun statut de réservation.
- **[FAUX] Paiement en ligne** → **Aucun paiement** ne transite par la plateforme (c'est déjà listé comme perspective future, donc cohérent — mais il ne faut pas le présenter comme livré).

Citation exacte du `UniHome_Bible.md` (section 1) :

> « All contact info is transparent — **no middleman, no chat system** — just real phone numbers and WhatsApp. […] Not a payment platform […] **Not a messaging system** […] Not a mobile app — web only (responsive). »

**→ Toute slide qui présente la messagerie ou la réservation comme une fonctionnalité livrée doit être réécrite.**

---

## 1. Pitch corrigé (slide de couverture)

- Sous-titres actuels du PPT : « Géolocalisation · Réservation en ligne · Messagerie temps réel · Trust Scoring IA · Assistant UniBot ».
- **Sous-titres corrigés :** « Géolocalisation PostGIS · Recherche par campus · Trust Scoring IA (Gemini) · Assistant UniBot · Contacts vérifiés ».
- Retirer « Réservation en ligne » et « Messagerie temps réel ».

---

## 2. Stack technique réelle (versions exactes)

| Élément         | Ce que dit le PPT                       | **Réalité dans le code**                                                                                                                                                       | Statut           |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| Frontend        | React + Vite · Tailwind · Leaflet       | **React 18 + Vite 5 · TailwindCSS 3 · React Router 6 · Axios · Leaflet 1.9.4 (chargé via CDN, pas en dépendance npm)**                                                         | [À NUANCER]      |
| API Core        | Spring Boot **3**                       | **Spring Boot 4.0.5 · Java 17**                                                                                                                                                | [FAUX] (version) |
| Service IA      | FastAPI + Gemini                        | **FastAPI · `google-generativeai` (Gemini) · httpx · tenacity · redis**                                                                                                        | [CORRECT]        |
| Base de données | PostgreSQL **16** + PostGIS             | **PostgreSQL 15 + PostGIS 3.3** (`postgis/postgis:15-3.3`)                                                                                                                     | [FAUX] (version) |
| Cache / file    | Redis (Sessions · Rate limit · Pub-sub) | **Redis 7-alpine — utilisé UNIQUEMENT par le service IA pour l'historique de conversation du chatbot** (TTL). Pas de sessions Spring, pas de rate-limit Redis, pas de pub/sub. | [FAUX]           |
| Stockage objet  | **MinIO / S3**                          | **Cloudinary** (dépendance `cloudinary-http44`, variables `CLOUDINARY_*`)                                                                                                      | [FAUX]           |
| Modèle Gemini   | **Gemini 1.5**                          | **`gemini-flash-latest`** par défaut (`gemini-flash-lite-latest` en local) — configurable. Même modèle pour le scoring ET UniBot. **Free tier.**                               | [FAUX]           |

> Note : le commentaire en haut de `ai-service/main.py` mentionne encore « Gemini 1.5 Flash », mais le **code réel** utilise `GEMINI_MODEL_NAME` qui vaut `gemini-flash-latest`. C'est probablement la source de l'erreur « 1.5 » dans le PPT.

### Authentification

- **JWT stateless** (bibliothèque `jjwt`), expiration 1h par défaut. Spring Security. Pas de sessions serveur.
- Communication interne Spring ↔ FastAPI sécurisée par une **clé partagée** (`X-Internal-API-Key`).

---

## 3. Architecture & conteneurs Docker (slides 5 et 12)

**Le chiffre « 5 conteneurs » est CORRECT**, mais leur composition et leurs ports sont à corriger.

| Conteneur réel       | Image / techno                    | Port (hôte → conteneur) | PPT disait                                       |
| -------------------- | --------------------------------- | ----------------------- | ------------------------------------------------ |
| `unihome-db`         | `postgis/postgis:15-3.3`          | 5432 → 5432             | « postgres-postgis Pg 16 » (version fausse)      |
| `unihome-redis`      | `redis:7-alpine`                  | 6379 → 6379             | OK                                               |
| `unihome-ai-service` | FastAPI (build local)             | 8000 → 8000             | « unihome-ai :8000 » OK                          |
| `unihome-api`        | Spring Boot 4 (build local)       | **8095 → 8080**         | « unihome-api :8080 » (8080 = interne seulement) |
| `unihome-frontend`   | **Vite dev server** (build local) | **5173 → 5173**         | **« unihome-web nginx :80 → :3000 » — FAUX**     |

Corrections clés :

- **[FAUX] « nginx → React build :80→:3000 »** : le frontend tourne avec le **serveur de dev Vite sur le port 5173** (avec hot-reload / bind-mount). Pas de nginx, pas de build statique servi, pas de port 3000.
- **[FAUX] L'API n'est pas exposée sur 8080 à l'extérieur** : 8080 est le port **interne** ; côté hôte c'est **8095** par défaut (`VITE_API_URL=http://localhost:8095`).
- L'architecture est **multi-conteneurs avec 2 services applicatifs** (Spring Boot + FastAPI), pas un vrai écosystème « micro-services ». Mieux vaut dire « architecture multi-services conteneurisée ».

### Communication entre services (corrige le slide 9, étape 2)

- **[FAUX] « Spring publie sur Redis → consommé par FastAPI »** : il n'y a **pas de Redis pub/sub** entre eux.
- **Réalité :** Spring Boot appelle le service IA **en HTTP/REST** (`PYTHON_SERVICE_URL=http://ai-service:8000`). En retour, le service IA appelle des **endpoints internes** de Spring (`/api/internal/chatbot/**`) en HTTP avec la clé `X-Internal-API-Key`. Tout est **synchrone HTTP**, pas une file de messages.

---

## 4. Trust Scoring IA — la réalité (slides 8 et 9)

C'est le vrai cœur d'innovation, et il est **bien réel**. Mais les détails techniques du PPT sont en partie inventés.

### Ce qui est CORRECT

- **[CORRECT]** Moteur **hybride règles + LLM (Gemini)**, score **0 à 100**.
- **[CORRECT]** Seuils de décision (identiques dans le code, prompt système de `main.py`) :
  - **Score ≥ 70 → publication automatique** (statut `VALIDEE`)
  - **40 ≤ Score < 70 → revue admin / modération** (statut `EN_ATTENTE`)
  - **Score < 40 → rejet automatique** (statut `REJETEE`)
- **[CORRECT]** Analyse **multimodale** : Gemini Vision reçoit jusqu'à **5 photos** échantillonnées + le justificatif.

### Les VRAIS critères (et leur pondération exacte)

Le PPT liste « Photos / Description / Prix vs marché / Réputation propriétaire ». **La réalité est différente** — il y a **5 sous-scores pondérés** :

| Critère réel                                                   | Poids    | Détail                                                                                    |
| -------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| **Justificatif** (document : facture ONEE/Redal/Amendis, acte) | **35 %** | **Critère le plus important — totalement absent du PPT.**                                 |
| **Photos**                                                     | 20 %     | Qualité, cohérence, watermark, image de banque, suspicion d'IA.                           |
| **Prix**                                                       | 20 %     | Plausibilité selon ville / type / surface / marché étudiant marocain.                     |
| **Description**                                                | 15 %     | Cohérence, langue, mots-clés à risque (western union, mandat cash, avance avant visite…). |
| **Cohérence**                                                  | 10 %     | Titre / description / prix / photos / justificatif racontent-ils la même histoire.        |

Formule réelle : `scoreGlobal = justificatif×0.35 + photos×0.20 + prix×0.20 + description×0.15 + coherence×0.10`.

### À CORRIGER dans le slide 8

- **[FAUX] « Détection reverse image, EXIF, redondance entre annonces »** : **non implémenté.** Gemini Vision fait une analyse **qualitative** des photos. Pas de reverse image search, pas de lecture EXIF, pas de comparaison inter-annonces.
- **[FAUX] « Z-score du prix vs médiane locale (rayon 1 km via PostGIS) »** : **non implémenté.** Le prix est évalué **qualitativement** par Gemini, pas par un calcul statistique géolocalisé.
- **[FAUX] « Réputation propriétaire » comme critère** : la note/ancienneté/vérif CIN du propriétaire sont **transmises comme contexte**, mais ne font **pas** partie des 5 critères pondérés. Le vrai critère central est le **justificatif**.
- **À ajouter :** le score produit aussi des **messages séparés par rôle** (étudiant / propriétaire / admin) + un raisonnement — c'est une vraie force à montrer.

---

## 5. UniBot — la réalité (slide 10)

### Ce qui est CORRECT

- **[CORRECT]** Assistant conversationnel propulsé par **Google Gemini**, intégré au frontend.
- **[CORRECT]** Recommande uniquement des annonces réelles du catalogue, mentionne ID / titre / prix / score + raisons.

### À CORRIGER

- **[FAUX] « RAG · pgvector »** : **il n'y a NI RAG, NI pgvector, NI embeddings.** UniBot utilise du **tool-calling (function calling) Gemini** : il appelle des endpoints internes en lecture seule du backend Spring (`/api/internal/chatbot/**`) pour interroger la base. Aucune recherche vectorielle.
- **[FAUX] « FastAPI streaming »** : la réponse est un **JSON complet** (`reply`, `suggestedListingIds`, `listingReasons`, `quickReplies`). **Pas de streaming**, pas de SSE.
- **[À NUANCER] « 3 langues FR · AR · EN »** : le prompt gère **français + arabe standard + darija marocaine**. **L'anglais (EN) n'est pas prévu.** Dire « FR · Arabe (standard + darija) ».
- **[FAUX] « Gemini 1.5 »** : voir section 2, c'est `gemini-flash-latest`.
- **[À NUANCER] « 24/7 »** : vrai au sens « service en ligne », mais c'est du marketing — à garder léger.

L'historique de conversation est stocké dans **Redis** (TTL ~1h, ~10 messages max) — _ça_, c'est le vrai usage de Redis dans le projet.

---

## 6. Géolocalisation PostGIS (slide 11) — globalement CORRECT

- **[CORRECT]** PostgreSQL + PostGIS, colonnes `coordonnees` de type **`GEOGRAPHY(Point, 4326)`** sur les tables `logements` et `universites`.
- **[CORRECT]** Calcul de distance réelle via **`ST_Distance`**, exposé par une **vue SQL `v_annonces_avec_distance`** (jointure annonces + logements + universités).
- **Particularité à valoriser :** la recherche est **ancrée sur les coordonnées réelles de l'université** de l'étudiant — on cherche **par campus**, pas seulement par ville. Distance utilisée jusque dans le **score de recommandation** (≤ 500 m = 30 pts, 5 km = 5 pts).
- **Carte interactive (frontend) :** **Leaflet 1.9.4** (chargé via CDN), avec **routage OSRM** (à pied / vélo / voiture), anneaux de distance 1/3/5 km, marqueur campus, et **marqueurs colorés selon le Trust Score** (≥70 vert, ≥40 violet, <40 rouge). C'est un vrai atout à montrer.
- **[À NUANCER] « < 50 ms sur 10 000 annonces »** : chiffre **non mesuré** (jeu de données de démo). À retirer ou présenter comme objectif, pas comme résultat.
- L'exemple SQL du slide (avec `ST_DWithin` et un point en dur) est **illustratif** et conceptuellement correct ; la vraie implémentation passe par la vue `v_annonces_avec_distance`.

---

## 7. CI/CD (slide 12) — largement surévalué

**[FAUX] La majorité du pipeline décrit n'existe pas.** Le fichier réel `.github/workflows/ci.yml` fait **une seule chose** :

- Déclencheur : push sur `main` + pull requests. **[CORRECT]**
- Démarre un service PostGIS, configure JDK 17, puis **lance les tests JUnit du backend** (`UnihomeApiApplicationTests`).

Ce qui est annoncé mais **n'existe PAS** :

- **[FAUX] ESLint** (frontend) dans la CI.
- **[FAUX] pytest** (service IA) dans la CI.
- **[FAUX] Build d'images Docker** dans la CI.
- **[FAUX] Push vers un registry** (GHCR / Docker Hub).
- **[FAUX] Déploiement SSH sur un VPS** (`docker compose pull/up`).

**[FAUX] « 100 % pipeline CI/CD automatisé »** : il y a de l'**intégration continue (tests backend)** mais **pas de déploiement continu (CD)**. À reformuler : « CI : tests backend automatisés sur GitHub Actions ».

---

## 8. Fonctionnalités réelles par rôle (remplace slides 6/7)

> Slides 6 et 7 du PPT sont des **doublons** — n'en garder qu'un.

**Étudiant :** recherche géolocalisée par campus + filtres · **carte interactive Leaflet** (avec itinéraires OSRM) · favoris · consultation des annonces (mécanisme `Consultation`) · **contact direct du propriétaire (téléphone / WhatsApp)** · assistant UniBot intégré · avis & notation · signalement d'annonce.

**Propriétaire :** publication d'annonce guidée · upload photos + **justificatif** (Cloudinary) · affichage du **Trust Score** + message IA dédié · gestion de ses annonces · suivi des consultations · vérification CIN (par l'admin).

**Administrateur :** modération des annonces (validation / rejet) · **vérification CIN** des propriétaires · tableau de bord Trust Score · gestion des utilisateurs · traitement des **signalements** (3 signalements = suspension auto) · audit.

**À retirer de ces slides :** « Réservation en ligne », « Messagerie sécurisée », « Réponses aux candidatures », « Notifications temps réel » (pas de système de notifications temps réel).

---

## 9. Modules IA — le bon cadrage (slide 15)

- **[CORRECT] 2 modules IA** : Trust Scoring + UniBot. C'est exact et c'est le vrai point fort.
- Les deux partagent **la même clé et le même modèle Gemini** (`gemini-flash-latest`), free tier.
- **[CORRECT] 5 conteneurs Docker** (le nombre est bon).
- **[À NUANCER] « 15+ fonctionnalités »** : ok comme accroche, mais à appuyer sur les **vraies** features (section 8).

---

## 10. Tableau récapitulatif des corrections

| #   | Affirmation du PPT                                  | Verdict         | Correction                                                                  |
| --- | --------------------------------------------------- | --------------- | --------------------------------------------------------------------------- |
| 1   | Messagerie / messagerie temps réel                  | **FAUX**        | Aucune messagerie. Contacts réels (tél/WhatsApp) affichés sur l'annonce.    |
| 2   | Réservation en ligne / module de booking            | **FAUX**        | Aucune réservation. Mécanisme de **contact** + consultation.                |
| 3   | Paiement (sous-entendu présent)                     | **FAUX**        | Aucun paiement (perspective future).                                        |
| 4   | Spring Boot 3                                       | **FAUX**        | Spring Boot **4.0.5** / Java 17.                                            |
| 5   | PostgreSQL 16                                       | **FAUX**        | PostgreSQL **15** + PostGIS 3.3.                                            |
| 6   | Stockage MinIO / S3                                 | **FAUX**        | **Cloudinary**.                                                             |
| 7   | Redis : sessions, rate-limit, pub/sub               | **FAUX**        | Redis = **historique chatbot** uniquement.                                  |
| 8   | Spring → Redis → FastAPI (async)                    | **FAUX**        | Spring ↔ FastAPI en **HTTP/REST** synchrone.                                |
| 9   | Gemini 1.5                                          | **FAUX**        | `gemini-flash-latest` (free tier), configurable.                            |
| 10  | UniBot : RAG · pgvector                             | **FAUX**        | **Tool-calling** Gemini vers endpoints internes. Pas de RAG.                |
| 11  | UniBot : FastAPI streaming                          | **FAUX**        | Réponse JSON complète, pas de streaming.                                    |
| 12  | UniBot : FR · AR · EN                               | **À NUANCER**   | FR + Arabe (standard + darija). Pas d'EN.                                   |
| 13  | Frontend : nginx :80→:3000                          | **FAUX**        | Vite dev server sur **5173**.                                               |
| 14  | API exposée sur :8080                               | **À NUANCER**   | 8080 = interne ; **8095** côté hôte.                                        |
| 15  | Trust Score : reverse image / EXIF / redondance     | **FAUX**        | Analyse visuelle qualitative par Gemini.                                    |
| 16  | Trust Score : Z-score prix / médiane 1 km PostGIS   | **FAUX**        | Évaluation prix qualitative par Gemini.                                     |
| 17  | Trust Score : critère « réputation propriétaire »   | **FAUX**        | Vrais critères : justificatif (35 %), photos, prix, description, cohérence. |
| 18  | Seuils 70 / 40 (publication / modération / rejet)   | **CORRECT**     | Identique au code.                                                          |
| 19  | Géolocalisation PostGIS (GEOGRAPHY, ST_Distance)    | **CORRECT**     | Via la vue `v_annonces_avec_distance`.                                      |
| 20  | Leaflet                                             | **CORRECT**     | Leaflet 1.9.4 (CDN) + routage OSRM.                                         |
| 21  | CI/CD : ESLint + pytest + build + push + deploy SSH | **FAUX**        | CI = tests JUnit backend uniquement.                                        |
| 22  | « < 50 ms sur 10 000 annonces »                     | **NON VÉRIFIÉ** | Jeu de démo ; retirer ou présenter comme objectif.                          |
| 23  | 5 conteneurs Docker                                 | **CORRECT**     | db, redis, ai-service, api, frontend.                                       |
| 24  | 2 modules IA (Trust Score + UniBot)                 | **CORRECT**     | Exact.                                                                      |

---

## 11. Anomalies de structure du deck (à corriger côté présentation)

- **Slides 6 et 7 sont identiques** (« Trois rôles, trois expériences ») → en supprimer un.
- **Numérotation des sections décalée** (la section « 05 » / page 06 semble sautée) → renuméroter proprement.
- Slides 3 et 13 contiennent des **placeholders de mockups** `[ MOCKUP ]` / `[ SCREENSHOT ]` → remplacer par de **vraies captures** (carte Leaflet, détail annonce + Trust Score, conversation UniBot, dashboard admin).
- Slide 1 : remplir encadrant / auteur / établissement.

---

## 12. Phrase de cadrage honnête (utile en intro ou conclusion)

> « UniHome centralise des annonces de logement étudiant **vérifiées par IA** (Trust Scoring Gemini, score 0–100), avec **recherche géolocalisée par campus (PostGIS)** et un **assistant UniBot**. La mise en relation se fait par **contact direct** (téléphone / WhatsApp) : la plateforme ne gère ni paiement, ni messagerie interne, ni réservation — ces points sont des **perspectives** assumées. »
