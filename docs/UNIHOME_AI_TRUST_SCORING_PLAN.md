# UniHome AI Trust Scoring Plan

## 1. Objective

This document defines the target plan for evolving the current UniHome AI annonce analysis microservice into a stricter, business-grade **Annonce Trust Scoring Engine**.

The goal is not to create a generic AI assistant. The AI must stay focused on one thing only:

> Evaluate whether a specific annonce is credible enough to be shown to students, based on the annonce content, photos, price, justificatif, address coherence, and proof that the logement is legitimately connected to the owner.

The system should help three actors:

- **Students**: understand why an annonce looks trustworthy or risky.
- **Owners**: understand how to improve the annonce and provide stronger proof.
- **Admins**: review risky annonces faster with clear evidence and flags.

The scoring must be strict. An annonce should not pass just because it has a nice description or attractive photos. If it reaches `VALIDEE`, it must be because the annonce provides enough evidence of legitimacy.

---

## 2. Existing UniHome Foundation

The current platform already has a strong base for this plan.

### 2.1 Existing backend/database fields

The current `annonces` table already supports:

- `score_confiance`: global trust score from `0` to `100`.
- `detail_score`: JSONB breakdown of scoring criteria.
- `statut`: publication status: `EN_ATTENTE`, `VALIDEE`, `REJETEE`, `SUSPENDUE`, `ARCHIVEE`.
- `raison_statut`: text reason used for admin decisions or rejection notes.
- `nb_signalements`: number of reports.

The current `logements` table already supports:

- `adresse`
- `ville`
- `superficie`
- `type_logement`
- `coordonnees`
- `justificatif_url`
- `adresse_confirmee`

The current `photos` table already supports:

- `url`
- `phash`
- `est_principale`
- `ordre`

The current `proprietaire` fields already support:

- `numero_cin`
- `photo_cin_url`
- `est_verifie_cin`
- `note_moyenne`
- `nb_avis_total`
- `telephone`

### 2.2 Existing frontend usage

The frontend already uses:

- `scoreConfiance` in public listing cards.
- `scoreConfiance` in listing detail.
- `scoreConfiance` in owner dashboard.
- `detailScore` in public/admin contexts.
- Admin moderation queue already displays score and details.

This means the new plan should **not break existing frontend/backend behavior**. It should improve the meaning of the score while staying compatible.

---

## 3. Core Business Principle

The score should measure **evidence of legitimacy**, not just absence of suspicious words.

A strong annonce should prove:

1. The logement appears real.
2. The address and city are coherent.
3. The price is plausible for the student market.
4. The photos support the annonce.
5. The justificatif strongly supports the logement.
6. The justificatif appears connected to the owner name and/or logement address.

The justificatif is the major differentiator. It should have the highest weight because it is the closest evidence that the logement is legitimate and linked to the owner.

---

## 4. Scoring Philosophy

### 4.1 Current weak approach to avoid

Avoid a generous scoring style like:

> Start at `100` and subtract a few penalties.

That can let weak annonces pass if the AI misses one red flag.

### 4.2 Target strict approach

Use an evidence-based approach:

> The annonce earns trust points only when it provides clear evidence.

A vague annonce with no proof should not reach auto-validation.

### 4.3 Meaning of the thresholds

The backend already handles status decision thresholds. These thresholds are **operational gates**, not just display labels.

|   Score | Backend Status | Admin Intervention | Business Meaning                                                                    |
| ------: | -------------- | ------------------ | ----------------------------------------------------------------------------------- |
| `>= 70` | `VALIDEE`      | No                 | Auto-published because the annonce has enough evidence and no critical red flags    |
| `40–69` | `EN_ATTENTE`   | Yes                | Uncertain or incomplete evidence; admin must review manually                        |
|  `< 40` | `REJETEE`      | No                 | Auto-rejected because the annonce has major issues or strong contradictory evidence |

The AI score must be strict enough because it directly decides whether an annonce is published automatically, reviewed manually, or rejected automatically.

- `>= 70`: should only happen when the annonce seems legitimate, the price is fair, the justificatif is usable, and no critical blocker exists.
- `40–69`: should be the uncertainty zone. If the AI is not sure, the annonce belongs here.
- `< 40`: should only happen when there are strong negative signals such as clear proof mismatch, suspicious payment language, invalid proof, or severe incoherence.

### 4.4 Conservative handling of uncertainty

The scoring engine must be conservative at both automatic edges:

- Do **not** auto-publish uncertain annonces.
- Do **not** auto-reject uncertain annonces.
- Put uncertainty in `EN_ATTENTE` so the admin can decide.

