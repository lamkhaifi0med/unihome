# UniHome — Corrections de la présentation (slide par slide)

> Document de réponse à la présentation.
> Pour chaque slide : ce qui est **faux** et ce qu'il faut **écrire à la place** (ce que fait réellement le projet).
> Tout a été vérifié directement dans le code du projet.

---

## Rappel essentiel (à lire en premier)

Le projet UniHome **ne contient PAS** :

- Pas de **messagerie** (aucun chat, aucune messagerie temps réel).
- Pas de **réservation / booking** en ligne.
- Pas de **paiement** en ligne.
- Pas de **notifications temps réel**.

À la place, l'étudiant **contacte directement le propriétaire** grâce aux coordonnées affichées sur l'annonce (**téléphone / WhatsApp**). C'est un choix assumé du projet : la confiance vient du **Trust Score IA** + des **contacts transparents**, pas d'une messagerie interne.

---

## Slide 1 — Couverture

**À corriger :**

- Sous-titre « Réservation en ligne » → cette fonctionnalité n'existe pas.
- Sous-titre « Messagerie temps réel » → cette fonctionnalité n'existe pas.

**À écrire à la place (sous-titres corrects) :**

- Géolocalisation · Recherche par campus · Trust Scoring IA · Assistant UniBot · Contact direct vérifié

**Pensez aussi à** remplir l'encadrant, l'auteur et l'établissement (placeholders vides).

---

## Slide 2 — Mise en situation

**Rien à corriger.** La description du problème (offre dispersée, arnaques, recherche chronophage, communication fragmentée) est cohérente avec l'objectif du projet.

- Le chiffre « 1,1 million d'étudiants » est une donnée de contexte : à garder seulement si vous avez une source fiable.

---

## Slide 3 — Notre réponse

**À corriger (dans la liste des 6 fonctionnalités) :**

- « Réservation en ligne » → n'existe pas.
- « Messagerie sécurisée » → n'existe pas.

**Fonctionnalités réelles à mettre à la place :**

- Géolocalisation PostGIS (garder)
- Trust Scoring IA (garder)
- Assistant UniBot (garder)
- Dashboards multi-rôles (garder)
- **Contact direct vérifié (tél / WhatsApp)** → remplace « Messagerie »
- **Favoris, avis & signalements** → remplace « Réservation »

La phrase « sécurise la relation locataire ↔ propriétaire » reste vraie, mais grâce au **Trust Score + contacts transparents**, pas via une messagerie.

---

## Slide 4 — Avant / Après

**À corriger (2 lignes du tableau) :**

- Ligne « Communication fragmentée → Messagerie intégrée + notifications » : il n'y a ni messagerie ni notifications. À remplacer par : « Contact direct transparent (tél/WhatsApp) affiché sur une annonce vérifiée ».
- Ligne « Réservation incertaine → Module de booking avec statuts » : il n'y a pas de booking. À remplacer par : « Annonces vérifiées par IA → l'étudiant contacte un propriétaire de confiance » (ou supprimer la ligne).

**Lignes correctes (à garder) :** Offre dispersée → catalogue centralisé · Risque de fraude → Trust Scoring IA (Gemini) · Support manuel → UniBot.

- « Temps de recherche divisé par 5 » : chiffre non mesuré → à présenter comme estimation ou à retirer.

---

## Slide 5 — Vue système (architecture)

**À corriger :**

