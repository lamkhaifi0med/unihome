# PHASE 2 ROADMAP - SEARCH & MAP INTEGRATION
## Status: PENDING | Target: Development Sprint 2

---

## BLOCKING ISSUES (Must Fix Before Phase 2)

### Issue #1: Geographic Search Queries Missing
- **Severity**: HIGH
- **Component**: LogementRepository, AnnonceRepository
- **Current State**: No geographic queries implemented
- **Task**: 
  - [ ] Add `findByCoordinatesWithin(Point center, double radiusKm)` 
  - [ ] Add `findByCoordonneesInBoundingBox(Point nw, Point se)`
  - [ ] Use PostGIS ST_Distance, ST_DWithin functions
  - [ ] Add test cases for geographic queries
- **Estimated Effort**: 2 days
- **Depends On**: PostGIS spatial index in DB (pre-existing)

### Issue #2: pHash Implementation (Image Duplicate Detection)
- **Severity**: MEDIUM (Security, not blocking)
- **Component**: PhotoService
- **Current State**: Line 32 marks as TODO, phash = null
- **Task**:
  - [ ] Choose library: OpenCV (heavy) or ImageHash (light)
  - [ ] Calculate perceptual hash on upload
  - [ ] Store in Photo.phash
  - [ ] Add duplicate detection query: 
    ```sql
    SELECT p1.* FROM photos p1 
    JOIN photos p2 ON p1.annonce_id != p2.annonce_id
    WHERE levenshtein(p1.phash, p2.phash) < 5
    ```
  - [ ] Add flag: duplicatePhotoIds to Annonce validation response
- **Estimated Effort**: 3 days
- **Depends On**: Image processing library selection

---

## NON-BLOCKING ENHANCEMENTS (Recommended Before Phase 2)

### Enhancement #1: WebClient Resilience Configuration
- **File**: WebClientConfig.java
- **Current**: Basic WebClient.builder() without timeout
- **Tasks**:
  - [ ] Add `connectTimeout(Duration.ofSeconds(5))`
  - [ ] Add `responseTimeout(Duration.ofSeconds(30))`
  - [ ] Consider Resilience4j circuit breaker pattern
  - [ ] Add max retries with exponential backoff
- **Estimated Effort**: 1 day
- **Benefit**: Prevents hanging requests to Python service

### Enhancement #2: Async Photo Upload (Concurrency Optimization)
- **File**: AnnonceService.java, PhotoService.java
- **Current**: Synchronous upload inside @Transactional
- **Risk**: Deadlocks under heavy load
- **Tasks**:
  - [ ] Extract photo upload to async CompletableFuture
  - [ ] Use Spring's @Async executor
  - [ ] Implement event-driven photo saving (PhotoUploadedEvent)
  - [ ] Add retry mechanism for failed uploads
  - [ ] Keep @Transactional only for database operations
- **Estimated Effort**: 2 days
- **Benefit**: Scalable to 100s of concurrent uploads

### Enhancement #3: Global Exception Handling
- **File**: Create com/unihome/api/config/GlobalExceptionHandler.java
- **Tasks**:
  - [ ] Create @RestControllerAdvice class
  - [ ] Handle EntityNotFoundException → 404
  - [ ] Handle IllegalArgumentException → 400
  - [ ] Handle PhotoUploadException → 422
  - [ ] Add error response wrapper: `{"error": "...", "timestamp": "...", "path": "..."}`
  - [ ] Log all exceptions with request context
- **Estimated Effort**: 1 day
- **Benefit**: Consistent API error responses

### Enhancement #4: DTO Response Wrapper
- **File**: Create com/unihome/api/dto/ApiResponse.java
- **Tasks**:
  - [ ] Generic wrapper: `ApiResponse<T> { success, data, errors, timestamp }`
  - [ ] Update controllers to use wrapper
  - [ ] Backward compatibility check
- **Estimated Effort**: 0.5 days
- **Benefit**: Standardized API contracts

---

## PHASE 2 FEATURES (Search & Map)

### Feature A: Annonce Search by Location
- **Endpoint**: `GET /api/annonces/search?lat=X&lon=Y&radiusKm=5`
- **Implementation**:
  - [ ] AnnonceRepository.findActiveAnnoncesNear(Point, distance)
  - [ ] AnnonceController.searchByLocation()
  - [ ] Response: List<AnnonceDTO> with distance calculated
- **Dependency**: Issue #1 (Geographic queries)

### Feature B: Interactive Map
- **Endpoint**: `GET /api/annonces/map?bounds=nw_lat,nw_lon,se_lat,se_lon`
- **Implementation**:
  - [ ] AnnonceRepository.findInBoundingBox()
  - [ ] Return Map<UUID, AnnonceMarkerDTO>
  - [ ] Marker DTOs: id, lat, lon, titre, loyer, thumbnail
- **Dependency**: Issue #1

### Feature C: Annonce Deduplication (Anti-Fraud)
- **Endpoint**: Internal validation during publication
- **Implementation**:
  - [ ] Before saving photos, check pHash against existing
  - [ ] Return conflict warning if matches found
  - [ ] Allow override (admin only)
- **Dependency**: Issue #2

---

## TESTING STRATEGY

### Unit Tests (Phase 1 Validation)
- [ ] AnnonceServiceTest: creerAnnonce() with mock WebClient
- [ ] PhotoServiceTest: uploaderPhoto() with mock Cloudinary
- [ ] ContactAnnonceServiceTest: ajouterContacts() validation
- [ ] RepositoryTest (H2 in-memory): findActiveAnnonces()

### Integration Tests (Phase 2 Prerequisite)
- [ ] Geographic query tests with real PostgreSQL + PostGIS
- [ ] WebClient resilience tests with WireMock
- [ ] End-to-end flow: Logement → Annonce → Search

### Performance Tests
- [ ] Load test: 1000 concurrent searches
- [ ] Geographic query performance (5K annonces)
- [ ] Cloudinary upload performance (100 photos)

---

## DOCUMENTATION UPDATES

- [ ] API.md: Document geographic endpoints
- [ ] SCHEMA.md: Spatial index creation guide
- [ ] DEPLOYMENT.md: Environment variable setup (Cloudinary, Python service)
- [ ] DEVELOPERS.md: How to test geographic queries locally

---

## DEPLOYMENT CHECKLIST

### Pre-Production
- [ ] Activate PostGIS extension in PostgreSQL prod database
- [ ] Create spatial indexes on coordonnees columns
- [ ] Configure Cloudinary credentials via secrets manager
- [ ] Set python.service.url to production endpoint
- [ ] Enable HTTPS for all external API calls

### Post-Deployment Monitoring
- [ ] Log geographic query latencies
- [ ] Monitor photo upload success rates
- [ ] Track AI fraud service availability
- [ ] Set up alerts for hanging WebClient requests

---

## METRICS & KPIs

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Geographic Query Response Time | < 200ms | N/A | Pending |
| Photo Upload Success Rate | > 99.5% | N/A | Pending |
| AI Service Availability | 99% | Early tests | Monitor |
| False Positives (Fraud Detection) | < 5% | N/A | Post-launch |

---

## SIGN-OFF

**Phase 1 Complete**: 2026-04-27
**Phase 1 Readiness**: 78/100 ✅ APPROVED FOR PHASE 2
**Phase 2 Start Date**: [TBD]
**Product Manager**: [Name]
**Technical Lead**: [Name]

---

**Last Updated**: 2026-04-27
**Next Review**: Phase 2 kickoff meeting