Examples that should usually land in `EN_ATTENTE` instead of `VALIDEE` or `REJETEE`:

- justificatif present but unreadable
- no justificatif but no fraud signal
- only two photos but no other major issue
- address partially visible on the justificatif but not enough to confirm
- Gemini is uncertain about document type
- price is low but still plausible
- photos are limited but not suspicious

---

## 5. Recommended Score Breakdown

Keep a global `scoreGlobal` from `0` to `100`.

Use this weighted breakdown:

| Criterion      | Weight | Purpose                                                                          |
| -------------- | -----: | -------------------------------------------------------------------------------- |
| `justificatif` |   `35` | Proves or supports legitimacy of logement/owner/address                          |
| `photos`       |   `20` | Shows whether the logement appears real and coherent                             |
| `prix`         |   `20` | Detects unrealistic or unfair pricing                                            |
| `description`  |   `15` | Checks completeness and suspicious wording                                       |
| `coherence`    |   `10` | Checks whether title, description, photos, price, address and proof fit together |

Total: `100`.

The existing `detail_score` JSONB can store these exact numeric fields.

Example:

```json
{
  "justificatif": 92,
  "photos": 80,
  "prix": 76,
  "description": 74,
  "coherence": 82
}
```

---

## 6. Justificatif Logic — The Most Important Layer

### 6.1 Why justificatif has the highest weight

The justificatif is the strongest proof that the logement is real and connected to the owner or address.

A good justificatif can be:

- ONEE bill
- Redal bill
- Amendis bill
- water/electricity utility bill
- property ownership document
- rental authorization document
- other Moroccan housing-related proof

The AI must not make legal claims like:

> “This owner owns the property.”

Instead, it should say:

> “The uploaded justificatif appears consistent with the owner name and logement address.”

This is safer and more professional.

### 6.2 Justificatif scoring

| Situation                                                                             | Score Range | Business Meaning                     |
| ------------------------------------------------------------------------------------- | ----------: | ------------------------------------ |
| Clear document, Moroccan housing-related, owner name matches, address appears related |    `90–100` | Strong proof                         |
| Clear document, housing-related, address related, name not visible                    |     `70–85` | Good proof but incomplete            |
| Clear document, housing-related, owner name partially matches                         |     `70–90` | Useful but needs caution             |
| Document present but type uncertain                                                   |     `50–69` | Admin should review                  |
| Document blurry/unreadable                                                            |     `20–45` | Cannot rely on it                    |
| No document                                                                           |      `0–35` | Not enough proof for auto-validation |
| Clear name mismatch with owner                                                        |      `0–20` | Critical risk                        |
| Clear address mismatch with annonce                                                   |      `0–25` | Critical risk                        |

### 6.3 Justificatif extraction target

Gemini should extract only annonce-relevant proof data:

```json
{
  "documentType": "FACTURE_ONEE",
  "isReadable": true,
  "detectedName": "Mohamed El Amrani",
  "ownerNameMatches": true,
  "detectedAddress": "Quartier Atlas, Fes",
  "addressSeemsRelated": true,
  "proofStrength": "STRONG"
}
```

Possible `documentType` values:

- `FACTURE_ONEE`
- `FACTURE_REDAL`
- `FACTURE_AMENDIS`
- `FACTURE_EAU_ELECTRICITE`
- `ACTE_PROPRIETE`
- `AUTORISATION_LOCATION`
- `DOCUMENT_LOGEMENT_INCERTAIN`
- `NON_LOGEMENT`
- `ILLISIBLE`
- `ABSENT`

Possible `proofStrength` values:

- `STRONG`
- `MEDIUM`
- `WEAK`
- `INVALID`

### 6.4 Justificatif critical rules

These rules should cap or block the score:

| Condition                           |                                               Cap / Effect |
| ----------------------------------- | ---------------------------------------------------------: |
| No justificatif                     |                                        `scoreGlobal <= 69` |
| Justificatif unreadable             |                                        `scoreGlobal <= 69` |
| Justificatif not related to housing |                                        `scoreGlobal <= 55` |
| Clear owner name mismatch           |                                        `scoreGlobal <= 39` |
| Clear address mismatch              |                                        `scoreGlobal <= 39` |
| Strong matching justificatif        | Allows score to exceed `70` if other layers are acceptable |

This ensures that no annonce auto-passes without credible proof.

---

## 7. Photos Logic

### 7.1 What photos should prove

Photos should support that the logement is real and coherent with the annonce.

The AI should check:

- Are photos clear?
- Do they look like a real logement?
- Do they show different useful parts?
- Do they seem from the same place?
- Are there watermarks or agency logos?
- Do they look like stock images?
- Do they look AI-generated?
- Are they coherent with the title and description?

