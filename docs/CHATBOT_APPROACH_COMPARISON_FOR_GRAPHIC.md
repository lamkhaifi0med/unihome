# UniHome Chatbot — "What we were given" vs. "What we built"

> **Purpose of this file**: this is an **AI prompt / brief**. Feed it to an image or infographic
> generator (or a slide/diagram AI) to produce ONE clear graphic that explains, to teammates and jury,
> the difference between the chatbot the **encadrant/professor gave us as a starting point** and the
> chatbot we **actually engineered** for the UniHome platform.
>
> It is self-contained: everything the AI needs (the two approaches, the contrast table, the visual
> layout, the labels, the color guidance) is below.

---

## 1. One-line summary (use this as the graphic's headline)

**"Same idea — an AI that recommends real listings — but two very different engines behind it."**

- **Given to us (the prototype):** a standalone local demo that **pastes every listing into the prompt** and lets the model answer in free text. Great to prove the concept.
- **What we built (production):** a **4-layer, secured platform feature** where the model **asks a live database for exactly the data it needs**, returns **structured JSON**, and is wrapped in identity, permissions, and anti-hallucination guards.

---

## 2. The two approaches, side by side (this is the core of the graphic)

Render this as a **two-column comparison** (LEFT = what we were given, RIGHT = what we built).

### LEFT COLUMN — "Encadrant / Professor prototype" (label it: _DarIjari — the starting point_)

- **Name:** DarIjari chatbot prototype (folder `darIjari-final/`).
- **Model:** **Ollama + Mistral**, running **locally** (no API key, no cloud).
- **Grounding technique:** **Prompt-stuffing** — the code reads a static `annonces.json` file and
  **dumps ALL listings as text into one big system prompt**, then asks the model to answer.
- **Data source:** a **static JSON file** of sample listings (Berkane / ENIAD demo data).
- **Output:** **plain free text** — the model writes a paragraph mentioning listing IDs.
- **Memory:** a simple **in-process Python list** passed between calls.
- **Security / identity:** **none** — no users, no roles, no permissions.
- **Shape:** a **single standalone Python module** + a Jupyter notebook demo UI.
- **Strength:** simple, offline, zero cost, perfect to **demonstrate the idea fast**.
- **Limits:** doesn't scale (prompt grows with every listing), unreliable on negations
  ("sans réfrigérateur"), unstructured output, no security, not connected to the real platform.

### RIGHT COLUMN — "Our UniHome implementation" (label it: _UniBot — production feature_)

- **Name:** UniBot, integrated into the real UniHome platform.
- **Model:** **Google Gemini (Flash)** with **function-calling (typed tools)**.
- **Grounding technique:** **Function-calling** — the catalogue is **NOT** in the prompt. The model is
  given typed tools and **asks for exactly the data it needs**, so only matching rows reach it.
- **Data source:** the **live PostgreSQL database**, queried on demand, filtered to
  **validated listings only** (`statut = VALIDEE`).
- **Output:** **structured JSON** → the React UI turns it into **clickable listing cards** with
  trust score, reasons, and quick-reply buttons.
- **Memory:** **Redis** with a **TTL** (auto-expiring, privacy by design), degrades gracefully.
- **Security / identity:** **JWT-derived role** (student / owner / admin / anonymous), **permission
  flags** (`allowedTools`), and a **secret-protected internal API** the AI must authenticate to.
- **Shape:** a **4-layer architecture** (React → Spring Boot → FastAPI/Gemini → secure internal API → DB).
- **Strength:** scales to thousands of listings, secure, role-aware, structured, anti-hallucination.
- **Limits:** more moving parts, needs the full stack running.

---

## 3. Contrast table (render as a clean comparison table inside the graphic)

