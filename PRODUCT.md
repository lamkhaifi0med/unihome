# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Students (étudiants)** in Morocco searching for verified housing near their campus. They search by university + radius (PostGIS, default 5 km), filter by budget/type/surface/equipment, view listings on an interactive Leaflet map (OSRM routes), save favorites, consult listings to reveal the owner's real contacts (phone / WhatsApp), leave reviews (1–5, one per listing, only after contacts revealed), report suspicious listings, and chat with UniBot.
- **Owners (propriétaires)** publishing listings: guided publish flow (photos 2–10, ≥1 equipment, proof document/justificatif via Cloudinary), receive an AI Trust Score with a dedicated owner-facing explanation, manage listings, track consultations, undergo CIN verification by admin (can publish before verification).
- **Admins** moderating: validate/reject listings, verify owner CINs, Trust Score dashboard, user management, handle reports (3 reports = auto-suspension), audit.
- **Secondary audience (current priority): recruiters and the developer community.** The defense is done; the immediate goal is making the repo public and posting a demo on LinkedIn. The frontend must read as portfolio-grade craft to a technical/recruiting audience, while staying truthful to the real product.

## Product Purpose

UniHome centralizes Moroccan student-housing listings **verified by AI** (Gemini Trust Scoring, 0–100), with **campus-anchored geolocated search** (PostGIS — search radiates from the student's actual university coordinates, not just a city) and the **UniBot assistant** (FR / Arabic / darija). Matching is by **direct contact** (phone / WhatsApp): the platform handles no payment, no internal messaging, no booking — those are stated perspectives.

Success right now: a public repo + LinkedIn demo where the frontend quality matches the backend/AI sophistication.

## Positioning

The mechanism a neighbor could not truthfully copy: **every listing is scored before publication by a hybrid AI pipeline** — Gemini multimodal analysis (up to 5 photos + proof document) blended with strict Python business rules that can only lower the score — across 5 weighted criteria (justificatif 35%, photos 20%, prix 20%, description 15%, cohérence 10%). Score ≥70 auto-publishes (VALIDÉE), 40–69 queues for admin (EN_ATTENTE), <40 rejects. The score produces **role-specific explanations** (student / owner / admin). Search is anchored on real campus coordinates, and distance feeds the recommendation score (≤500 m = 30 pts → 5 km = 5 pts).

## Operating Context

- Three-role SPA: 23 routes (5 auth, 7 public, 3 student, 4 owner, 4 admin). React 18 + Vite 5 + Tailwind 3, French UI.
- Backend Spring Boot 4 / Java 17; FastAPI AI service (gemini-flash-latest, same key for scoring + UniBot); PostgreSQL 15 + PostGIS 3.3; Redis 7 (chat history, ~1h TTL); Cloudinary media; JWT auth (1h, localStorage). 5 Docker containers (frontend served by Vite dev server on 5173).
- Trust badge thresholds visible to students: ≥70 "Vérifié" (green), 40–69 "En vérification" (orange), <40 "Risqué" (red).
- UniBot is tool-calling (search_annonces, get_annonce_details, get_owner_listings) against internal Spring endpoints; no RAG, no streaming; FR + Arabic + darija (no English).
- Demo/showcase context: seed data exists (backend/sql/seed_demo.sql — 6 demo owners, ~28 listings across all statuses, 41 universities). This is what a LinkedIn demo will show.

## Capabilities and Constraints

- Only VALIDÉE listings are publicly visible. Non-validated listing detail throws.
- Publish rules (code truth, not docs): photos 2–10, ≥1 equipment required, titre ≤200, description non-blank (no min length), loyer >0, ≥1 contact. Decision purely score-based — no CIN-verification override. AI unavailable → EN_ATTENTE with null score.
- Equipment catalogue: 15 fixed items (WiFi, Meublé, Cuisine équipée, …).
- Reviews: students only, one per (student, listing), require a Consultation with contacts revealed; author surname masked publicly ("Sara B.").
- Explicitly NOT built (do not imply in any surface): messaging/chat between users, booking/reservation, payment, mobile app, realtime notifications. These are honest "perspectives".
- Home.jsx exists but is not routed; `/` uses HomePreview. No 404 route.
- **Undecided:** whether/when to add an English UI (user is "thinking also English" — record as an open direction, not a commitment; design should not hard-block future i18n but need not implement it).

## Brand Commitments

- Binding: product name **UniHome** and assistant name **UniBot**. Logo remains open.
- **Standing visual preference (user-confirmed, August 2026 — supersedes all prior worlds):** Soft-depth SaaS at the craft level of Linear/Vercel 2026. Light, near-white ground with **one strong accent: electric blue (#2563EB)**; big confident typography; generous whitespace; cards with subtle borders instead of heavy shadows; glassy accents; smooth scroll-reveals and magnetic hover states. Dark sections used sparingly for drama (e.g., the AI-score explainer as a dark "terminal" band showing the pipeline). Prior directions ("Minuit → Plein Jour" Moroccan-modern, newsprint classifieds) are explicitly discarded — do not revive them. The homepage story must be understandable in under 30 seconds.
- **No seed/demo data on the homepage (user rule):** homepage visuals are stylized abstract mockups only — no real listing titles, prices, owner names, or seed photos.
- Voice so far is French, factual, trust-centered ("Vérifié", "confiance"); honesty about scope is a confirmed value (the team maintains truth-source docs precisely to avoid overclaiming).

## Evidence on Hand

- Real seed data: backend/sql/seed_demo.sql (~28 varied listings incl. rejected fraud examples, 41 real Moroccan universities), data/ecoles_superieures_maroc.csv. **Not usable on the homepage** (user rule above); available for in-app demo flows only.
- Real AI pipeline outputs: detail_score JSONB per listing + role-specific reason messages — genuine, demonstrable AI evidence (mechanism facts — weights, thresholds — may be shown on the homepage; individual listing outputs may not).
- Demo photos in frontend/public/demo-photos/ and archives/; design-assets/login_signin/ holds original design assets.
- Truth docs: docs/UNIHOME_DOSSIER_COEQUIPIER.md, docs/PRESENTATION_TRUTH_SOURCE.md.
- **No real testimonials, user counts, press, or partnerships exist — never fabricate them on any surface.**

## Product Principles

1. **Trust is the product.** The Trust Score, verification states, and honest scope boundaries are the differentiator; surfaces should make verification legible, never decorative.
2. **Campus-first, not city-first.** Distance-to-my-university is the core mental model for students; search, maps, and results should honor it.
3. **Truth over polish.** Never claim features that don't exist (messaging, booking, payment); the team's culture of truth-source docs extends to UX copy.
4. **Portfolio-grade craft.** The public repo and LinkedIn demo are judged by developers and recruiters; frontend quality must match the backend/AI sophistication.
5. **Three roles, three jobs.** Student (find + trust), owner (publish + prove), admin (moderate + audit) each get purpose-built flows, not one generic UI.

## Accessibility & Inclusion

French UI now; English UI is an open consideration (not committed). No formal WCAG target or RTL requirement established. UniBot serves FR / Arabic / darija speakers conversationally.