### 7.2 Photos scoring

| Situation                                       |      Score Range |
| ----------------------------------------------- | ---------------: |
| 5+ clear coherent photos showing multiple rooms |         `85–100` |
| 3–4 clear coherent photos                       |          `70–85` |
| 2 acceptable photos                             |          `55–70` |
| 1 photo                                         |          `25–45` |
| No photos                                       |           `0–15` |
| Blurry/dark photos                              | subtract `10–25` |
| Watermark or agency logo                        | subtract `15–30` |
| Inconsistent places                             |      cap at `60` |
| Stock-like or AI-generated                      |      cap at `55` |

### 7.3 pHash integration

The existing `photos.phash` field can support duplicate detection.

Backend can compare uploaded photo hashes against existing validated annonces and send a field to the AI service:

```json
"duplicates": {
  "duplicatePhotoFound": true,
  "duplicatePhotoCount": 1
}
```

If `duplicatePhotoFound = true`, apply:

- `photos <= 50`
- `scoreGlobal <= 60`
- flag: `PHOTO_DUPLIQUEE`

---

## 8. Price Logic

### 8.1 Why price matters

Scams often use prices that are too attractive. Overpriced annonces are not always fraud, but they are bad for student trust.

### 8.2 Current compatible approach

If the backend cannot yet provide market median data, use strict fallback ranges by Moroccan student housing reality.

Basic fallback:

|           Price | Interpretation                                             |
| --------------: | ---------------------------------------------------------- |
|     `< 800 MAD` | Highly suspicious                                          |
|  `800–1499 MAD` | Suspicious unless room/shared housing and city supports it |
| `1500–6000 MAD` | Generally plausible                                        |
|    `> 6000 MAD` | Over target for student market, not necessarily fraud      |

### 8.3 Better future approach

Backend should calculate and send market context:

```json
"market": {
  "medianPrice": 1800,
  "sampleSize": 24,
  "cityTypeMedianAvailable": true
}
```

Then score based on deviation:

| Price vs Median     | Price Score |
| ------------------- | ----------: |
| Within ±30%         |    `80–100` |
| 30–50% below median |     `50–70` |
| >50% below median   |     `10–40` |
| 30–70% above median |     `55–75` |
| >100% above median  |     `35–60` |

### 8.4 Price caps

| Condition                                |                                   Cap / Effect |
| ---------------------------------------- | ---------------------------------------------: |
| Extremely low price without strong proof |                            `scoreGlobal <= 55` |
| Very low price with strong proof         |                            `scoreGlobal <= 69` |
| Slightly low price                       |                      flag only or admin review |
| Very overpriced                          | lower price score, but not automatic rejection |

---

## 9. Description Logic

### 9.1 What description should prove

The description should be specific enough for a student to understand the logement.

It should mention, when possible:

- type of logement
- rooms/space
- furniture
- charges
- proximity to university or transport
- living conditions
- visit possibility

### 9.2 Suspicious language

Strong fraud indicators:

- `western union`
- `mandat cash`
- `avance avant visite`
- `caution avant visite`
- `je suis à l'étranger`
- `propriétaire absent`
- `envoyez l'argent`
- `transférez l'argent`
- `pas de visite possible`
- `urgent urgent`
- `contact email seulement`

### 9.3 Description scoring

| Situation                                                  | Score Range |
| ---------------------------------------------------------- | ----------: |
| Detailed, specific, annonce-focused, no suspicious wording |    `80–100` |
| Acceptable but missing details                             |     `60–79` |
| Very short or generic                                      |     `35–59` |
| Contradictory with photos or price                         |     `20–50` |
| Suspicious payment/urgency language                        |      `0–35` |

### 9.4 Description caps

| Condition                        |                                            Cap / Effect |
| -------------------------------- | ------------------------------------------------------: |
| Strong payment scam language     |                                     `scoreGlobal <= 39` |
| Owner abroad / no visit possible |                                     `scoreGlobal <= 55` |
| Very short description           | `scoreGlobal <= 69` unless proof/photos are very strong |

---

## 10. Coherence Logic

### 10.1 Purpose

`coherence` is the AI intelligence layer. It checks whether all annonce elements make sense together.

It should remain annonce-only.

### 10.2 Coherence checks

The AI should check:

- Title matches description.
- Photos match the described logement type.
- City/address aligns with justificatif if visible.
- Price aligns with type/surface/city.
- Justificatif appears related to the logement.
- Photos do not contradict each other.
- Description does not claim equipment that photos clearly contradict.

### 10.3 Coherence scoring