| Aspect               | Given to us (DarIjari prototype)             | What we built (UniBot)                                |
| -------------------- | -------------------------------------------- | ----------------------------------------------------- |
| AI model             | Ollama + Mistral (local)                     | Google Gemini Flash (cloud)                           |
| Grounding method     | **Prompt-stuffing** (all listings in prompt) | **Function-calling** (model requests data via tools)  |
| Listings source      | Static `annonces.json` file                  | Live PostgreSQL, queried on demand                    |
| Which listings show  | Whatever is in the file                      | **Only `VALIDEE` (validated)** listings               |
| Output format        | Plain free text                              | Structured JSON → clickable UI cards                  |
| Scalability          | ~dozens of listings                          | Thousands (only matches reach the model)              |
| Memory               | In-process Python list                       | Redis with TTL (auto-expiring)                        |
| Identity / roles     | None                                         | JWT role + permission flags (`allowedTools`)          |
| Service-to-DB safety | Model reads the file directly                | AI can't touch DB/SQL; typed, secret-protected API    |
| Anti-hallucination   | None                                         | Every listing ID UUID-validated & re-resolved from DB |
| Handles negations    | Unreliable ("sans X" confuses it)            | Reliable via `equipementsExclus` filter               |
| Project shape        | 1 standalone script + notebook demo          | 4-layer integrated platform feature                   |
| Best for             | Proving the concept fast                     | Real users on a live, secure platform                 |

---

## 4. The flow, drawn two ways (use these as the two small diagrams inside the graphic)

### LEFT flow — Prototype (prompt-stuffing)

```
User message
   │
   ▼
Python script  ── reads annonces.json ──►  pastes ALL listings into the prompt
   │
   ▼
Ollama / Mistral (local LLM)
   │
   ▼
Plain-text answer
```

### RIGHT flow — Our build (function-calling, secured)

```
User (React UniBot widget)
   │  POST /api/chatbot  (JWT attached)
   ▼
Spring Boot  ── derives role + permissions (allowedTools) ──►
   │  POST /chat
   ▼
FastAPI + Gemini (tool-calling loop)
   │  "I need to search" → calls a typed tool
   ▼
Secure Internal API  ── X-Internal-API-Key ──►  PostgreSQL (VALIDEE only)
   │  matching rows
   ▼
Gemini writes structured JSON  ──►  Spring re-resolves IDs into fresh cards
   │
   ▼
React renders reply + clickable listing cards + quick replies
```

---

## 5. The "why it matters" message (put this as a footer / takeaway band)

> The professor's prototype proved **the idea**: an AI that recommends real listings in natural language.
> We kept that idea and **re-engineered it for a real platform** — swapping _prompt-stuffing_ for
> _function-calling_ so it **scales**, wrapping it in **identity, roles, and a secret-protected API** so it's
> **secure**, and returning **structured data** so the answer becomes **clickable, trustworthy listing cards**.
>
> **We didn't just use the chatbot we were given — we turned a demo into a production feature.**

---

## 6. Design / rendering instructions for the AI generating the graphic

- **Format:** one landscape infographic (16:9), suitable for a slide.
- **Layout:** a clear **two-column split**. LEFT = "Given to us (prototype)", RIGHT = "What we built (UniBot)".
  Use a subtle divider or arrow ("evolved into →") between the columns.
- **Top:** the headline from section 1.
- **Middle:** the side-by-side bullet cards from section 2, then the small flow diagrams from section 4.
- **Optionally include** a compact version of the contrast table from section 3.
- **Bottom:** the takeaway band from section 5.
- **Color guidance:** LEFT (prototype) in a neutral / muted tone (grey-blue) to read as "starting point";
  RIGHT (our build) in the UniHome brand accent / a confident green or blue to read as "final, robust".
- **Icons to suggest:** LEFT → a single document/JSON file, a laptop (local), a text bubble.
  RIGHT → database cylinder, shield/lock (security), puzzle/tool icon (function-calling), card/grid (UI cards).
- **Tone:** clean, professional, jury-ready. Minimal text per box — the bullets above are already condensed
  to graphic-friendly phrases.
- **Language:** the graphic can be in **French** (audience is francophone). Suggested French labels:
  - LEFT title: _« Ce qu'on nous a donné » — Prototype DarIjari_
  - RIGHT title: _« Ce qu'on a construit » — UniBot (production)_
  - Divider: _« a évolué vers → »_
  - Footer: _« On n'a pas juste réutilisé le chatbot — on a transformé une démo en fonctionnalité de production. »_

```

```
