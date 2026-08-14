# UniHome — Contenu extrait du PPT (Unihome.pptx)

> Transcription fidèle du texte de chaque slide (le deck est composé d'images plein écran exportées depuis un outil de design).
> Objectif : servir de base pour comparer le contenu de la présentation avec ce qui existe réellement dans le projet.
>
> **Statut : Partie 1/2 — slides 1 à 8 extraites.** (slides 9 à 15 à venir)

---

## Slide 1 — Couverture

- Logo : **UniHome**
- Badge : _Projet de Fin d'Année · 2025–2026_
- Titre : **Plateforme intelligente de logement étudiant au Maroc.**
- Sous-titres :
  - Géolocalisation · Réservation en ligne · Messagerie temps réel
  - **Trust Scoring IA** · Assistant conversationnel **UniBot**
- Pied de page : SOUTENANCE ACADÉMIQUE · ENCADRANT · AUTEUR · ÉTABLISSEMENT _(placeholders à remplir)_

---

## Slide 2 — 01 · Mise en situation (02 / 15)

- Titre : **Trouver un logement étudiant au Maroc reste un parcours opaque.**
- 4 cartes :
  - **Offre dispersée** — Annonces éparpillées sur Facebook, WhatsApp, Avito — aucune source centralisée.
  - **Arnaques fréquentes** — Photos volées, faux propriétaires, paiements anticipés sans contrepartie.
  - **Recherche chronophage** — Pas de filtres pertinents (distance fac, budget, type) ni de carte interactive.
  - **Communication cassée** — Échanges étudiants ↔ propriétaires fragmentés sur plusieurs canaux non sécurisés.
- Bas de slide : → Près de **1,1 million** d'étudiants au Maroc et aucune plateforme dédiée, vérifiée et géolocalisée.

---

## Slide 3 — 02 · Notre réponse (03 / 15)

- Titre : **UniHome — une plateforme unique, vérifiée et assistée par IA.**
- Description : Une application web qui centralise l'offre, sécurise la relation locataire ↔ propriétaire et automatise la détection de fraude grâce à un moteur de scoring de confiance.
- 6 fonctionnalités listées :
  - Géolocalisation **PostGIS**
  - Réservation en ligne
  - Messagerie sécurisée
  - Trust Scoring IA
  - Assistant **UniBot**
  - Dashboards multi-rôles
- Visuel : `[ MOCKUP PRODUIT ]` — _Capture écran d'accueil — vue étudiant_ (placeholder, pas une vraie capture)

---

## Slide 4 — 03 · Avant / Après (04 / 15)

- Titre : **Ce que UniHome change concrètement.**
- Tableau (Problème | Solution UniHome | Bénéfice mesurable) :

| Problème                 | Solution UniHome                              | Bénéfice mesurable                    |
| ------------------------ | --------------------------------------------- | ------------------------------------- |
| Offre dispersée          | Catalogue centralisé + recherche géolocalisée | Temps de recherche divisé par 5       |
| Risque de fraude         | Trust Scoring IA (modèle **Gemini** + règles) | Détection auto des annonces suspectes |
| Communication fragmentée | Messagerie intégrée + notifications           | Historique unique & traçable          |
| Réservation incertaine   | Module de booking avec statuts                | Engagement formel des 2 parties       |
| Support manuel           | Chatbot **UniBot (Gemini)**                   | Réponses 24/7 instantanées            |

---

## Slide 5 — 04 · Vue système (05 / 15)

- Titre : **Architecture micro-services à 3 couches.**
- **CLIENT**
  - FRONTEND : **React + Vite** (SPA · Tailwind · Leaflet)
- **SERVICES**
  - API CORE : **Spring Boot** (Auth JWT · Listings · Booking · Messaging)
  - AI SERVICE : **FastAPI + Gemini** (Trust Score · UniBot · NLP)
  - CACHE / QUEUE : **Redis** (Sessions · Rate limit · Pub-sub)
- **DATA**
  - RDBMS GÉOSPATIAL : **PostgreSQL + PostGIS**
  - OBJECT STORAGE : **MinIO / S3**

---

## Slide 6 — 06 · Modules fonctionnels (07 / 15)

> ⚠️ **Note d'extraction :** ce slide est **identique au Slide 7** (même titre, même section « 06 », même numéro de page « 07/15 »). De plus, la section **« 05 » (page 06/15) semble manquante/sautée** entre la slide d'architecture (05/15) et celle-ci. À vérifier dans le deck.

- Titre : **Trois rôles, trois expériences.**
- **Rôle Étudiant :** Recherche géolocalisée & filtres · Carte interactive Leaflet · Favoris & comparaison · Réservation en ligne · Messagerie sécurisée · Assistant UniBot intégré · Avis & notation
- **Rôle Propriétaire :** Publication d'annonces guidée · Upload photos & documents · Affichage du Trust Score · Gestion des réservations · Réponses aux candidatures · Statistiques de vues · Notifications temps réel
- **Rôle Administrateur :** Modération des annonces · Vérification des propriétaires · Tableau de bord Trust Score · Gestion des utilisateurs · Traitement des signalements · Statistiques globales · Audit & logs

---

## Slide 7 — 06 · Modules fonctionnels (07 / 15)

> ⚠️ **Doublon apparent du Slide 6** (contenu identique : « Trois rôles, trois expériences »).

- Contenu identique au Slide 6 ci-dessus.

---

## Slide 8 — Cœur de l'innovation : Trust Scoring IA

- Badge : **CŒUR DE L'INNOVATION**
- Titre : **Trust Scoring IA — un score de confiance calculé sur chaque annonce.**
- Description : Un moteur hybride **règles + LLM (Gemini)** attribue une note de **0 à 100** aux annonces, déclenchant automatiquement validation, vérification manuelle ou rejet.
- Encadré Trust Score : **87 / 100** — échelle 0 (Suspect) → 50 → 100 (Vérifié) — _Annonce vérifiée & recommandée_
- **Critères analysés :**
  - **Photos** — Détection reverse image, EXIF, qualité, redondance entre annonces.
  - **Description (NLP)** — Gemini analyse cohérence, langue, longueur, sentiment, mots-clés à risque.
  - **Prix vs marché** — Z-score du prix vs médiane locale (rayon 1 km via PostGIS).
  - **Réputation propriétaire** — Ancienneté du compte, vérif. identité, historique d'annonces, avis.

---

## Slide 9 — 07 · Pipeline IA (09 / 15)

- Titre : **De la publication à la décision : 5 étapes.**
- Pipeline en 5 étapes :
  - **Étape 1 — Soumission** : Le propriétaire publie une annonce via Spring Boot.
  - **Étape 2 — Appel async** : Spring publie sur Redis → consommé par FastAPI.
  - **Étape 3 — Analyse Gemini** : NLP + vision + règles métier → features.
  - **Étape 4 — Calcul du score** : Score pondéré 0-100 + explication détaillée.
  - **Étape 5 — Décision auto** : Publié · à modérer · rejeté + alerte admin.
- **Règles de décision :**
  - Score ≥ 70 → **Publication automatique**
  - 40 ≤ Score < 70 → **Modération manuelle**
  - Score < 40 → **Rejet automatique**

---

## Slide 10 — 08 · Assistant IA (10 / 15)

- Titre : **UniBot, un assistant conversationnel au service de l'étudiant.**
- Description : Powered by **Google Gemini** + RAG sur le catalogue UniHome. Disponible **24/7** dans **3 langues (FR · AR · EN)**.
- **Cas d'usage :**
  - **Recherche guidée** — "Studio < 2000 DH proche FST Tanger ?"
  - **Aide à la réservation** — Étapes, documents requis, paiement.
  - **Conseils sécurité** — Reconnaître une arnaque, vérifier un bailleur.
  - **Informations contextuelles** — Quartiers, transports, coût de la vie.
- Tags techniques : **Gemini 1.5** · **RAG · pgvector** · **FastAPI streaming** · **Multi-langue**
- Exemple de conversation (mockup) :
  - UniBot : "Bonjour 👋 Je peux t'aider à trouver un logement. Quelle ville et quel budget ?"
  - Étudiant : "Studio à Rabat, max 2 500 DH, proche FSR."
  - UniBot : "J'ai trouvé **12 annonces** à moins d'**1,5 km** de la FSR. 3 ont un Trust Score ≥ 85. Je te les montre ?"

---

## Slide 11 — 09 · Géolocalisation (11 / 15)

- Titre : **PostgreSQL + PostGIS : la géolocalisation au niveau de la base.**
- Exemple de code SQL (`find_listings_nearby.sql`) — Trouver les logements dans un rayon de 2 km autour de la faculté, triés par distance :
  ```sql
  SELECT id, title, price,
         ST_Distance(
           location::geography,
           ST_MakePoint(-6.836, 33.971)::geography
         ) AS dist_m
  FROM   listings
  WHERE  trust_score >= 70
    AND  ST_DWithin(
           location::geography,
           ST_MakePoint(-6.836, 33.971)::geography,
           2000
         )
  ORDER BY dist_m ASC
  LIMIT 20;
  ```
- **Capacités natives :**
  - **Type GEOGRAPHY (lat/lng)** — Stockage natif, indexation GIST.
  - **Requêtes par rayon** — ST_DWithin · ST_Distance · ST_Intersects.
  - **Polygones & zones** — Quartiers, périmètres universitaires.
  - **Performance** — Réponse < 50 ms sur 10 000 annonces.

---

## Slide 12 — 10 · CI / CD (12 / 15)

- Titre : **Containerisation + intégration continue.**
- **Pipeline — GitHub Actions :**
  - **1. Push** — Commit sur main / feature → trigger workflow.
  - **2. Lint & Test** — ESLint, JUnit (Spring), pytest (FastAPI).
  - **3. Build Images** — Docker buildx multi-stage cache.
  - **4. Push Registry** — GHCR / Docker Hub tagué par version.
  - **5. Deploy** — SSH + docker compose pull/up sur VPS.
- **Stack conteneurisée — docker-compose :**
  - **unihome-web** — nginx → React build — `:80 → :3000`
  - **unihome-api** — Spring Boot 3 — `:8080`
  - **unihome-ai** — FastAPI · Gemini — `:8000`
  - **postgres-postgis** — Pg 16 + PostGIS — `:5432`
  - **redis** — Redis 7-alpine — `:6379`

---

## Slide 13 — 11 · Démonstration (13 / 15)

- Titre : **Aperçu de la plateforme livrée.**
- 3 emplacements de captures d'écran (placeholders, à remplacer par de vraies captures) :
  - **[ SCREENSHOT 01 ]** — Vue carte interactive + liste des annonces (étudiant)
  - **[ SCREENSHOT 02 ]** — Détail annonce + Trust Score
  - **[ SCREENSHOT 03 ]** — Conversation UniBot · dashboard admin

---

## Slide 14 — 12 · Bilan critique (14 / 15)

- Titre : **Honnêtes sur les limites, lucides sur la suite.**
- **Limites actuelles :**
  - Trust Score basé sur un dataset limité (à ré-entraîner en continu).
  - Pas encore d'intégration de paiement en ligne (CMI / Stripe).
  - Pas d'app mobile native (web responsive uniquement).
  - Vérification d'identité (KYC) partiellement manuelle.
  - Couverture géographique : villes universitaires pilotes.
- **Perspectives :**
  - Application mobile React Native.
  - Paiement intégré (CMI, virement, échéances).
  - Vérification KYC automatisée (OCR CIN + Liveness).
  - Modèle Trust Score ré-entraîné sur données réelles.
  - Partenariats universités & cités universitaires.

---

## Slide 15 — 13 · Pour conclure (15 / 15)

- Titre : **Une plateforme complète, pensée pour l'écosystème étudiant marocain.**
- Chiffres clés :
  - **15+** — Fonctionnalités livrées multi-rôles
  - **2** — Modules IA innovants (Trust Score & UniBot)
  - **5** — Conteneurs Docker orchestrés
  - **100%** — Pipeline CI/CD automatisé
- Clôture : **Merci pour votre attention.** · QUESTIONS & DISCUSSION

---

## Synthèse des points à vérifier (extraction complète — 15/15 slides)

> Ces points sont des **observations d'extraction**, pas encore confrontés au code réel. À valider lors de la comparaison avec le projet.

**Anomalies de structure du deck :**

- Slides 6 et 7 sont des **doublons** (« Trois rôles, trois expériences », tous deux numérotés section « 06 » / page « 07/15 »).
- La numérotation des sections est **décalée** : pas de section « 05 » visible (page 06/15 semble sautée), puis les sections 06→13 s'enchaînent.

**Affirmations techniques à confronter au code réel :**

- Redis (sessions, rate limit, **pub/sub** entre Spring et FastAPI).
- **RAG · pgvector** pour UniBot.
- **MinIO / S3** pour le stockage objet.
- **GitHub Actions** CI/CD + déploiement SSH sur VPS.
- Conteneurs et ports : unihome-web `:3000`, unihome-api `:8080`, unihome-ai `:8000`, postgres-postgis `:5432`, redis `:6379`.
- Versions annoncées : **Gemini 1.5**, **PostgreSQL 16 + PostGIS**, **Spring Boot 3**, **Redis 7-alpine**.
- Performances annoncées : géo-requêtes **< 50 ms sur 10 000 annonces**.
- UniBot **multilingue FR · AR · EN** et **24/7**.
- Placeholders à remplacer : mockups (slides 3 & 13) et infos de couverture (encadrant/auteur/établissement, slide 1).

---

_(Extraction terminée — 15/15 slides. Prochaine étape : comparer ce contenu au projet réel et fournir une « source de vérité » corrigée.)_