| Situation                                                  | Score Range |
| ---------------------------------------------------------- | ----------: |
| All elements consistent                                    |    `80–100` |
| Minor missing info but no contradiction                    |     `65–79` |
| Some uncertainty or vague info                             |     `45–64` |
| Clear contradiction between fields                         |     `20–44` |
| Critical contradiction involving justificatif/address/name |      `0–25` |

---

## 11. Flags and Severity

Flags make the score actionable for backend, admin UI, owner UX, and future analytics.

### 11.1 Flag object format

```json
{
  "code": "JUSTIFICATIF_NOM_DIFFERENT",
  "severity": "CRITICAL",
  "label": "Le nom visible sur le justificatif ne correspond pas au propriétaire"
}
```

### 11.2 Severity levels

| Severity   | Meaning                                  | Effect                                      |
| ---------- | ---------------------------------------- | ------------------------------------------- |
| `CRITICAL` | Strong evidence of invalid/risky annonce | Cannot be `VALIDEE`; usually `REJETEE`      |
| `HIGH`     | Serious risk or missing critical proof   | Cannot auto-pass; admin review or rejection |
| `MEDIUM`   | Needs review or improvement              | Usually `EN_ATTENTE` if score is not strong |
| `LOW`      | Minor improvement                        | Can still be `VALIDEE` if score is strong   |

### 11.3 Recommended flag codes

Justificatif flags:

- `JUSTIFICATIF_ABSENT`
- `JUSTIFICATIF_ILLISIBLE`
- `JUSTIFICATIF_TYPE_INCERTAIN`
- `JUSTIFICATIF_NON_LOGEMENT`
- `JUSTIFICATIF_NOM_CORRESPOND`
- `JUSTIFICATIF_NOM_PARTIEL`
- `JUSTIFICATIF_NOM_DIFFERENT`
- `JUSTIFICATIF_ADRESSE_CORRESPOND`
- `JUSTIFICATIF_ADRESSE_DIFFERENTE`

Photos flags:

- `PHOTOS_INSUFFISANTES`
- `PHOTOS_FLOUES`
- `PHOTOS_COHERENTES`
- `PHOTOS_INCOHERENTES`
- `PHOTO_WATERMARK`
- `PHOTO_STOCK_SUSPECTE`
- `PHOTO_IA_SUSPECTE`
- `PHOTO_DUPLIQUEE`

Price flags:

- `PRIX_COHERENT`
- `PRIX_LEGEREMENT_BAS`
- `PRIX_TROP_BAS`
- `PRIX_TROP_ELEVE`

Description flags:

- `DESCRIPTION_COMPLETE`
- `DESCRIPTION_A_COMPLETER`
- `DESCRIPTION_TROP_COURTE`
- `LANGAGE_PAIEMENT_SUSPECT`
- `PROPRIETAIRE_ABSENT_MENTIONNE`
- `VISITE_IMPOSSIBLE_MENTIONNEE`

Coherence flags:

- `ANNONCE_COHERENTE`
- `INCOHERENCE_TITRE_DESCRIPTION`
- `INCOHERENCE_PHOTOS_DESCRIPTION`
- `INCOHERENCE_PRIX_TYPE`
- `INCOHERENCE_ADRESSE_JUSTIFICATIF`

---

## 12. Decision Recommendation

The backend remains the final executor, but the microservice should return a recommended decision that mirrors the operational gate implied by the score.

This is important because UniHome has automatic outcomes:

- `VALIDEE` means the annonce is published automatically with no admin intervention.
- `EN_ATTENTE` means the annonce enters the admin moderation queue.
- `REJETEE` means the annonce is rejected automatically with no admin intervention.

```json
"decisionRecommandee": "EN_ATTENTE"
```

Allowed values:

- `VALIDEE`
- `EN_ATTENTE`
- `REJETEE`

### 12.1 Basic threshold logic

```text
scoreGlobal >= 70  -> VALIDEE     -> auto-published, no admin intervention
scoreGlobal 40–69  -> EN_ATTENTE  -> admin review required
scoreGlobal < 40   -> REJETEE     -> auto-rejected, no admin intervention
```

Because the outer zones are automatic, the scoring engine must avoid false positives and false negatives:

- A risky annonce must not accidentally reach `70`.
- An uncertain annonce must not be pushed below `40` unless the negative evidence is strong.
- Ambiguous cases should remain in `40–69`.

### 12.2 Strict decision rules

The recommendation must also consider critical flags and uncertainty.

Rules:

- If any `CRITICAL` flag exists, decision cannot be `VALIDEE`.
- If `JUSTIFICATIF_NOM_DIFFERENT`, recommend `REJETEE`.
- If `JUSTIFICATIF_ADRESSE_DIFFERENTE`, recommend `REJETEE` or `EN_ATTENTE` depending certainty.
- If `LANGAGE_PAIEMENT_SUSPECT`, recommend `REJETEE`.
- If no justificatif, decision cannot be `VALIDEE`.
- If justificatif is unreadable, decision cannot be `VALIDEE`.
- If duplicate/stolen photo suspected, decision cannot be `VALIDEE`.
- If price is extremely low and proof is weak, decision cannot be `VALIDEE`.
- If the evidence is incomplete or uncertain, prefer `EN_ATTENTE` over automatic rejection.
- If confidence is `LOW`, decision cannot be `VALIDEE`.

### 12.3 Backend integration

Backend can keep existing threshold logic. Hard blockers from AI flags should normally be reflected through score caps before status assignment. For example, a clear justificatif name mismatch should cap the score below `40`, making the annonce auto-rejected by the normal threshold rule.

```text
if scoreGlobal >= 70 and no CRITICAL/HIGH blocking flags:
  statut = VALIDEE      # auto-published
elif scoreGlobal < 40:
  statut = REJETEE      # auto-rejected
else:
  statut = EN_ATTENTE   # admin review
```

This preserves current backend control while making AI recommendations business-aware and consistent with the automatic publication/rejection workflow.

---

## 13. AI Insights Scope

The AI insights must stay strictly about the annonce.

### 13.1 Allowed insights

Allowed:

- quality of photos
- clarity of description
- price plausibility
- justificatif readability
- visible name/address consistency
- annonce completeness
- coherence between annonce elements
- concrete improvements for the annonce

### 13.2 Forbidden insights

Forbidden:

- personal judgment about the owner
- legal guarantee of ownership
- financial advice
- telling students to pay or not pay
- broad safety advice unrelated to the annonce
- claims that the logement is certainly owned by the person
- speculation outside provided data

### 13.3 Safe wording examples

Good:

> Le justificatif fourni semble lisible et le nom détecté paraît cohérent avec le propriétaire indiqué.

Bad:

> Le propriétaire possède bien ce logement.

Good:

> Le prix est plausible pour un logement étudiant de ce type à Fès.

Bad:

> C'est une excellente affaire et l'étudiant devrait réserver rapidement.

---

## 14. Recommended Response Format

The microservice should evolve toward this response format:

```json
{
  "scoreGlobal": 82,
  "decisionRecommandee": "VALIDEE",
  "confidenceLevel": "HIGH",
  "detailScore": {
    "justificatif": 94,
    "photos": 82,
    "prix": 78,
    "description": 74,
    "coherence": 80
  },
  "flags": [
    {
      "code": "JUSTIFICATIF_NOM_CORRESPOND",
      "severity": "LOW",
      "label": "Le nom visible sur le justificatif semble correspondre au propriétaire"
    },
    {
      "code": "PRIX_COHERENT",
      "severity": "LOW",
      "label": "Le prix semble cohérent avec l'annonce"
    }
  ],
  "studentInsight": "L'annonce présente de bons signaux: les photos sont cohérentes, le prix semble plausible et un justificatif lisible soutient le lien avec le logement.",
  "ownerAdvice": "L'annonce est solide. Pour renforcer encore la confiance, ajoutez une photo supplémentaire de la salle de bain ou de l'entrée.",
  "adminNote": "Justificatif lisible avec nom cohérent. Aucun signal critique détecté; validation possible si les informations visibles correspondent au dossier."
}
```

---

## 15. Database Integration Plan

### 15.1 Phase 1 — No database migration

Keep current storage:

- `scoreGlobal` -> `annonces.score_confiance`
- `detailScore` -> `annonces.detail_score`
- admin/backend rejection reason -> `annonces.raison_statut`

This is enough to begin strict scoring.

Example `detail_score` JSONB:

```json
{
  "justificatif": 94,
  "photos": 82,
  "prix": 78,
  "description": 74,
  "coherence": 80
}
```

### 15.2 Phase 2 — Add AI analysis JSONB column

Add one clean JSONB column later:

```sql
ALTER TABLE annonces ADD COLUMN analyse_ia jsonb;
CREATE INDEX idx_annonces_analyse_ia ON annonces USING gin (analyse_ia);
```

This avoids many extra columns and keeps the database flexible.

`analyse_ia` stores:

