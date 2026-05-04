# ARCHITECTURE DÉTAILLÉE - UNIHOME API PHASE 1
## Document Technique pour Développeurs

---

## 1. FLUX COMPLET: De la Publication d'Annonce à sa Découverte

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ACTEUR: Propriétaire                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ ENDPOINT: POST /api/annonces/publier                                        │
│ ├─ Body: AnnonceRequestDTO (multipart/form-data)                            │
│ │  ├─ logementId: UUID                                                      │
│ │  ├─ titre: String (max 200)                                               │
│ │  ├─ description: String (TEXT)                                            │
│ │  ├─ loyer: BigDecimal                                                     │
│ │  ├─ chargesIncluses: Boolean                                              │
│ │  ├─ contacts: List<ContactAnnonceDTO>                                     │
│ │  │  └─ [plateforme: TELEPHONE|WHATSAPP|... | valeur: String]             │
│ │  └─ photos: List<MultipartFile> (2-10 fichiers)                          │
│ └─ Controller: AnnonceController.publierAnnonce()                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER: Service - AnnonceService.creerAnnonce(logementId, requestDTO)        │
│                                                                              │
│ Step 1: Récupérer le Logement                                               │
│  └─ LogementRepository.findById(logementId)                                 │
│     ├─ Si absent → EntityNotFoundException                                  │
│     └─ Si présent → Lier à l'Annonce                                        │
│                                                                              │
│ Step 2: Mapper le DTO → Entité Annonce                                      │
│  ├─ mapToAnnonceEntity(requestDTO)                                          │
│  └─ Annonce: titre, description, loyer, chargesIncluses                     │
│                                                                              │
│ Step 3: Appeler le service de détection de fraude (Python)                  │
│  ├─ WebClient.post() → http://localhost:8000/analyze-listing                │
│  ├─ Envoyer: {titre, description, loyer}                                    │
│  ├─ Recevoir: FraudScoreResponse {scoreGlobal, detailScore}                │
│  ├─ Gestion d'erreur:                                                       │
│  │  ├─ Si service indisponible → .onErrorResume()                           │
│  │  ├─ Fallback: scoreGlobal = 0, status = EN_ATTENTE                      │
│  │  └─ Log: WARN level                                                      │
│  └─ Résultat: scoreGlobal (0-100)                                           │
│                                                                              │
│ Step 4: Appliquer la logique de scoring 3-niveaux                           │
│  ├─ si scoreGlobal >= 70 → statut = VALIDEE      ✅ Publiée immédiatement   │
│  ├─ si scoreGlobal 40-69 → statut = EN_ATTENTE   ⏳ En attente modération   │
│  └─ si scoreGlobal < 40 → statut = REJETEE       ❌ Rejetée                 │
│                                                                              │
│ Step 5: Initialiser les métadonnées                                         │
│  ├─ datePublication = NOW()                                                 │
│  ├─ nbSignalements = 0                                                      │
│  ├─ scoreConfiance = scoreGlobal                                            │
│  ├─ detailScore = JSON {identite, texte, photos, prix}                     │
│  └─ dateExpiration = (DB trigger: publication + 90 jours)                  │
│                                                                              │
│ Step 6: Sauvegarder l'Annonce                                              │
│  └─ AnnonceRepository.save(annonce)                                         │
│     └─ ✅ UUID id généré + timestamps insérés                              │
│                                                                              │
│ Step 7: Ajouter les contacts                                                │
│  ├─ ContactAnnonceService.ajouterContacts(annonce, contacts)               │
│  ├─ Valider: plateforme (NOT NULL) + valeur (NOT BLANK)                    │
│  ├─ Lier chaque ContactAnnonce à l'Annonce                                  │
│  └─ ContactAnnonceRepository.saveAll(contacts)                              │
│                                                                              │
│ Step 8: Uploader les photos vers Cloudinary                                 │
│  ├─ validatePhotoCount(photos) → Lance IllegalArgumentException si < 2      │
│  │                            → Lance IllegalArgumentException si > 10      │
│  ├─ Pour chaque photo MultipartFile:                                        │
│  │  ├─ PhotoService.uploaderPhoto(file, annonce)                            │
│  │  ├─ Cloudinary.uploader().upload(bytes)                                  │
│  │  ├─ Extraire URL (secure_url OU url)                                     │
│  │  ├─ Créer Photo entity                                                   │
│  │  ├─ phash = NULL (TODO: pHash calculation)                               │
│  │  ├─ estPrincipale = false                                                │
│  │  ├─ ordre = 1                                                            │
│  │  └─ PhotoRepository.save(photo)                                          │
│  └─ TODO: Implémenter phash pour détection de doublons                     │
│                                                                              │
│ Step 9: (Optional) Créer une Consultation auto                              │
│  └─ Note: Consultation.etudiant + Consultation.annonce (pour stats)         │
│                                                                              │
│ Attribute: @Transactional                                                   │
│  └─ Si erreur à any step → ROLLBACK de tout                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ RESPONSE: 201 Created                                                       │
│ └─ Body: Annonce JSON                                                       │
│    ├─ id: UUID                                                              │
│    ├─ titre, description, loyer, chargesIncluses                            │
│    ├─ statut: VALIDEE|EN_ATTENTE|REJETEE                                   │
│    ├─ scoreConfiance: Short (0-100)                                         │
│    ├─ detailScore: JSON String                                              │
│    ├─ datePublication, dateExpiration, createdAt, updatedAt                 │
│    └─ logement: { id, adresse, ville, coordonnees }                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. FLUX DE RECHERCHE: Trouver Les Annonces Actives

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ACTEUR: Étudiant                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ ENDPOINT: GET /api/annonces/recherche                                       │
│ └─ Controller: AnnonceController.rechercherAnnonces()                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYER: Service - AnnonceService.getAnnoncesPourRecherche()                  │
│                                                                              │
│ Query Logic:                                                                │
│  ├─ AnnonceRepository.findActiveAnnonces()                                  │
│  │  └─ @Query: SELECT a FROM Annonce a                                     │
│  │            WHERE a.statut = 'VALIDEE'                                    │
│  │            AND a.dateExpiration > CURRENT_TIMESTAMP                      │
│  │                                                                           │
│  └─ Only returns VALIDEE annonces NOT expired (active listings)            │
│                                                                              │
│ Filtering Applied:                                                          │
│  ├─ ❌ EN_ATTENTE (pending review)                                         │
│  ├─ ❌ REJETEE (rejected by AI)                                            │
│  ├─ ❌ SUSPENDUE (manually suspended)                                       │
│  ├─ ❌ ARCHIVEE (manually archived)                                         │
│  └─ ❌ Expired >= 90 days old                                               │
│                                                                              │
│ Indexes Used:                                                               │
│  ├─ annonces(statut) - for statut = 'VALIDEE' filter                        │
│  └─ annonces(date_expiration) - for date comparison                         │
│                                                                              │
│ Expected Performance:                                                       │
│  └─ O(log N) with proper indexes                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ RESPONSE: 200 OK                                                            │
│ └─ Body: List<Annonce> JSON                                                 │
│    └─ Array of:                                                             │
│       ├─ id, titre, description, loyer, chargesIncluses                     │
│       ├─ statut: VALIDEE (always)                                           │
│       ├─ scoreConfiance, detailScore                                        │
│       ├─ nbSignalements (fraud reports count)                               │
│       ├─ datePublication, dateExpiration                                    │
│       └─ logement: { id, proprietaire, adresse, ville, coordonnees }        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ARCHITECTURE EN COUCHES

