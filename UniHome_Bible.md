# UniHome — Project Bible
## The Complete Guide to Everything · A to Z

> This document is the authoritative reference for the UniHome platform.
> Every business rule, every workflow, every constraint, every edge case.
> If something is not in this document, it does not exist in the platform.
> Written for developers, designers, and anyone joining the project mid-way.

---

## Table of Contents

1. [What is UniHome](#1-what-is-unihome)
2. [The Three Actors](#2-the-three-actors)
3. [Registration & Identity Verification](#3-registration--identity-verification)
4. [Authentication & Sessions](#4-authentication--sessions)
5. [Logement vs Annonce — The Core Distinction](#5-logement-vs-annonce--the-core-distinction)
6. [Publishing a Listing — Full Workflow](#6-publishing-a-listing--full-workflow)
7. [The AI Fraud Detection Pipeline](#7-the-ai-fraud-detection-pipeline)
8. [The Confidence Score — Rules & Display](#8-the-confidence-score--rules--display)
9. [Search & Discovery](#9-search--discovery)
10. [AI Recommendations](#10-ai-recommendations)
11. [Consultation — The Gate Mechanism](#11-consultation--the-gate-mechanism)
12. [Contacts — How Students Reach Owners](#12-contacts--how-students-reach-owners)
13. [Favorites](#13-favorites)
14. [Reviews — Avis](#14-reviews--avis)
15. [Fraud Reports — Signalements](#15-fraud-reports--signalements)
16. [Admin — Moderation & Management](#16-admin--moderation--management)
17. [The Chatbot](#17-the-chatbot)
18. [Account Lifecycle](#18-account-lifecycle)
19. [Listing Lifecycle](#19-listing-lifecycle)
20. [Database — What Lives Where](#20-database--what-lives-where)
21. [What the Platform Does NOT Do](#21-what-the-platform-does-not-do)
22. [Edge Cases & Special Scenarios](#22-edge-cases--special-scenarios)
23. [Glossary](#23-glossary)

---

## 1. What is UniHome

UniHome is a web platform dedicated to student housing in Morocco. It connects:
- **Students** who need a place to live near their university
- **Property owners** who want to rent their property to students

It is **not** a general real estate platform. It is specifically designed for the Moroccan student market — budget constraints, proximity to campus, shared apartments, furnished rooms.

### The core problem

Today in Morocco, students find housing through:
- WhatsApp group chats shared by senior students
- Facebook Marketplace and unverified groups
- Word of mouth
- Walking the streets near campus

This is dangerous because:
- Fake listings with stolen photos are rampant
- There is no way to verify if a landlord is real
- Prices are arbitrary with no reference
- Students can be scammed out of deposit money before even seeing the apartment

### What UniHome adds

- **Every listing is scored by AI** before it goes public — a 0–100 confidence score based on 4 layers of analysis
- **Owner identity is verified** — CIN (Carte d'Identité Nationale) is uploaded and manually reviewed by admin
- **Geographic search** anchored to real university coordinates — students search by campus, not just city
- **Community reporting** — 3 reports auto-suspend a listing immediately
- **All contact info is transparent** — no middleman, no chat system — just real phone numbers and WhatsApp

### What UniHome is NOT

- Not a payment platform — no money changes hands on the platform
- Not a messaging system — owners put their real contacts on the listing
- Not a rental agency — no commission, no contract generation
- Not a mobile app — web only (responsive)
- Not an AI that trains its own models — uses Google Gemini API (free tier)

---

## 2. The Three Actors

There are exactly three types of users. Every feature decision must consider which actor it serves.

### 2.1 The Student (Étudiant)

The primary user of the platform. Everything is optimized for their experience.

**Who they are:** A university student in Morocco, typically 18–25 years old, looking for affordable housing within a reasonable distance from their campus. They may be from another city (internal migration for studies is very common in Morocco).

**What they need:**
- Find housing fast, cheaply, safely
- Know if a listing is real before wasting time contacting the owner
- Be able to save interesting listings and come back later
- Contact the owner directly without creating an account on WhatsApp groups

**Student-specific data the platform stores:**
- Their university (FK → `universites` table)
- Their maximum monthly budget (in DH)
- Their city of search preference

**What they can do:**
- Register and log in
- Search for listings near any university
- Filter by budget, type, distance, equipment
- View any listing detail (contacts hidden until logged in)
- Show contacts (triggers a Consultation record)
- Save listings to favorites
- Leave a review (only after showing contacts)
- Report a listing as fraudulent (once per listing)
- Use the AI chatbot
- Receive personalized recommendations

### 2.2 The Owner (Propriétaire)

A property owner who wants to rent to students. They must go through identity verification.

**Who they are:** Could be an individual homeowner, a family renting out an extra room, or a small-scale landlord with multiple properties. Most are not tech-savvy — the publish flow must be simple and guided.

**What they need:**
- A place to advertise their property without paying commission
- Reach verified students near the campus
- A simple form that doesn't require technical knowledge

**Owner-specific data the platform stores:**
- Their CIN number (unique — one CIN, one owner account)
- Photo of their CIN card (stored on Cloudinary, reviewed by admin)
- Whether their CIN has been manually verified (`est_verifie_cin`)
- Their average review score (`note_moyenne`) and total reviews (`nb_avis_total`)
- Their phone number

**What they can do:**
- Register and log in (CIN upload required at registration)
- Publish listings via a 4-step form
- Manage their listings (edit, archive, delete)
- See views and favorites count on their listings
- Receive notifications when a listing is validated, rejected, or suspended

**What they CANNOT do:**
- See who viewed their listing (student identities are private)
- Contact students through the platform
- Publish more than one active listing per `Logement` at a time

### 2.3 The Admin

A platform operator who manages trust and safety. There is no self-service admin creation — admin accounts are created directly in the database.

**What they can do:**
- Validate or reject listings in the moderation queue (score 40–69)
- Validate or reject CIN documents uploaded by owners
- Handle suspended listings (from 3+ reports)
- Suspend user accounts
- Reset passwords
- View platform statistics

**What they CANNOT do:**
- Publish listings
- Contact users through the platform
- Modify listing content directly (they can only approve/reject)

---

## 3. Registration & Identity Verification

### 3.1 How student registration works

1. Student fills the form: prénom, nom, email, mot de passe, université, budget max, ville de recherche
2. System creates the account with `email_confirme = false` — account is INACTIVE
3. System sends a confirmation email with a unique token link
4. Student clicks the link → `email_confirme = true` → account ACTIVE
5. Student can now log in

**If the student tries to log in before confirming email:**
- System rejects with message "Confirmez votre adresse email avant de vous connecter"
- Option to resend the confirmation email

**The confirmation token:**
- Valid for 24 hours
- Single-use — used once, marked as consumed
- If expired: show "Ce lien a expiré" + button "Renvoyer un lien"

### 3.2 How owner registration works

Owner registration has one extra step: CIN upload.

1. Owner fills the form: prénom, nom, email, mot de passe, téléphone, numéro CIN, photo CIN
2. System creates the account with `email_confirme = false` AND `est_verifie_cin = false`
3. System sends confirmation email — same flow as student
4. After email confirmation: account is active but **NOT CIN-verified**
5. Admin reviews the CIN photo manually (see Section 16)
6. Admin clicks "Valider CIN" → `est_verifie_cin = true` → owner gets "Propriétaire vérifié ✓" badge

**Important: owners can publish listings before CIN verification.**
But all listings from unverified owners go directly to the admin moderation queue, regardless of their fraud score. This is a business rule, not a technical bug.

### 3.3 The CIN — Rules & Constraints

The CIN (Carte d'Identité Nationale) is the core identity document in Morocco.

**Rules enforced by the database:**
- `numero_cin` is UNIQUE in the `utilisateurs` table — one CIN = one owner account maximum
- If someone tries to register with an already-used CIN, they get: "Ce numéro de CIN est déjà associé à un compte"
- `photo_cin_url` stores the Cloudinary URL of the uploaded CIN photo
- `est_verifie_cin` starts as `false` and can only be set to `true` by an admin

**What counts as valid CIN verification:**
- The photo is readable (not blurry, not cropped)
- The name on the CIN matches the name on the account
- The CIN is not expired
- The CIN format matches Moroccan standard

**What admin does when CIN is invalid:**
- Rejects with a note explaining the problem
- Owner must re-upload a correct photo
- `est_verifie_cin` stays `false`

### 3.4 Email uniqueness

- One email = one account. Period.
- An owner cannot also have a student account with the same email.
- If someone tries: "Un compte existe déjà avec cette adresse email"

---

## 4. Authentication & Sessions

### 4.1 How login works

1. User submits email + password
2. Backend verifies `email_confirme = true` — if false, reject
3. Backend verifies `is_active = true` — if false, reject with "Compte suspendu"
4. Backend verifies password (bcrypt compare)
5. If all checks pass: generate JWT token containing `{ userId, email, role, exp }`
6. Return token to frontend

**Token expiry:** 24 hours (`JWT_EXPIRATION = 86400000` ms)

### 4.2 Where the token lives

**CRITICAL RULE:** The JWT token is stored in React memory (useState) ONLY.
- Never in `localStorage`
- Never in `sessionStorage`
- Never in a cookie (unless HttpOnly is implemented — out of scope for now)

**Consequence:** If the user refreshes the page, they are logged out. This is intentional and correct for this project. It is simpler and more secure for a student housing platform.

### 4.3 What happens on token expiry or 401

- Axios interceptor catches any 401 response
- Calls `logout()` which clears the in-memory token
- Redirects to `/login`
- Shows toast: "Votre session a expiré. Reconnectez-vous."

### 4.4 Role-based access

Every protected route checks the role from the token:

| Route | Required role |
|-------|--------------|
| `/search` | Public (contacts hidden if not logged in) |
| `/annonces/:id` | Public (contacts hidden if not logged in) |
| `/publier` | PROPRIETAIRE only |
| `/mes-annonces` | PROPRIETAIRE only |
| `/mes-favoris` | ETUDIANT only |
| `/profil` | Any authenticated user |
| `/admin/*` | ADMIN only |

If wrong role: redirect to home with toast "Accès non autorisé"

---

## 5. Logement vs Annonce — The Core Distinction

This is the most important architectural concept in UniHome. It must be understood before touching any code.

### 5.1 Logement — The physical property

A `Logement` represents the physical reality: an apartment, a room, a studio. It exists in the real world at a fixed address with fixed characteristics.

**What belongs to Logement:**
- Physical address
- City
- GPS coordinates (PostGIS GEOGRAPHY point)
- Surface area (m²)
- Type (studio / chambre / colocation / appartement)
- Status (disponible / occupé / archivé)

**What does NOT belong to Logement:**
- Title (that's marketing, it belongs to the Annonce)
- Description (same)
- Price (can change each time it's relisted)
- Photos (taken at a point in time, belong to the publication)
- Contact info (owner may change contact method)
- Reviews (belong to a specific publication period)

**Logement is PERMANENT.** It is created once and never deleted — only archived.

### 5.2 Annonce — The publication

An `Annonce` is a specific publication of a `Logement` on the platform at a point in time.

**What belongs to Annonce:**
- Title
- Description
- Monthly rent (`loyer`)
- Whether charges are included (`charges_incluses`)
- Confidence score (`score_confiance`)
- Score breakdown (`detail_score` JSONB)
- Publication status
- Publication date
- Expiration date (auto-computed: publication date + 90 days)
- Number of reports counter
- Photos (2–10)
- Contact info (phone, WhatsApp, email, etc.)
- Equipment list (many-to-many)

**Annonce is TEMPORAL.** It has a lifespan of 90 days. After expiration, it is automatically archived.

### 5.3 Why this matters in practice

**Scenario:** An owner has a studio in Fès. They listed it in September 2023. It expired in December. They want to relist it in September 2024.

**What happens:**
- The `Logement` already exists in the DB → no new Logement is created
- A new `Annonce` is created, linked to the existing Logement
- The new Annonce goes through the fraud pipeline again (new score)
- The new Annonce starts with zero reviews
- The new Annonce can have different photos and a different price
- The old Annonce is ARCHIVEE and stays in the DB for history

**What stays the same:** address, GPS, surface area, type — all on the Logement.

### 5.4 One active Annonce per Logement at a time

A Logement can only have ONE active Annonce at a time. If an owner tries to publish a new Annonce for a Logement that already has an active one, the system:
1. Auto-archives the current active Annonce
2. Creates the new Annonce
3. Runs the new Annonce through the fraud pipeline

---

## 6. Publishing a Listing — Full Workflow

### 6.1 The 4-step form

**Step 1 — Basic information**
- Title (required, max 200 chars)
- Description (required, min 50 chars)
- Type: Studio / Chambre / Colocation / Appartement
- Monthly rent (required, in DH)
- Whether charges are included (toggle)

*Logement fields (created or linked):*
- Full address (required)
- City (required, dropdown of Moroccan cities)
- Surface area in m²
- Nearest university (dropdown → fetches from `GET /api/universites`)
- GPS coordinates (map pin picker — defaults to selected university, user can drag)

**Step 2 — Photos**
- Minimum 2 photos, maximum 10
- Each photo: JPG or PNG, max 5MB
- Photos upload immediately to Cloudinary on selection (not on form submit)
- User can reorder photos by drag-and-drop
- User marks one photo as "principale" (cover photo)
- Backend immediately computes `phash` for each photo upon upload

**Step 3 — Equipment**
- Grid of toggleable chips from the `equipements` reference table
- No minimum required — owner may have nothing to declare
- Creates entries in `annonce_equipements` join table

**Step 4 — Contact information**
- Dynamic rows: one per contact method
- Available platforms: Téléphone / WhatsApp / Email / Facebook / Instagram
- One row per platform maximum (enforced by UNIQUE(annonce_id, plateforme) in DB)
- Minimum 1 contact required
- Default: one Téléphone row pre-filled
- Moroccan phone validation: must match `^(\+212|0)[67]\d{8}$`
- At least one of: Téléphone or WhatsApp (students need a direct way to reach the owner)

### 6.2 What happens on submit

1. Frontend sends all data to `POST /api/annonces` (multipart/form-data)
2. Backend creates `Logement` (or reuses existing one if address matches)
3. Backend creates `Annonce` with `statut = EN_ATTENTE`
4. Backend saves photos + contacts + equipment associations
5. Backend calls Python microservice: `POST /analyse` with full annonce data
6. Python runs 4-layer analysis (see Section 7)
7. Python returns `{ score: 78, detail: { identite: 25, texte: 20, photos: 20, prix: 13 }, decision: "VALIDEE" }`
8. Backend updates Annonce:
   - Sets `score_confiance = 78`
   - Sets `detail_score = { identite: 25, texte: 20, photos: 20, prix: 13 }`
   - Sets `statut` based on decision
9. DB trigger fires: sets `date_expiration = date_publication + 90 days`
10. Backend returns result to frontend

### 6.3 Post-submit states shown to owner

| Score | Statut | What owner sees |
|-------|--------|-----------------|
| ≥ 70 | VALIDEE | "✅ Votre annonce est publiée ! Score : 87/100" + link to view it |
| 40–69 | EN_ATTENTE | "⏳ Votre annonce est en cours de validation par notre équipe." |
| < 40 | REJETEE | "❌ Votre annonce n'a pas été publiée." + breakdown of what failed |
| Owner unverified CIN | EN_ATTENTE | "⏳ Votre CIN n'est pas encore validée. Votre annonce sera examinée manuellement." |

### 6.4 Editing an existing listing

- Owner navigates to `/publier/edit/:annonceId`
- Form is pre-filled with existing data
- Owner can change: title, description, price, equipment, contacts, photos
- Owner CANNOT change: address, GPS, city, surface area (those are Logement fields — permanent)
- On save: fraud pipeline runs again → new score → new statut decision
- Old score is overwritten

### 6.5 Archiving a listing

- Owner clicks "Archiver" on any active listing
- `statut` → ARCHIVEE, `is_active` → false
- Listing disappears from search results
- All associated data (photos, reviews, consultations) is preserved in DB
- Listing is shown under "Archivées" tab in owner dashboard

### 6.6 Deleting a listing

- Owner clicks "Supprimer"
- Confirmation modal: "Cette action est irréversible. Supprimer l'annonce ?"
- If confirmed: `statut` → ARCHIVEE, `is_active` → false (soft delete — data is never destroyed)
- Logement record stays intact

---

## 7. The AI Fraud Detection Pipeline

This runs automatically every time an Annonce is created or edited. It is the backbone of UniHome's trust system.

### 7.1 Overview

Spring Boot backend calls the Python FastAPI microservice with the full annonce data. Python runs 4 independent analysis layers in parallel, then aggregates the results into a final score.

**Input to Python:**
```json
{
  "annonce_id": "uuid",
  "proprietaire_id": "uuid",
  "titre": "Studio meublé proche USMBA Fès",
  "description": "Beau studio...",
  "loyer": 1200,
  "ville": "Fes",
  "type_logement": "STUDIO",
  "photos_urls": ["https://res.cloudinary.com/..."],
  "compte_age_jours": 45,
  "est_verifie_cin": false,
  "nb_signalements_passes": 0
}
```

**Output from Python:**
```json
{
  "score": 78,
  "detail": {
    "identite": 25,
    "texte": 20,
    "photos": 20,
    "prix": 13
  },
  "decision": "VALIDEE",
  "flags": ["prix_légèrement_bas"]
}
```

### 7.2 Layer 1 — Identity (max 30 points)

Checks the owner's account trustworthiness. No external API needed — pure rule-based logic.

| Check | Points awarded |
|-------|---------------|
| CIN verified by admin | +15 pts |
| Account older than 30 days | +8 pts |
| Account older than 90 days | +12 pts (replaces 8) |
| OTP phone verified (if implemented) | +5 pts |
| Zero prior reports on owner's listings | +3 pts |
| Account created less than 24h ago | −10 pts (new account publishing immediately = suspicious) |
| Owner has 3+ prior validated listings | +5 pts bonus (capped at 30 total) |

**Note:** An unverified CIN owner cannot score more than 15 on this layer (they miss the +15 pts). This is why all unverified-CIN listings go to manual review regardless of total score.

### 7.3 Layer 2 — Text NLP (max 25 points)

Analyzes the title and description for fraud signals.

**Duplicate detection (TF-IDF cosine similarity):**
- Compares the description to all existing validated annonces in the same city
- Similarity > 0.85 → flagged as duplicate → −20 pts
- Similarity 0.7–0.85 → similar → −8 pts
- No similarity detected → +0 pts (neutral, other checks still apply)

**Keyword blacklist (checked in French, Arabic, Darija):**
```
French:  virement, mandat, western union, proprietaire absent, 
         contact moi par email seulement, avance urgente,
         je suis a l'etranger, pas de visite possible, urgent urgent
Arabic:  حوالة, مالك غائب, تحويل, ضروري
Darija:  ana barra, machi mumkin tzor
```
Each blacklisted term found: −5 pts (cumulative, minimum 0)

**Description quality check:**
- Description < 30 words → −5 pts
- Description 30–80 words → +0 pts
- Description > 80 words with specific details → +5 pts
- Title is generic (< 5 words) → −3 pts

**Gemini API call (text analysis):**
- Sends title + description to Gemini Flash
- Prompt asks: "Is this a legitimate Moroccan student housing listing? Return JSON: { legitime: bool, raison: string, score: 0-10 }"
- Gemini score 8–10 → +10 pts
- Gemini score 5–7 → +5 pts
- Gemini score < 5 → −5 pts

### 7.4 Layer 3 — Photos (max 25 points)

**pHash duplicate detection:**
- For each uploaded photo, compute its perceptual hash (pHash)
- Compare against all photo hashes in the DB (`photos.phash` column)
- If any photo matches an existing hash (hamming distance < 10): −15 pts per stolen photo
- Photos are considered stolen even if resized, cropped, or brightness-adjusted

**Photo quantity:**
- 2 photos (minimum): +5 pts
- 3–5 photos: +10 pts
- 6–10 photos: +15 pts

**EXIF metadata check:**
- If photo contains GPS data (from camera/phone): compare to declared address
- GPS within 500m of declared address: +3 pts bonus
- GPS more than 5km from declared address: −10 pts (suspicious — photos not from the property)
- No EXIF data: +0 pts (neutral — many phones strip EXIF)

**Gemini Vision analysis:**
- Sends up to 3 photos to Gemini Flash (vision model)
- Asks: "Does this look like a real Moroccan student apartment? Is there a watermark? Is it AI-generated? Return JSON: { real_apartment: bool, has_watermark: bool, seems_ai_generated: bool }"
- All real, no watermark, not AI: +7 pts
- Has watermark: −10 pts
- Seems AI-generated: −15 pts

### 7.5 Layer 4 — Market Price (max 20 points)

Compares the listing price to the median rent for similar listings in the same city and type.

**SQL query (runs in Python via SQLAlchemy):**
```sql
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY loyer)
FROM annonces a
JOIN logements l ON l.id = a.logement_id
WHERE a.statut = 'VALIDEE'
  AND l.ville = :ville
  AND l.type_logement = :type
  AND a.date_expiration > NOW()
```

**Scoring based on deviation from median:**
| Price vs Median | Score |
|-----------------|-------|
| Within ±30% | +20 pts (normal price range) |
| 30–50% below median | +10 pts (cheap but possible) |
| > 50% below median | −15 pts (unrealistically cheap = scam signal) |
| > 100% above median | −5 pts (overpriced — not fraud but suspicious) |

**Special case — no data:**
If there are fewer than 5 validated listings in that city/type combination, skip this layer and award 10/20 points (neutral score, don't punish new markets).

### 7.6 Score aggregation and decision

```
Final Score = Layer1 + Layer2 + Layer3 + Layer4
             (each layer is capped at its maximum, minimum 0)

Score ≥ 70  → VALIDEE     (auto-published)
Score 40-69 → EN_ATTENTE  (goes to admin queue)
Score < 40  → REJETEE     (auto-rejected)
```

**Special override rules:**
- If owner `est_verifie_cin = false` → force EN_ATTENTE regardless of score
- If any photo is detected as stolen (Layer 3) → force score cap at 60 (cannot auto-publish)
- If Gemini Layer 2 returns `legitime: false` → force score cap at 55

### 7.7 When the pipeline runs

- On new annonce creation (POST /api/annonces)
- On annonce edit/update (PUT /api/annonces/:id)
- Never manually triggered by admin (admin only sees the result)

### 7.8 Pipeline timeout handling

- Python call has a 30-second timeout in Spring Boot (WebClient timeout)
- If Python is unavailable or times out: Annonce is set to EN_ATTENTE with `score_confiance = null`
- Owner sees: "Votre annonce est en cours d'analyse, résultat sous 24h"
- Admin sees it in the queue with a flag "Analyse IA en attente"

---

## 8. The Confidence Score — Rules & Display

### 8.1 What the score means

The confidence score (0–100) is a single number that tells students how much to trust a listing. It is **always displayed publicly** on every listing.

It is NOT a quality score. A score of 50 doesn't mean the apartment is bad — it means the listing needs human verification. A score of 95 means the AI found no fraud signals.

### 8.2 Score display rules

| Score | Color | Label | Meaning |
|-------|-------|-------|---------|
| 70–100 | Green | "Vérifié IA ✓" | Auto-published, no major red flags |
| 40–69 | Violet | "En cours de vérification" | Under admin review |
| 1–39 | Red | "Non publié" | Rejected — not visible in search |
| null | Gray | "Analyse en cours" | Pipeline running or timed out |

**Where the score is shown:**
- Search result cards (small badge, top-right of thumbnail)
- Listing detail page (large circular display in sidebar)
- Owner dashboard (in their listing list)
- Admin moderation queue (most prominently)

**Where it is NOT shown:**
- The score breakdown (detail_score) is only visible on the detail page
- Admin can always see the full breakdown

### 8.3 Score is not recalculated by admin

When admin validates a listing from the queue (score 40–69), they are making a human judgment call. The score does NOT change — it stays at whatever the pipeline calculated. The admin's action changes the `statut` from EN_ATTENTE to VALIDEE (or REJETEE), not the score.

---

## 9. Search & Discovery

### 9.1 How search works

The student selects:
1. A **university** (from dropdown — fetched from `universites` table)
2. A **budget maximum** (DH/month)
3. A **radius** (distance from campus, in km — default: 5km)
4. Optionally: type, surface min, equipment filters

The backend queries the `v_annonces_avec_distance` view which:
- Joins annonces + logements + universites
- Computes `ST_Distance(logement.coordonnees, universite.coordonnees)` in metres
- Filters to `statut = 'VALIDEE'` and `is_active = true` and not expired
- Returns results sorted by distance ascending (default)

### 9.2 What students see

Results are shown in two formats simultaneously:
- **List view**: scrollable list of AnnonceCards on the left
- **Map view**: Leaflet map on the right with color-coded markers

Markers are colored by score: green (≥70), violet (40–69 — these won't appear in VALIDEE search anyway), red (suspended — won't appear). In practice, all search results are green markers.

**The campus marker:** The selected university's location is always marked on the map with a distinct icon (graduation cap or similar). This is the reference point students use to judge distance.

### 9.3 Search results caching

Search results are cached in Redis with a TTL of 5 minutes.

**Cache key:** SHA256 hash of the search parameters object (universiteId + budgetMax + rayon + type + equipements sorted alphabetically)

**Cache invalidation:** When a new VALIDEE annonce is added in that city, the related cache keys are NOT automatically invalidated — they expire naturally after 5 minutes. This is acceptable for a student housing platform (5-minute delay is fine).

### 9.4 Sorting options

- Distance (ascending) — default
- Prix croissant
- Prix décroissant
- Score IA (descending — shows most trusted first)

### 9.5 Pagination

- 12 results per page
- Load more / infinite scroll (preferred over numbered pagination)
- Total count displayed: "24 annonces trouvées"

### 9.6 Non-logged-in search

Users who are not logged in CAN search and CAN view listing detail pages. However:
- Contact information is hidden behind a "Se connecter pour voir les contacts" gate
- Favorites button is hidden (or shows "Se connecter pour sauvegarder")
- Review section is visible (read-only) but "Laisser un avis" form is hidden

This is intentional: let users discover the platform before forcing login.

---

## 10. AI Recommendations

### 10.1 What recommendations are

When a logged-in student performs a search, the top of the results page shows up to 3 "Pour toi" cards — listings specifically selected for that student based on their profile and behavior.

### 10.2 How they are calculated

The recommendation engine (in Python FastAPI) scores all active VALIDEE listings and picks the top 3 for the student.

**Scoring factors:**
1. **Budget match** (0–40 points): How close is the listing price to the student's budget? A listing at exactly their budget max scores 40. A listing at 50% of their budget scores 20 (still good). A listing above their budget scores 0.
2. **Distance to university** (0–30 points): Distance between the listing's Logement and the student's registered university. Within 500m = 30 pts. At 5km = 5 pts. Beyond 5km = 0 pts.
3. **Type match with favorites** (0–20 points): Does the listing type match the student's past favorites? If student favorited 3 studios, and this is a studio: +20 pts.
4. **Consultation history** (0–10 points): Has the student consulted similar listings (same type, similar price range) without leaving a review? (Suggests interest but not satisfaction) — boost similar listings.

**Gemini generates the "raison" phrase:**
- Sends the top match data to Gemini: "A Moroccan student needs a studio near USMBA Fès, budget 1200 DH. This listing matches: 800 DH, 1.2km from campus, furnished. Generate a short 10-word French explanation why this is a good match."
- Result stored in `recommandations.raison` column
- Example output: "Meublé, WiFi inclus et à 1.2 km de l'USMBA"

### 10.3 When recommendations are recalculated

- When the student adds a new favorite → recalculate immediately
- When a recommendation expires (`date_expiration` = 24h after generation) → recalculate on next search
- Triggered by: `GET /api/recommandations` — backend checks if valid recommendations exist in DB, generates if not

### 10.4 What is stored in the DB

Each recommendation is one row in `recommandations`:
- `etudiant_id` → the student
- `annonce_id` → the suggested listing
- `score_pertinence` → 0–100 relevance score
- `raison` → Gemini-generated phrase
- `date_generation` → when it was calculated
- `date_expiration` → date_generation + 24h (computed by DB trigger)
- `est_consultee` → false initially, set to true when student clicks on it

The `est_consultee` flag is used to improve future recommendations: if a student never clicks on recommended listings of type X, reduce the weight of type X in future calculations.

---

## 11. Consultation — The Gate Mechanism

### 11.1 What a Consultation is

A `Consultation` is a database record created every time a logged-in student views a listing's detail page. It is the mechanism that:
1. Tracks which listings a student has viewed (for recommendations)
2. Gates the ability to leave a review (contacts must have been shown)

### 11.2 How it is created

When a student opens an annonce detail page (`GET /api/annonces/:id`):
- Backend creates a `Consultation` record: `{ etudiant_id, annonce_id, contacts_affiches: false, created_at: NOW() }`
- Multiple visits by the same student to the same listing create **multiple Consultation records** (no UNIQUE constraint on consultations)
- This is by design — tracks visit frequency

### 11.3 The contacts gate

When a student clicks "Afficher les coordonnées" on the listing detail page:
- Backend updates the most recent Consultation record for that student+annonce pair: `contacts_affiches = true`
- This action is irreversible — once contacts are shown, `contacts_affiches` stays true
- The contact data is then returned in the API response

**This single boolean is the gate for reviews.** If `contacts_affiches` is never set to true for a given (student, annonce) pair, the student cannot leave a review. This is enforced at the database level via `avis.consultation_id` FK — the review must reference a Consultation where `contacts_affiches = true`.

### 11.4 Why this design

It ensures:
- Only students who genuinely engaged with an owner can leave reviews
- Fake reviews from students who never contacted the owner are impossible
- The review system reflects real experiences, not opinions

---

## 12. Contacts — How Students Reach Owners

### 12.1 What contact information looks like

Contacts are stored in the `contacts_annonce` table, one row per contact method per listing.

Available platforms (from `type_contact_enum`):
- `TELEPHONE` — plain phone number, rendered as `tel:` link
- `WHATSAPP` — phone number, rendered as `https://wa.me/XXXXXXXX` link
- `EMAIL` — email address, rendered as `mailto:` link
- `FACEBOOK` — Facebook profile URL or name
- `INSTAGRAM` — Instagram handle or URL

**Constraint:** UNIQUE(annonce_id, plateforme) — one phone number, one WhatsApp, etc. per listing.

### 12.2 When contacts are visible

| User state | Contacts visible? |
|-----------|------------------|
| Not logged in | Never — shows "Connectez-vous pour voir les contacts" |
| Logged in, never clicked "Afficher" | Never — shows "Afficher les coordonnées" button |
| Logged in, clicked "Afficher" | Always (even on future visits to same listing) |

### 12.3 What "Afficher les coordonnées" does

1. Frontend calls `PATCH /api/consultations/:consultationId/show-contacts`
2. Backend sets `contacts_affiches = true` on that consultation record
3. Backend returns all contact rows for that annonce
4. Frontend reveals the contacts with an animation (no page reload)

### 12.4 Contact information never changes mid-session

If an owner edits their listing's contact info after a student has already shown contacts — the student will see the new contact info on their next visit. The contacts are fetched from DB on each request, not cached on the student's side.

---

## 13. Favorites

### 13.1 What favorites are

A student can save an Annonce to their favorites list for later consultation. This is purely a bookmarking feature.

### 13.2 How favorites work

- `POST /api/favoris { annonce_id }` → creates a Favori record
- `DELETE /api/favoris/:annonceId` → removes the Favori record
- The Favori links to the **Annonce**, not the Logement — if the annonce expires and is relisted as a new annonce, the old favori is no longer associated with the new listing
- Primary key is `(etudiant_id, annonce_id)` — cannot favorite the same listing twice

### 13.3 What students see on their favorites page

- All their saved listings, including those that have since expired, been suspended, or been archived
- Expired/suspended listings show a gray overlay with the appropriate badge
- The listing data is still displayed (title, price, photo) — it's a record of what they saved

### 13.4 Effect on recommendations

Adding a favorite triggers an immediate recalculation of the student's recommendations. This is because favorites are the strongest signal of preference in the recommendation algorithm.

---

## 14. Reviews — Avis

### 14.1 The gate condition (CRITICAL)

A student can leave a review on a listing **if and only if**:
- They are logged in (of course)
- There exists a Consultation record for them + that annonce where `contacts_affiches = true`

This is enforced at the **database level**: the `avis` table has a foreign key `consultation_id → consultations.id`, and the backend verifies that the referenced consultation has `contacts_affiches = true` before creating the avis. If someone tries to bypass the frontend and call the API directly, the DB constraint stops them.

### 14.2 Review uniqueness

UNIQUE(etudiant_id, annonce_id) in the `avis` table. One review per student per listing. If a student tries to submit a second review:
- Frontend hides the form if a review already exists for that listing
- Backend returns 409 Conflict if called directly

### 14.3 What a review contains

- `note` — integer from 1 to 5 (CHECK constraint in DB)
- `commentaire` — text body of the review (optional — note alone is valid)
- `valide_par_ia` — boolean, result of Gemini validation

### 14.4 Gemini review validation

Before an Avis is stored as visible, its commentaire is sent to Gemini:

**Prompt (sent to Python chatbot route):**
"Est-ce un commentaire d'avis approprié pour une plateforme de logement étudiant marocaine ? Il ne doit pas contenir : insultes, discours haineux, informations personnelles (numéro de téléphone, email), spam, texte non-sens. Réponds en JSON: { valide: bool, raison: string }"

- If `valide: true` → `valide_par_ia = true` → review is displayed immediately
- If `valide: false` → `valide_par_ia = false` → review is stored but shown as "En attente de validation" (comment text hidden, only the note is visible)
- If Gemini call fails (quota, timeout) → default to `valide_par_ia = true` (don't block reviews on API failure)

### 14.5 How reviews affect owner rating

A DB trigger (`trg_recalcule_note`) fires on INSERT, UPDATE, or DELETE on `avis` and:
1. Recalculates the average note for all avis linked to all annonces of that owner
2. Updates `proprietaires.note_moyenne` with the new average (rounded to 2 decimals)
3. Updates `proprietaires.nb_avis_total` with the new count

This means owner rating is always up-to-date without any scheduled jobs.

### 14.6 Reviews are linked to Annonce, not Logement

When an owner relists their property as a new Annonce, the new Annonce starts with zero reviews. The old reviews are preserved on the archived Annonce and contribute to the owner's `note_moyenne` until they too are archived and the owner's trigger is recalculated.

---

## 15. Fraud Reports — Signalements

### 15.1 Who can report

Any logged-in student can report any active listing. Only one report per student per listing (UNIQUE constraint in DB).

### 15.2 What reasons are available

Dropdown of pre-defined reasons:
- "Prix suspect" (unrealistically cheap or doesn't match the described property)
- "Fausses photos" (photos don't match the property or are stolen)
- "Propriétaire introuvable" (student tried to contact but no response / number doesn't work)
- "Adresse incorrecte" (the address doesn't match the location on the map)
- "Arnaque confirmée" (student was scammed — lost money or the property doesn't exist)
- "Autre" (free text field appears)

### 15.3 What happens after a report

1. `Signalement` record created with `statut = OUVERT`
2. DB trigger fires: `annonces.nb_signalements` counter incremented
3. DB trigger checks: if `nb_signalements >= 3` AND all 3 reports are `OUVERT` (not yet rejected by admin) → `annonces.statut` → `SUSPENDUE`, `is_active` → `false`
4. Suspended listing disappears from search results immediately
5. Admin sees the listing in the "Signalements" queue

**Important: the counter is based on OUVERT reports only.** If admin rejects a report (marks it as unfounded), the counter decreases. A listing with 4 reports of which 2 were rejected (statut=REJETE) only has 2 effective OUVERT reports and is NOT suspended.

### 15.4 What admin does with a report

Three options:
1. **Valider le signalement** → marks the report as TRAITE, listing stays SUSPENDUE or is set to REJETEE permanently. Admin can ban the owner.
2. **Rejeter le signalement** → marks the report as REJETE (unfounded), decrements the OUVERT counter. If the suspension threshold is no longer met, the listing is automatically reactivated.
3. **Demander une correction** → listing stays SUSPENDUE, admin sends a message to the owner explaining what needs to be fixed.

### 15.5 What the suspended owner sees

- Their listing shows as "Suspendue" in their dashboard
- They see the number of reports but NOT who reported them
- They see the admin's note if one was added
- They can edit and resubmit the listing (triggers a new fraud pipeline run)

---

## 16. Admin — Moderation & Management

### 16.1 The moderation queue

Admin sees two types of listings needing attention:
1. Listings with `statut = EN_ATTENTE` (score 40–69, or unverified owner)
2. Listings with `statut = SUSPENDUE` (3+ reports)

For each listing in the queue, admin sees:
- All listing photos
- Title, description, address, price
- Owner name + CIN verification status
- Full score breakdown: `detail_score` JSONB displayed as 4 progress bars
- List of reports (for suspended listings) with reasons

### 16.2 Admin decision options

| Decision | What it does | When to use |
|----------|-------------|-------------|
| Valider | `statut → VALIDEE, is_active → true` | Listing looks legitimate, no issues found |
| Rejeter | `statut → REJETEE, is_active → false` + email to owner | Clear fraud, fake listing |
| Demander correction | `statut → EN_ATTENTE` stays + message to owner | Listing could be valid but needs updates |

### 16.3 CIN validation by admin

Owner uploads CIN at registration. Admin sees:
- Owner name as on the platform
- CIN photo (Cloudinary URL)
- CIN number entered by owner

Admin checks:
- Photo is legible (not blurry, not cropped)
- Name matches
- CIN format valid
- Not expired

If valid: click "Valider CIN" → `est_verifie_cin = true` → owner gets verified badge
If invalid: click "Refuser" + note → owner must re-upload

### 16.4 User account management

Admin can:
- **Suspend an account**: `is_active → false`. All that user's active listings → `statut = SUSPENDUE, is_active = false`. User gets "Compte suspendu" on next login attempt.
- **Reactivate an account**: `is_active → true`. Listings are NOT automatically reactivated — admin must reactivate them manually one by one.
- **Reset password**: sends a password reset link to the user's email.

### 16.5 Admin account creation

Admin accounts are NOT self-service. They are created directly in the database:
```sql
INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, role, email_confirme, est_verifie, is_active)
VALUES (gen_random_uuid(), 'Admin', 'UniHome', 'admin@unihome.ma', 
        '$2a$10$...bcrypted...', 'ADMIN', true, true, true);
```

There is no admin registration page and there should never be one.

---

## 17. The Chatbot

### 17.1 What it does

The chatbot is a floating widget available on all pages of the platform. It answers student questions about:
- How to find a listing (search tips)
- How the confidence score works
- How to report a fraudulent listing
- What to do if a landlord doesn't respond
- General tips for student housing in Morocco
- Listing-specific questions if the student is on a detail page

### 17.2 How it works technically

1. Student types a message in the chat widget
2. Frontend calls `POST /api/chatbot { message, session_id }`
3. Spring Boot backend forwards to Python: `POST /chat { message, session_id }`
4. Python retrieves last 10 messages from Redis (key: `chat:{session_id}`)
5. Python builds prompt: SYSTEM PROMPT + conversation history + new message
6. Python calls Gemini Flash API
7. Gemini responds → Python stores response in Redis (append to conversation) → returns reply
8. Spring Boot returns reply to frontend
9. Frontend displays reply in the chat window

### 17.3 The system prompt

```
Tu es UniBot, l'assistant virtuel de la plateforme UniHome au Maroc. 
UniHome aide les étudiants marocains à trouver des logements près des universités.

Tes règles:
- Réponds en français, arabe (Modern Standard ou Darija) selon la langue du message
- Tu aides uniquement sur les sujets: logement étudiant, plateforme UniHome, arnaques, contact propriétaires
- Si tu ne sais pas, dis-le honnêtement - ne t'invente pas de réponses
- Sois concis (max 3 phrases par réponse sauf si on te demande d'expliquer)
- Ne donne jamais de conseils légaux ou financiers précis

Infos sur UniHome:
- Chaque annonce a un score de confiance de 0 à 100 calculé par IA
- Score ≥ 70 = publié automatiquement
- Score 40-69 = examiné par notre équipe
- Score < 40 = refusé
- 3 signalements = suspension automatique
- Les contacts du propriétaire sont visibles uniquement après connexion
```

### 17.4 Session management

- Each chat session has a UUID (`session_id`) generated on the frontend when the widget is first opened
- Session history (10 last messages) is stored in Redis with TTL 1 hour
- After 1 hour of inactivity, the session expires and a new one starts
- Not linked to user account — anonymous chat works for non-logged-in users too

### 17.5 What the chatbot does NOT do

- Does not browse the database to answer "show me listings in Fès" — it only answers questions about the platform
- Does not help with payment, contracts, or legal advice
- Does not send emails or contact owners on behalf of students

---

## 18. Account Lifecycle

### 18.1 Student account lifecycle

```
Created → Email NOT confirmed → Cannot log in
    ↓ (clicks email link)
Email confirmed → Active account → Can search, view, save, report
    ↓ (admin action)
[Optional] Suspended → Cannot log in, all actions blocked
    ↓ (admin reactivates)
Active again
```

### 18.2 Owner account lifecycle

```
Created → Email NOT confirmed → Cannot log in
    ↓ (clicks email link)
Email confirmed → Active, CIN NOT verified
    ↓                    ↓
Can publish listings    All listings go to EN_ATTENTE
    ↓ (admin validates CIN)
CIN verified → "Propriétaire vérifié ✓" badge
              → Listings now scored normally by AI pipeline
    ↓ (admin action if needed)
[Optional] Suspended → Cannot log in, all listings auto-suspended
```

### 18.3 What happens when a student account is suspended

- Student cannot log in
- All their saved favorites remain in DB (but inaccessible until reactivated)
- All their reviews and reports remain in DB (data is never deleted)
- Their consultations remain in DB

### 18.4 What happens when an owner account is suspended

- Owner cannot log in
- ALL their active listings are set to `statut = SUSPENDUE, is_active = false`
- Listings disappear from search results
- If reactivated, listings must be manually reactivated one by one by admin

---

## 19. Listing Lifecycle

```
STEP 1: Owner submits 4-step form
    ↓
STEP 2: Annonce created with statut = EN_ATTENTE
    ↓
STEP 3: AI fraud pipeline runs
    ↓
Score ≥ 70 + CIN verified → VALIDEE → visible in search
Score 40-69 OR CIN unverified → EN_ATTENTE → admin queue
Score < 40 → REJETEE → not visible, owner notified
    ↓ (if EN_ATTENTE)
Admin reviews → VALIDEE or REJETEE
    ↓ (if VALIDEE)
Active listing — visible in search for 90 days
    ↓ (at day 90)
DB trigger: date_expiration < NOW() → ARCHIVEE → disappears from search
    ↓ (or sooner if suspended)
3 reports → SUSPENDUE → disappears from search
    ↓ (or owner action)
Owner archives/deletes → ARCHIVEE

REACTIVATION: Only admin can move a listing from SUSPENDUE back to VALIDEE
```

---

## 20. Database — What Lives Where

### 20.1 PostgreSQL — permanent data

All business data lives in PostgreSQL:
- Users (utilisateurs table, all roles)
- Universities (universites)
- Properties (logements)
- Listings (annonces)
- Photos (photos)
- Contacts (contacts_annonce)
- Equipment (equipements + annonce_equipements join table)
- Consultations
- Favorites (favoris)
- Reviews (avis)
- Reports (signalements)
- Recommendations (recommandations)

### 20.2 Redis — ephemeral data

Redis stores only data that can be regenerated:
- Search result cache (TTL: 5 minutes)
- Chatbot session history (TTL: 1 hour, max 10 messages per session)

Redis data loss = minor inconvenience (cache miss on next search, lost chat history). Never store anything in Redis that cannot be regenerated.

### 20.3 Cloudinary — media files

- Listing photos (uploaded by owners)
- CIN photos (uploaded by owners at registration)

Cloudinary URLs are stored in PostgreSQL (`photos.url` and `utilisateurs.photo_cin_url`).

### 20.4 Key PostGIS columns

Two tables have GEOGRAPHY(Point, 4326) columns:
- `universites.coordonnees` — coordinates of each university campus
- `logements.coordonnees` — coordinates of each physical property

These are used in the `v_annonces_avec_distance` view for all geographic search queries. Never query by latitude/longitude columns in application code — always use the `coordonnees` geography column and PostGIS functions.

---

## 21. What the Platform Does NOT Do

These are non-starters. Do not implement them. Do not design for them.

| Feature | Reason not built |
|---------|-----------------|
| Payment / deposit collection | Regulatory complexity, out of academic scope |
| Real-time messaging between student and owner | Replaced by contact info display — simpler, same result |
| Contract generation | Legal complexity, out of scope |
| Native mobile app | Web responsive is sufficient, reduces development scope |
| Student-to-student communication | Not needed — UniHome is discovery, not social |
| Listing analytics for owners | Nice to have, not core — consultation counts only |
| Saved searches / alerts | Nice to have, out of scope for v1 |
| Multi-language full translation | UI in French only for v1 — chatbot handles Arabic/Darija |
| Email notifications for new listings | Out of scope for v1 |
| SMS notifications | Out of scope (Africa's Talking removed from current context) |
| Owner verification by phone OTP | Removed — CIN manual verification is sufficient |

---

## 22. Edge Cases & Special Scenarios

### 22.1 Student tries to report their own listing

Not possible — students cannot publish listings. The roles are mutually exclusive at the DB level (one role per account).

### 22.2 Owner tries to leave a review

Not possible — only ETUDIANT role has access to the review submission endpoint. Spring Security enforces this.

### 22.3 Student reports a listing, then admin rejects the report, student tries to report again

Cannot report again — UNIQUE(etudiant_id, annonce_id) constraint on signalements. Even if the first report was rejected, the constraint prevents a second one. This is intentional — prevents harassment.

### 22.4 Owner publishes a new annonce for a logement that already has an active one

Business rule: one active Annonce per Logement at a time. When the new annonce creation is received:
1. Backend finds existing active annonce for that logement
2. Sets existing annonce `statut = ARCHIVEE, is_active = false`
3. Creates new annonce + runs fraud pipeline

The old annonce's reviews and consultations are preserved on the archived annonce.

### 22.5 Student favorites a listing that then gets suspended

The Favori record stays in DB. On the favorites page, the listing shows with a "Annonce suspendue" overlay. The student is not notified of the suspension (no notification system in v1).

### 22.6 Student tries to leave a review after the annonce is archived

The API endpoint accepts the request if the consultation gate is met, regardless of annonce status. An archived annonce can still receive reviews (the student did consult it when it was active). The review is stored but not publicly displayed (archived annonces are not visible in search).

### 22.7 Gemini API is down or quota is exhausted

- Layer 2 (text): use only TF-IDF + blacklist. Skip Gemini score. Layer 2 max becomes 15/25 instead of 25/25.
- Layer 3 (photos): use only pHash + photo count + EXIF. Skip Gemini vision. Layer 3 max becomes 18/25 instead of 25/25.
- If total score without Gemini would be ≥ 70: still auto-publish (Gemini was just a bonus)
- If score falls in gray zone because Gemini is down: set EN_ATTENTE (human review is the safe default)
- Review validation: default to `valide_par_ia = true` (do not block reviews on API failure)

### 22.8 A photo URL expires on Cloudinary

Cloudinary URLs by default do not expire (they are permanent until deleted). However, if a photo is deleted from Cloudinary manually, the DB still has the URL. The listing will show a broken image. Solution: Cloudinary's free tier handles this — don't delete files from Cloudinary directly, only mark them as deleted in the DB.

### 22.9 Two students try to report the same listing simultaneously, bringing it to exactly 3 reports

The DB trigger handles this atomically. The trigger runs in a transaction, so only one of the two concurrent transactions will bring the count to 3 and fire the suspension. The other transaction will see count = 3 already set and do nothing (or one will see 4 if both complete — suspension still applies at ≥ 3 OUVERT reports).

### 22.10 An admin account is compromised

No admin self-service exists. Admin accounts are created directly in DB. If compromised:
1. Connect to DB directly: `UPDATE utilisateurs SET is_active = false WHERE role = 'ADMIN' AND email = 'compromised@unihome.ma';`
2. Create new admin account in DB with a new email and bcrypt-hashed password.

---

## 23. Glossary

| Term | Definition |
|------|-----------|
| **Annonce** | A temporal publication of a Logement on the platform. Has a lifespan of 90 days. Contains: titre, description, loyer, photos, contacts, score. |
| **CIN** | Carte d'Identité Nationale — the Moroccan national identity card. Required for owner identity verification. |
| **Confidence Score** | The 0–100 fraud detection score calculated by the Python pipeline for every listing. Displayed publicly on every annonce. |
| **Consultation** | A DB record created when a logged-in student views a listing detail page. The `contacts_affiches` boolean on this record gates the ability to leave a review. |
| **ContactAnnonce** | One row in `contacts_annonce` table representing one contact method (phone, WhatsApp, email, etc.) for a specific annonce. |
| **detail_score** | A JSONB field on `annonces` storing the score breakdown: `{identite, texte, photos, prix}`. Sums to `score_confiance`. |
| **est_verifie_cin** | Boolean on `proprietaires`. Set to `true` only by admin after manual CIN review. Controls whether listings auto-publish or always go to queue. |
| **Favori** | A student's saved annonce. PK is `(etudiant_id, annonce_id)`. Linked to Annonce, not Logement. |
| **Gemini Flash** | Google's free LLM API (60 req/min). Used for text analysis, photo vision analysis, chatbot, and review validation. |
| **imagehash / pHash** | Perceptual hashing algorithm for images. Used to detect stolen photos even when resized or cropped. |
| **Logement** | The permanent physical property (apartment, room). Has: address, GPS, superficie, type. Never deleted — only archived. No titre or description — those live on Annonce. |
| **note_moyenne** | Average review rating for an owner (0–5). Automatically maintained by DB trigger on every avis INSERT/UPDATE/DELETE. |
| **phash** | The perceptual hash column name on the `photos` table. Used for duplicate photo detection. |
| **PostGIS** | PostgreSQL extension enabling geographic queries. `coordonnees` columns are `GEOGRAPHY(Point, 4326)`. `ST_Distance()` computes real-world distance in metres. |
| **pgcrypto** | PostgreSQL extension. `gen_random_uuid()` generates UUID primary keys. |
| **raison (Recommandation)** | A short French phrase generated by Gemini explaining why a listing was recommended. E.g. "Meublé, WiFi inclus, 1.2 km de l'USMBA". |
| **Recommandation** | An AI-generated listing suggestion for a student. Stored in DB to avoid re-calling Gemini on every search. Expires 24h after generation. |
| **score_confiance** | The fraud confidence score (SMALLINT 0–100) stored on `annonces`. |
| **Signalement** | A fraud report submitted by a student against an annonce. UNIQUE(etudiant_id, annonce_id). 3 OUVERT reports trigger auto-suspension. |
| **statut (Annonce)** | Current state of an annonce: `EN_ATTENTE / VALIDEE / REJETEE / SUSPENDUE / ARCHIVEE` |
| **TF-IDF** | Term Frequency-Inverse Document Frequency. Text similarity algorithm used to detect duplicate listing descriptions. Cosine similarity > 0.85 = duplicate. |
| **TPH** | Table Per Hierarchy. All user roles (Etudiant, Proprietaire, Admin) live in one `utilisateurs` table, differentiated by the `role` enum column. |
| **v_annonces_avec_distance** | PostgreSQL view that joins annonces + logements + universites and computes `ST_Distance` between the property and campus. Used for all geographic search queries. |
| **valide_par_ia** | Boolean on `avis`. `true` = Gemini approved the review comment. `false` = flagged for review (comment text hidden, note still counted). |