```json
{
  "decisionRecommandee": "VALIDEE",
  "confidenceLevel": "HIGH",
  "flags": [],
  "studentInsight": "...",
  "ownerAdvice": "...",
  "adminNote": "...",
  "justificatifAnalysis": {
    "documentType": "FACTURE_ONEE",
    "isReadable": true,
    "detectedName": "...",
    "ownerNameMatches": true,
    "detectedAddress": "...",
    "addressSeemsRelated": true,
    "proofStrength": "STRONG"
  }
}
```

### 15.3 Backend entity update for Phase 2

Add to `Annonce` entity:

```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(name = "analyse_ia", columnDefinition = "jsonb")
private Map<String, Object> analyseIa;
```

### 15.4 DTO update for Phase 2

Add to DTOs where useful:

- public listing detail: include safe `studentInsight`, `flags` summary if desired.
- owner listing detail/dashboard: include `ownerAdvice`.
- admin moderation DTO: include full `analyseIa`.

Do not expose `adminNote` publicly to students.

---

## 16. Backend Integration Plan

### 16.1 Request sent from Spring Boot to FastAPI

The backend should send only annonce-relevant data.

Recommended request:

```json
{
  "annonceId": "uuid",
  "titre": "Studio meublé proche USMBA Fès",
  "description": "Beau studio...",
  "prix": 1800,
  "ville": "Fes",
  "adresse": "Quartier Atlas, Fes",
  "typeLogement": "STUDIO",
  "surface": 32,
  "chargesIncluses": true,
  "photoUrls": ["https://res.cloudinary.com/..."],
  "justificatifUrl": "https://res.cloudinary.com/...",
  "proprietaireNomComplet": "Mohamed El Amrani",
  "proprietaireVerifieCin": true,
  "noteProprietaire": 4.5,
  "nbAvisProprietaire": 6,
  "duplicates": {
    "duplicatePhotoFound": false,
    "duplicatePhotoCount": 0,
    "similarTextFound": false
  },
  "market": {
    "medianPrice": 1800,
    "sampleSize": 24
  }
}
```

### 16.2 Data already available in backend

From `Annonce`:

- `titre`
- `description`
- `loyer`
- `chargesIncluses`

From `Logement`:

- `ville`
- `adresse`
- `superficie`
- `typeLogement`
- `justificatifUrl`

From `PhotoRepository`:

- ordered `photoUrls`
- `phash` values for duplicate detection

From `Proprietaire`:

- `nom`
- `prenom`
- `estVerifieCin`
- `noteMoyenne`
- `nbAvisTotal`

Optional/future:

- duplicate photo count from pHash comparison
- similar text detection
- median price by city/type

### 16.3 Backend decision handling

Backend continues to own final status assignment and applies UniHome's automatic gate policy.

There is no admin intervention outside the `40–69` score range:

- `>= 70`: auto-publish as `VALIDEE`.
- `40–69`: send to admin queue as `EN_ATTENTE`.
- `< 40`: auto-reject as `REJETEE`.

Recommended backend behavior:

```text
1. Call AI service.
2. Save scoreGlobal in score_confiance.
3. Save detailScore in detail_score.
4. Save analyseIa if column exists.
5. Ensure AI hard blockers already affected the score through caps.
6. Apply final status:
  - If score >= 70 and no blocking flags: VALIDEE (auto-published)
  - Else if score < 40: REJETEE (auto-rejected)
  - Else: EN_ATTENTE (admin review)
7. If owner CIN is not verified: force EN_ATTENTE regardless of score.
8. If AI service unavailable: EN_ATTENTE with score_confiance = null.
```

This keeps the backend as the authority while allowing AI to provide a strict recommendation. The AI score must therefore be calibrated carefully because it controls automatic publication and automatic rejection.

---

## 17. FastAPI Microservice Integration Plan

### 17.1 Keep current endpoint or add v2

Current endpoint:

```text
POST /analyze-listing
```

Recommended safer evolution:

```text
POST /v2/analyze-listing
```

This lets the backend migrate gradually without breaking existing calls.

### 17.2 Update Pydantic models

Add:

- `decisionRecommandee`
- `confidenceLevel`
- `flags`
- `studentInsight`
- `ownerAdvice`
- `adminNote`
- richer request fields
- optional `duplicates`
- optional `market`

### 17.3 Split scoring responsibilities

Python deterministic logic should calculate:

- suspicious keyword penalties
- description length score
- photo count score
- price fallback or median-based score
- caps and blockers
- final weighted score
- decision recommendation

Gemini should analyze:

- photo realism/coherence
- justificatif readability/type/name/address
- semantic coherence of annonce
- whether text sounds suspicious beyond keyword matching

This gives stable scoring while preserving AI value.

### 17.4 Gemini output should be evidence, not final score only

Gemini should return structured evidence like:

```json
{
  "visualAnalysis": {
    "photosClear": true,
    "photosCoherent": true,
    "watermarkDetected": false,
    "stockPhotoSuspected": false,
    "aiGeneratedSuspected": false
  },
  "justificatifAnalysis": {
    "documentType": "FACTURE_ONEE",
    "isReadable": true,
    "detectedName": "Mohamed El Amrani",
    "ownerNameMatches": true,
    "detectedAddress": "Quartier Atlas, Fes",
    "addressSeemsRelated": true,
    "proofStrength": "STRONG"
  },
  "coherenceAnalysis": {
    "titleDescriptionCoherent": true,
    "photosDescriptionCoherent": true,
    "priceSeemsPlausible": true,
    "criticalContradiction": false
  }
}
```

Then Python calculates the score.

---

## 18. Frontend Integration Plan

### 18.1 Student UI

Students should see simple, calm, annonce-focused insight.

Public listing detail can show:

- global score badge
- short `studentInsight`
- maybe top 2 positive/negative flags

Example:

> Score de confiance élevé. Photos cohérentes, prix plausible, justificatif fourni.

Do not expose admin-only notes.

### 18.2 Owner UI

Owner dashboard and listing details can show:

- score
- `ownerAdvice`
- recommended improvements
- flags that are safe and actionable

Example:

> Ajoutez une photo de la salle de bain et précisez si les charges sont incluses.

This makes AI feel like a coach, not just a judge.

### 18.3 Admin UI

Admin moderation should show:

- global score
- full `detailScore`
- `decisionRecommandee`
- `adminNote`
- all flags with severity
- justificatif analysis summary

Admin queue can be sorted by:

1. `CRITICAL` flags
2. score ascending
3. low confidence
4. date created

---

## 19. Confidence Level

Add a confidence level to prevent false certainty.

Allowed values:

- `HIGH`
- `MEDIUM`
- `LOW`

### 19.1 Rules

`HIGH` when:

- justificatif readable
- photos sufficient
- description complete
- no major uncertainty

`MEDIUM` when:

- some proof exists but incomplete
- photos or description missing details
- market data unavailable

`LOW` when:

- no justificatif
- too few photos
- unreadable document
- contradictory evidence

A score with `LOW` confidence should not auto-pass unless business rules explicitly allow it. Recommended: `LOW` confidence caps score at `69`.

---

## 20. Security and Reliability Requirements

Security hardening is important, but it is **not a blocker for the first scoring implementation**. The immediate priority is to make the scoring logic, AI output, backend gate behavior, and moderation workflow work correctly end-to-end.

Once the business flow is stable, apply the hardening tasks below before deployment or final delivery.

### 20.1 API key management

The Gemini API key must not be hardcoded.

Use:

```python
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
```

The exposed key should be revoked and replaced.

### 20.2 Internal service authentication

FastAPI should require an internal key:

```text
X-UniHome-AI-Key: <secret>
```

Spring Boot sends it. FastAPI validates it.

### 20.3 Restrict asset URLs

The microservice downloads remote files. To prevent SSRF, allow only trusted domains, mainly Cloudinary.

Example allowed domains:

- `res.cloudinary.com`
- your configured Cloudinary subdomain

Reject or ignore other URLs.

### 20.4 Timeout fallback

If AI service fails:

- backend sets `statut = EN_ATTENTE`
- `score_confiance = null`
- admin sees “Analyse IA en attente”
- owner sees “Votre annonce est en cours d'analyse”

This matches the UniHome Bible and avoids blocking publication entirely.

---

## 21. Implementation Phases

### Phase 1 — Strict scoring without DB migration

- Update FastAPI prompt and response to stricter scoring.
- Keep response compatible: `scoreGlobal`, `detailScore`, `raisonnement`.
- Calibrate scoring around UniHome's automatic gates:
  - `>= 70` must be safe enough for auto-publication.
  - `40–69` is the admin review uncertainty zone.
  - `< 40` must be reserved for strong rejection evidence.
- Change weights:
  - justificatif `35`
  - photos `20`
  - prix `20`
  - description `15`
  - coherence `10`
- Add caps:
  - no justificatif -> max `69`
  - unreadable justificatif -> max `69`
  - name/address mismatch -> max `39`
  - suspicious payment language -> max `39`
- Backend continues storing existing fields.

### Phase 2 — Rich AI analysis response

- Add response fields:
  - `decisionRecommandee`
  - `confidenceLevel`
  - `flags`
  - `studentInsight`
  - `ownerAdvice`
  - `adminNote`
- Frontend consumes safe parts where useful.
- Backend can still ignore new fields until DB is ready.