```
┌──────────────────────────────────────────────────────────────────────────┐
│ LAYER: CONTROLLER (REST API)                                             │
│ ├─ AnnonceController                                                     │
│ │  ├─ POST /api/annonces/publier                                        │
│ │  └─ GET /api/annonces/recherche                                       │
│ └─ Request/Response handling, HTTP status codes                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ LAYER: DTO (Data Transfer Objects)                                       │
│ ├─ AnnonceRequestDTO (Input validation)                                  │
│ │  ├─ @NotBlank @Size(max=200) String titre                             │
│ │  ├─ @NotEmpty @Valid List<ContactAnnonceDTO> contacts                  │
│ │  └─ @NotEmpty @Size(min=2, max=10) List<MultipartFile> photos          │
│ ├─ ContactAnnonceDTO                                                     │
│ │  ├─ @NotNull TypeContactEnum plateforme                               │
│ │  └─ @NotBlank String valeur                                           │
│ └─ FraudScoreResponse (External mapping)                                 │
│    ├─ Short scoreGlobal                                                  │
│    └─ Map<String, Integer> detailScore                                   │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ LAYER: SERVICE (Business Logic)                                          │
│                                                                            │
│ AnnonceService (@Service)                                                │
│  ├─ Orchestrates Annonce creation workflow                               │
│  ├─ Calls Python fraud detection service                                 │
│  ├─ Applies 3-tier scoring logic                                         │
│  └─ @Transactional ensures atomicity                                     │
│                                                                            │
│ PhotoService (@Service)                                                  │
│  ├─ Uploads files to Cloudinary                                          │
│  └─ Creates Photo entities with metadata                                 │
│                                                                            │
│ ContactAnnonceService (@Service)                                         │
│  ├─ Validates and persists contact information                           │
│  └─ Ensures platform type + value presence                               │
│                                                                            │
│ External Calls:                                                           │
│  ├─ WebClient → http://localhost:8000/analyze-listing (Python AI)         │
│  ├─ Cloudinary SDK → cloud storage (Photo CDN)                           │
│  └─ Database → PostgreSQL with PostGIS + JSONB support                   │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ LAYER: REPOSITORY (Data Persistence)                                     │
│                                                                            │
│ AnnonceRepository extends JpaRepository<Annonce, UUID>                    │
│  ├─ Standard CRUD: save(), findById(), delete()                          │
│  ├─ Query 1: findByStatut(StatutAnnonceEnum)                             │
│  ├─ Query 2: findByLogementIdOrderByDatePublicationDesc(UUID)            │
│  ├─ Query 3: @Query findActiveAnnonces()                                 │
│  │   └─ Only VALIDEE + non-expired                                       │
│  └─ Used by: AnnonceService.getAnnoncesPourRecherche()                   │
│                                                                            │
│ Other Repositories:                                                       │
│  ├─ PhotoRepository<Photo, UUID>                                         │
│  ├─ ContactAnnonceRepository<ContactAnnonce, UUID>                        │
│  ├─ LogementRepository<Logement, UUID>                                    │
│  ├─ EtudiantRepository<Etudiant, UUID>                                    │
│  ├─ ProprietaireRepository<Proprietaire, UUID>                            │
│  └─ ... (11 more repositories)                                            │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ LAYER: ENTITY (JPA Domain Model)                                         │
│                                                                            │
│ Inheritance Hierarchy (Single Table Inheritance - TPH)                    │
│  └─ Utilisateur (base)                                                    │
│     ├─ Etudiant (discriminator: "ETUDIANT")                              │
│     ├─ Proprietaire (discriminator: "PROPRIETAIRE")                       │
│     └─ Admin (discriminator: "ADMIN")                                     │
│                                                                            │
│ Main Entities:                                                            │
│  ├─ Annonce                                                               │
│  │  ├─ @ManyToOne Logement                                               │
│  │  ├─ statut: StatutAnnonceEnum (EN_ATTENTE|VALIDEE|REJETEE|...)        │
│  │  ├─ scoreConfiance: Short (0-100)                                      │
│  │  ├─ detailScore: @JdbcTypeCode(JSON) String                            │
│  │  ├─ datePublication: LocalDateTime                                     │
│  │  ├─ dateExpiration: LocalDateTime (DB trigger: +90 days)               │
│  │  └─ ... (other fields)                                                 │
│  │                                                                         │
│  ├─ Photo                                                                 │
│  │  ├─ @ManyToOne Annonce                                                │
│  │  ├─ url: String (Cloudinary URL)                                       │
│  │  ├─ phash: String (TODO: perceptual hash for duplicates)               │
│  │  ├─ estPrincipale: Boolean                                             │
│  │  └─ ordre: Short                                                       │
│  │                                                                         │
│  ├─ ContactAnnonce                                                        │
│  │  ├─ @ManyToOne Annonce                                                │
│  │  ├─ plateforme: TypeContactEnum                                        │
│  │  └─ valeur: String                                                     │
│  │                                                                         │
│  └─ Logement                                                              │
│     ├─ @ManyToOne Proprietaire                                            │
│     ├─ typeLogement: TypeLogementEnum                                     │
│     ├─ statutLogement: StatutLogementEnum                                 │
│     ├─ coordonnees: @Column(columnDefinition="geography(POINT,4326)")     │
│     └─ ... (location & specs)                                             │
│                                                                            │
│ All entities use Lombok:                                                  │
│  ├─ @Data (generates getters, setters, equals, hashCode, toString)        │
│  ├─ @NoArgsConstructor (default constructor)                              │
│  ├─ @AllArgsConstructor (all-fields constructor)                          │
│  ├─ @ToString.Exclude on @ManyToOne (prevent infinite loops)              │
│  └─ @EqualsAndHashCode.Exclude on relationships (safe object comparison)  │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│ LAYER: DATABASE (PostgreSQL + PostGIS)                                   │
│                                                                            │
│ Schema Tables:                                                            │
│  ├─ utilisateurs (TPH - single table, role discriminator)                 │
│  ├─ logements (foreign key: proprietaire_id)                              │
│  ├─ annonces (foreign key: logement_id)                                   │
│  ├─ photos (foreign key: annonce_id)                                      │
│  ├─ contacts_annonce (foreign key: annonce_id)                            │
│  ├─ avis (foreign keys: etudiant_id, annonce_id, consultation_id)          │
│  ├─ consultations (foreign keys: etudiant_id, annonce_id)                  │
│  ├─ signalements (foreign keys: etudiant_id, annonce_id, admin_id)         │
│  ├─ recommandations (foreign keys: etudiant_id, annonce_id)                │
│  └─ ... (other tables)                                                    │
│                                                                            │
│ Special Columns:                                                          │
│  ├─ coordonnees: geography(POINT, 4326) - PostGIS type                    │
│  ├─ detail_score: jsonb - JSONB for fraud analysis breakdown              │
│  ├─ created_at: timestamp DEFAULT NOW() (read-only in app)                │
│  ├─ updated_at: timestamp DEFAULT NOW() (read-only in app)                │
│  └─ date_expiration: date_publication + INTERVAL 90 days (DB trigger)     │
│                                                                            │
│ Triggers:                                                                 │
│  └─ Annonce expiration: auto-set dateExpiration = publication + 90j       │
│                                                                            │
│ Key Indexes:                                                              │
│  ├─ annonces(statut, date_expiration) - for active listing queries        │
│  ├─ annonces(logement_id) - for fetching by property                      │
│  ├─ logements(coordonnees) spatial - for geographic searches              │
│  └─ photos(annonce_id) - for gallery loading                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. SEQUENCE DIAGRAM: Publication d'Annonce Complète

```
Propriétaire    Controller    Service         Repository     Cloudinary    Python-AI   PostgreSQL
    |               |            |                 |              |             |           |
    |--POST--------->|            |                 |              |             |           |
    | publier        |            |                 |              |             |           |
    |             @Valid          |                 |              |             |           |
    |            DTO[]            |                 |              |             |           |
    |                |--creerAnnonce(dto)          |               |             |           |
    |                |         begin @Tx           |               |             |           |
    |                |--mapToEntity-------->       |               |             |           |
    |                |                    |        |               |             |           |
    |                |             findLogement()  |               |             |           |
    |                |--findById(logementId)------->               |             |           |
    |                |<--------Logement OK---------              |             |           |
    |                |                    |        |               |             |           |
    |                |    callFraudService(ann)|   |               |             |           |
    |                |-------POST/analyze------->|                 |             |           |
    |                |   {titre,desc,loyer}       |                 |--AI Call--->|           |
    |                |                            |                 |             |           |
    |                |                            |                 |<-Score Back-|           |
    |                |<-------FraudResponse------  |                 |             |           |
    |                |    {scoreGlobal: 85,       |                 |             |           |
    |                |     detailScore: {...}}    |                 |             |           |
    |                |                    |        |               |             |           |
    |                | Apply Logic:        |        |               |             |           |
    |                | score >= 70 →       |        |               |             |           |
    |                | VALIDEE             |        |               |             |           |
    |                |                    |        |               |             |           |
    |                | save(annonce)       |        |               |             |           |
    |                |--save(Annonce)------>      |               |             |           |
    |                |                           ├--INSERT annonce----->             |
    |                |<-------------Annonce[id]--<                   |             |
    |                |                    |        |               |             |           |
    |                | ajouterContacts()         |               |             |           |
    |                |--saveAll(contacts)-->     |               |             |           |
    |                |                           ├--INSERT contacts------>           |
    |                |<-------Contacts OK--<     |               |             |           |
    |                |                    |        |               |             |           |
    |                | uploaderPhotos()          |               |             |           |
    |                |--for each photo--------->                 |             |           |
    |                |   cloudinary.upload()                      |--------FILE---->           |
    |                |<------{url}-----<        |               |<-CDN URL--    |           |
    |                | save(Photo)             |               |             |           |
    |                |--save(Photo)------>       |               |             |           |
    |                |                           ├--INSERT photo-------->           |
    |                |<-------Photo OK---<       |               |             |           |
    |                |                    |        |               |             |           |
    |                | commit @Tx         |        |               |             |           |
    |                |--COMMIT------------------------------>                        |
    |                |                    |        |               |             |           |
    |<--201 Created--|                    |        |               |             |           |
    | Annonce JSON   |                    |        |               |             |           |
    |                |                    |        |               |             |           |