- API Core « … Booking · Messaging » → retirer **Booking** et **Messaging** (n'existent pas). Écrire plutôt : « Auth JWT · Annonces · Recherche géo · Trust Score · Favoris/Avis ».
- Stockage objet « MinIO / S3 » → faux. Le projet utilise **Cloudinary** (pour l'upload des photos et des justificatifs).
- Redis « Sessions · Rate limit · Pub-sub » → faux. Redis sert **uniquement à mémoriser l'historique de conversation du chatbot** (durée limitée).
- « Architecture micro-services » → il n'y a que 2 services applicatifs (Spring Boot + FastAPI). Dire plutôt « architecture multi-services conteneurisée ».

**Correct (à garder) :**

- Frontend React + Vite + Tailwind + Leaflet
- AI Service FastAPI + Gemini
- Base PostgreSQL + PostGIS

---

## Slide 6 & 7 — Modules fonctionnels (rôles)

**Ces deux slides sont identiques (doublon) → en supprimer une.**

**À corriger — rôle Étudiant :**

- « Réservation en ligne » → n'existe pas.
- « Messagerie sécurisée » → n'existe pas.
- « Comparaison » → pas implémentée.

Étudiant (réel) : recherche géolocalisée par campus + filtres · carte interactive Leaflet · favoris · **contact direct du propriétaire (tél/WhatsApp)** · assistant UniBot · avis & notation · signalement d'annonce.

**À corriger — rôle Propriétaire :**

- « Gestion des réservations » → n'existe pas.
- « Réponses aux candidatures » → n'existe pas.
- « Notifications temps réel » → n'existe pas.

Propriétaire (réel) : publication d'annonce guidée · upload photos + **justificatif** · affichage du **Trust Score** + message IA · gestion de ses annonces · suivi des consultations · CIN vérifiée par l'admin.

**Rôle Administrateur — correct (à garder) :** modération des annonces · vérification CIN des propriétaires · tableau de bord Trust Score · gestion des utilisateurs · traitement des signalements (**3 signalements = suspension automatique**) · audit.

---

## Slide 8 — Trust Scoring IA (cœur de l'innovation)

**Correct (à garder) :** moteur hybride règles + IA (Gemini), score de **0 à 100**, qui déclenche automatiquement publication / modération / rejet.

**À corriger — les critères annoncés sont en grande partie inexacts :**

- « Photos : reverse image, EXIF, redondance entre annonces » → non implémenté. L'IA juge la qualité et la cohérence des photos visuellement, sans reverse-image ni lecture EXIF.
- « Prix : Z-score vs médiane locale (1 km PostGIS) » → non implémenté. Le prix est jugé de façon qualitative par l'IA.
- « Réputation propriétaire » présentée comme critère principal → ce n'est pas un critère pondéré.

**Les VRAIS critères (avec leur poids exact) à mettre dans la slide :**

- **Justificatif** (facture ONEE/Redal/Amendis, acte) — **35 %** (le plus important)
- **Photos** — 20 %
- **Prix** — 20 %
- **Description** — 15 %
- **Cohérence globale** — 10 %

Le score produit aussi **3 messages séparés** (étudiant / propriétaire / admin) : un vrai plus à montrer.

---

## Slide 9 — Pipeline IA

**Correct :** la logique en étapes (soumission → analyse IA → score → décision automatique + alerte admin), et surtout les seuils de décision :

- Score ≥ 70 → publication automatique
- 40 à 69 → modération manuelle
- Score < 40 → rejet automatique

**À corriger :**

- Étape « Spring publie sur Redis → consommé par FastAPI » → faux. La communication entre Spring Boot et le service IA se fait en **HTTP/REST direct** (il n'y a pas de file Redis entre les deux).

---

## Slide 10 — Assistant UniBot

**Correct :** assistant conversationnel propulsé par **Google Gemini**, intégré au site, qui recommande de vraies annonces du catalogue.

**À corriger :**

- « RAG sur le catalogue » / « RAG · pgvector » → faux. UniBot interroge la base via des **appels d'outils (function calling)** vers le backend ; il n'y a ni RAG ni base vectorielle.
- « FastAPI streaming » → faux. La réponse est renvoyée en **JSON complet** (pas de streaming mot à mot).
- « 3 langues : FR · AR · EN » → l'anglais n'est pas prévu. Écrire **« Français + Arabe (standard et darija) »**.
- « Gemini 1.5 » → le modèle réel est **Gemini Flash (version « latest »)**, utilisé en offre gratuite.
- Cas d'usage « Aide à la réservation / paiement » → à retirer (pas de réservation ni de paiement).

---

## Slide 11 — Géolocalisation PostGIS

**Globalement correct (à garder) :** PostgreSQL + PostGIS, coordonnées stockées en type GEOGRAPHY, distance réelle calculée avec ST_Distance, recherche **ancrée sur l'université** de l'étudiant.

**À corriger :**

- « Réponse < 50 ms sur 10 000 annonces » → chiffre non mesuré (jeu de données de démo). À retirer ou présenter comme objectif.

À valoriser : la carte du site utilise **Leaflet** avec calcul d'itinéraires (à pied / vélo / voiture) et des marqueurs colorés selon le Trust Score.

---

## Slide 12 — CI / CD

**À corriger — la majorité du pipeline annoncé n'existe pas.** En réalité, l'intégration continue (GitHub Actions) fait **une seule chose** : lancer les **tests du backend (JUnit)** à chaque push.

- « ESLint » dans la CI → absent.
- « pytest » (service IA) dans la CI → absent.
- « Build images Docker » → absent.
- « Push registry (GHCR / Docker Hub) » → absent.
- « Déploiement SSH sur VPS » → absent.
- « 100 % pipeline CI/CD automatisé » → faux (il y a de la CI, mais pas de déploiement automatique).

**À corriger — la stack conteneurisée et les ports :**

- « unihome-web : nginx → React build, :80 → :3000 » → faux. Le frontend tourne avec le **serveur Vite sur le port 5173**.
- « unihome-api : Spring Boot 3, :8080 » → c'est **Spring Boot 4**, accessible de l'extérieur sur le **port 8095** (8080 reste interne).
- « postgres-postgis : Pg 16 » → c'est **PostgreSQL 15** (+ PostGIS).

**Correct (à garder) :** unihome-ai (FastAPI) :8000 · redis 7-alpine :6379 · **5 conteneurs Docker** au total.

Reformulation honnête : « CI : tests backend automatisés via GitHub Actions à chaque push. »

---

## Slide 13 — Démonstration

**Rien de faux** — ce sont des emplacements de captures d'écran.

- Remplacer les placeholders par de **vraies captures** : carte Leaflet, détail d'annonce + Trust Score, conversation UniBot, dashboard admin.

---

## Slide 14 — Bilan critique

**Excellente slide, honnête et exacte — à garder telle quelle** (pas de paiement, pas d'app mobile native, KYC partiellement manuel, villes pilotes).

---

## Slide 15 — Conclusion

**Correct :** 2 modules IA (Trust Score + UniBot) · 5 conteneurs Docker.

**À corriger :**

- « 100 % pipeline CI/CD automatisé » → faux (voir slide 12). Remplacer par « CI : tests backend automatisés ».
- « 15+ fonctionnalités » → accroche acceptable, mais s'appuyer sur les vraies fonctionnalités listées plus haut.

---

## En résumé — les 6 corrections les plus importantes

1. Retirer **messagerie** et **réservation / booking** partout → remplacer par **contact direct (tél / WhatsApp)**.
2. Corriger les technos : **Spring Boot 4** (pas 3), **PostgreSQL 15** (pas 16), **Cloudinary** (pas MinIO/S3), **Gemini Flash** (pas 1.5).
3. Trust Score : afficher les **5 vrais critères** (Justificatif 35 %, Photos 20 %, Prix 20 %, Description 15 %, Cohérence 10 %).
4. UniBot : **appels d'outils** (pas de RAG/pgvector), réponse **JSON** (pas de streaming), langues **Français + Arabe/Darija** (pas d'anglais).
5. CI/CD : **tests backend uniquement** (pas de build/déploiement, pas « 100 % automatisé »).
6. Frontend : **Vite, port 5173** (pas nginx :3000) ; API sur le **port 8095**.