### Phase 3 — Add `analyse_ia` JSONB

- Add `annonces.analyse_ia` column.
- Store full AI insights.
- Update admin moderation DTO to include full analysis.
- Update public detail DTO to expose only student-safe fields.
- Update owner DTO to expose owner advice.

### Phase 4 — Backend context enrichment

- Send richer context to FastAPI:
  - address
  - type logement
  - surface
  - charges included
  - owner name
  - CIN verified flag
  - owner rating
  - photo duplicate info
  - market median if available

### Phase 5 — Deterministic scoring engine

- Move more scoring from prompt to Python functions.
- Use Gemini for visual/document evidence extraction.
- Use Python for scoring, caps, flags, and decision recommendation.

---

## 22. Final Target Behavior Examples

### 22.1 Strong annonce

Input evidence:

- 5 clear photos
- price coherent
- good description
- readable ONEE bill
- owner name visible and matching
- address appears related

Output:

```json
{
  "scoreGlobal": 86,
  "decisionRecommandee": "VALIDEE",
  "confidenceLevel": "HIGH",
  "detailScore": {
    "justificatif": 95,
    "photos": 84,
    "prix": 80,
    "description": 76,
    "coherence": 85
  },
  "flags": [
    {
      "code": "JUSTIFICATIF_NOM_CORRESPOND",
      "severity": "LOW",
      "label": "Le justificatif semble cohérent avec le propriétaire indiqué"
    }
  ],
  "studentInsight": "L'annonce présente des signaux solides: photos cohérentes, prix plausible et justificatif lisible lié au logement.",
  "ownerAdvice": "L'annonce est solide. Vous pouvez encore renforcer la confiance en ajoutant une photo de l'entrée ou de la salle de bain.",
  "adminNote": "Aucun signal critique. Justificatif lisible et cohérent; validation possible."
}
```

### 22.2 Medium annonce needing admin review

Input evidence:

- 2 photos only
- price slightly low
- description acceptable
- justificatif present but unreadable

Output:

```json
{
  "scoreGlobal": 58,
  "decisionRecommandee": "EN_ATTENTE",
  "confidenceLevel": "MEDIUM",
  "detailScore": {
    "justificatif": 42,
    "photos": 58,
    "prix": 62,
    "description": 68,
    "coherence": 60
  },
  "flags": [
    {
      "code": "JUSTIFICATIF_ILLISIBLE",
      "severity": "HIGH",
      "label": "Le justificatif est présent mais difficile à lire"
    },
    {
      "code": "PHOTOS_INSUFFISANTES",
      "severity": "MEDIUM",
      "label": "Le nombre de photos est limité"
    }
  ],
  "studentInsight": "L'annonce contient quelques éléments utiles, mais le justificatif n'est pas assez lisible et les photos restent limitées.",
  "ownerAdvice": "Téléversez un justificatif plus clair et ajoutez plusieurs photos du logement pour accélérer la validation.",
  "adminNote": "Revue manuelle recommandée: preuve illisible et photos limitées."
}
```

### 22.3 Bad annonce

Input evidence:

- price extremely low
- suspicious payment language
- justificatif with different name
- photos generic

Output:

```json
{
  "scoreGlobal": 28,
  "decisionRecommandee": "REJETEE",
  "confidenceLevel": "HIGH",
  "detailScore": {
    "justificatif": 10,
    "photos": 35,
    "prix": 20,
    "description": 15,
    "coherence": 20
  },
  "flags": [
    {
      "code": "JUSTIFICATIF_NOM_DIFFERENT",
      "severity": "CRITICAL",
      "label": "Le nom visible sur le justificatif ne correspond pas au propriétaire indiqué"
    },
    {
      "code": "LANGAGE_PAIEMENT_SUSPECT",
      "severity": "CRITICAL",
      "label": "La description contient une demande de paiement suspecte"
    }
  ],
  "studentInsight": "L'annonce présente des incohérences importantes entre le justificatif, le prix et les informations de publication.",
  "ownerAdvice": "Fournissez un justificatif lisible et cohérent avec votre nom, puis retirez toute mention de paiement avant visite.",
  "adminNote": "Rejet recommandé: incohérence critique sur le justificatif et langage de paiement suspect."
}
```

---

## 23. Final Recommendation

UniHome should position this system as:

> A strict annonce credibility engine that checks proof, coherence, price and visual evidence before students see the listing.

This is stronger than a generic AI fraud score.

The strongest business differentiator is:

> Owners earn visibility by proving the annonce. Students trust UniHome because weak or unproven annonces do not auto-pass.

The AI should remain focused, strict, and annonce-only.