```

---

## 5. GESTION D'ERREUR: Exemple avec Service Indisponible

```
Step 1: WebClient call exception
┌─────────────────────────────────────────────────────────────────────────┐
│ WebClient.post()                                                        │
│  ├─ URI: http://localhost:8000/analyze-listing                          │
│  ├─ Body: {titre, description, loyer}                                   │
│  ├─ Timeout: 30s                                                        │
│  └─ Exception: ConnectException | TimeoutException | 503 Service Down   │
└─────────────────────────────────────────────────────────────────────────┘
                         ↓
Step 2: Error propagation
┌─────────────────────────────────────────────────────────────────────────┐
│ .retrieve()                                                             │
│  └─ Throws ClientException (parent of 4xx/5xx)                          │
│                                                                         │
│ .onErrorResume(exception →                                              │
│    log.error("Python fraud service unreachable: {}", msg)               │
│    return Mono.empty()                                                  │
│  )                                                                      │
│ .block() returns: null                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                         ↓
Step 3: Fallback logic
┌─────────────────────────────────────────────────────────────────────────┐
│ if (fraudResponse == null) {                                            │
│    scoreGlobal = null                                                   │
│ }                                                                       │
│                                                                         │
│ if (scoreGlobal == null) {                                              │
│    log.warn("Fraud score missing. Applying fallback: EN_ATTENTE +0")   │
│    statut = EN_ATTENTE      // Safe default (admin review)              │
│    scoreConfiance = 0       // Mark as non-scored                       │
│    detailScore = "{}"       // Empty breakdown                          │
│ }                                                                       │
│                                                                         │
│ → Save with safe defaults → NO exception thrown                        │
│ → Transaction committed successfully                                   │
└─────────────────────────────────────────────────────────────────────────┘
                         ↓
Step 4: Response to client
┌─────────────────────────────────────────────────────────────────────────┐
│ 201 Created                                                             │
│ {                                                                       │
│   "id": "uuid...",                                                      │
│   "statut": "EN_ATTENTE",      // ⏳ Will need admin verification        │
│   "scoreConfiance": 0,         // AI service was down                   │
│   "detailScore": "{}",         // No breakdown available                │
│   "titre": "...",                                                       │
│   ...                                                                   │
│ }                                                                       │
│                                                                         │
│ Client Result: Annonce published but pending review (safe state)        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. VALIDATION HIERARCHY

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: DTO Validation (@Valid on @ModelAttribute)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ AnnonceRequestDTO:                                                      │
│  ├─ titre:          @NotBlank, @Size(max=200)                           │
│  ├─ description:    @NotBlank (free TEXT)                               │
│  ├─ loyer:          @NotNull, @DecimalMin("0.0")                        │
│  ├─ chargesIncluses:@NotNull                                            │
│  ├─ contacts:       @NotEmpty, @Valid (list must exist)                 │
│  │  └─ ContactAnnonceDTO:                                               │
│  │     ├─ plateforme: @NotNull (enum)                                   │
│  │     └─ valeur: @NotBlank                                             │
│  └─ photos:         @NotEmpty, @Size(min=2, max=10)                     │
│                                                                          │
│ Result if invalid: 400 Bad Request + validation error details           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 2: Business Logic Validation (Service Layer)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ AnnonceService.creerAnnonce():                                          │
│  ├─ Logement exists: logementRepository.findById()                      │
│  │  └─ if absent → EntityNotFoundException                              │
│  │                                                                       │
│  ├─ Photo count: validatePhotoCount(photos)                             │
│  │  ├─ if < 2 → IllegalArgumentException                                │
│  │  └─ if > 10 → IllegalArgumentException                               │
│  │                                                                       │
│  └─ Contact validation: ContactAnnonceService.ajouterContacts()         │
│     ├─ plateforme NOT NULL → IllegalArgumentException                   │
│     └─ valeur NOT BLANK → IllegalArgumentException                      │
│                                                                          │
│ Result if invalid: 400 | 404 | 422 (depends on error type)              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ LEVEL 3: Database Constraints (SQL)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Annonce table:                                                          │
│  ├─ id: UUID PRIMARY KEY                                                │
│  ├─ logement_id: UUID NOT NULL FOREIGN KEY                              │
│  ├─ titre: VARCHAR(200) NOT NULL                                        │
│  ├─ description: TEXT NOT NULL                                          │
│  ├─ loyer: NUMERIC NOT NULL                                             │
│  ├─ chargesIncluses: BOOLEAN NOT NULL                                   │
│  └─ statut: VARCHAR(20) CHECK IN ('EN_ATTENTE','VALIDEE','REJETEE'...   │
│                                                                          │
│ Photo table:                                                            │
│  ├─ id: UUID PRIMARY KEY                                                │
│  ├─ annonce_id: UUID NOT NULL FOREIGN KEY                               │
│  ├─ url: VARCHAR(500) NOT NULL UNIQUE (optional)                        │
│  ├─ estPrincipale: BOOLEAN NOT NULL                                     │
│  └─ ordre: SMALLINT NOT NULL                                            │
│                                                                          │
│ Result if violated: SQLException → PersistenceException (caught by JPA) │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. TRANSACTION SEMANTICS

```
┌───────────────────────────────────────────────────────────────────────┐
│ @Transactional(                                                       │
│   propagation = Propagation.REQUIRED,  // Create or join tx           │
│   isolation = Isolation.READ_COMMITTED, // Default for DB             │
│   readOnly = false                     // Allows writes               │
│ )                                                                      │
│ public Annonce creerAnnonce(UUID logementId, AnnonceRequestDTO dto)   │
└───────────────────────────────────────────────────────────────────────┘

   Initial State                    Transaction Active          Final State

   PostgreSQL                       ├─ Lock acquired             PostgreSQL
   annonces table:                  │
   (0 rows)                         ├─ INSERT Annonce            annonces table:
                                    │  uuid1, VALIDEE, score85   (1 row - VALIDEE)
   photos table:                    │
   (0 rows)                         ├─ INSERT Photos            photos table:
                                    │  photo1, photo2 (urls✓)    (2 rows)
   contacts_annonce table:          │
   (0 rows)                         ├─ INSERT Contacts          contacts_annonce:
                                    │  tel:+123, email:...       (2 rows)
                                    │
                                    ├─ COMMIT                   All visible
                                    │                            to other txs
                                    ├─ Lock released


EXCEPTION SCENARIO:
   ┌─ INSERT Annonce (OK)
   ├─ INSERT Photo #1 (OK)
   ├─ INSERT Photo #2 (CONSTRAINT VIOLATION)
   │  └─ ValidationException thrown
   │
   ├─ ROLLBACK entire transaction
   │  ├─ DELETE Annonce
   │  └─ DELETE Photo #1
   │
   └─ Exception propagated to Controller
      └─ 400 | 422 response to client
         (Database left in original state - no orphans)
```

---

## 8. PERFORMANCE CONSIDERATIONS

### Query Performance
```
findActiveAnnonces():
   SELECT a FROM Annonce a 
   WHERE a.statut = 'VALIDEE' 
     AND a.dateExpiration > CURRENT_TIMESTAMP
     AND ...

Index Strategy:
   ├─ CREATE INDEX idx_annonce_statut ON annonces(statut)
   │  └─ Estimates: 1K VALIDEE out of 100K total → 1% selectivity
   │
   └─ CREATE INDEX idx_annonce_expiration ON annonces(date_expiration)
      └─ Range query optimization

Expected Plan:
   ├─ Index on statut = 'VALIDEE' → ~1K rows
   ├─ Filter by expiration CURRENT_TIMESTAMP → ~100-500 active
   └─ Return result set: O(log N) lookup + O(k) output where k = active count
```

### Database Connection Pooling
```
HikariCP (assumed from Spring Boot):
   ├─ max pool size: 10 (default)
   ├─ idle timeout: 10 min
   ├─ connection lifetime: 30 min
   ├─ lead time: 250ms

For concurrent uploads (Phase 2):
   └─ Recommend: max pool size = 20-30
      (expensive I/O with Cloudinary waits)
```

### I/O Performance
```
Annonce publication flow:
   ├─ 1x AI service call: ~500-1000ms (Python ML inference)
   ├─ 2-10x Cloudinary uploads: ~200-500ms each
   │  └─ Total: ~400-5000ms
   └─ 2-3x DB inserts: ~10-50ms each
      └─ Total: ~20-150ms

   Expected: 1-7 seconds per publish (dominated by external calls)
```

---

## 9. SECURITY CONSIDERATIONS

### Input Validation
```
✅ @Valid @NotBlank - prevents empty strings in critical fields
✅ @DecimalMin - prevents negative loan amounts
✅ @Size(max=200) - prevents buffer overflow in titles
✅ @Size(min=2, max=10) - prevents invalid photo counts

⚠️ TODO: File upload validation
   - Check MIME type (image/jpeg, image/png only)
   - Check file size (max 10MB per photo?)
   - Scan for malware (ClamAV integration?)

⚠️ TODO: SQL Injection
   - JPA prevents direct SQL injection
   - BUT: @Query with string concat can be unsafe
   - Review all @Query methods for parameterization
```

### Authentication & Authorization
```
NOT YET IMPLEMENTED (Phase 2 recommendation):
   ├─ JWT token validation on endpoints
   ├─ Role-based access control:
   │  ├─ Proprietaire can only create annonces for their logements
   │  ├─ Admin can moderate/archive annonces
   │  └─ Etudiant can search but not create
   └─ Audit logging for sensitive operations
```

### Data Privacy
```
Sensitive Fields:
   ├─ email (in Utilisateur)
   ├─ numero_cin (in Proprietaire)
   ├─ photo_cin_url (in Proprietaire)
   └─ coordonnees (can reveal location)

Recommendations:
   ├─ Encrypt email + CIN at rest
   ├─ Mask coordinates in API response (only show to logged-in users)
   └─ Implement audit trail for data access
```

---

## 10. EXPANSION POINTS FOR FUTURE PHASES

### Phase 2: Search & Map
```
Required additions:
   ├─ Geographic queries: ST_Distance, ST_DWithin
   ├─ Google Maps integration
   ├─ Annonce deduplication via pHash
   └─ Autocomplete (city/university search)
```

### Phase 3: Recommendations
```
Required additions:
   ├─ ML-based recommendation engine
   ├─ User preference tracking
   └─ Collaborative filtering
```

### Phase 4: Analytics
```
Required additions:
   ├─ Event logging (view, like, search)
   ├─ Business intelligence dashboards
   └─ Fraud detection improvements
```

---

**Document Version**: 1.0
**Last Updated**: 2026-04-27
**Status**: COMPLETE FOR PHASE 1

