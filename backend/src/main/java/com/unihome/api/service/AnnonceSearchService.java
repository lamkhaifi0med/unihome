package com.unihome.api.service;

import com.unihome.api.dto.AnnonceSearchRequest;
import com.unihome.api.dto.AnnonceSearchResult;
import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.AnnonceEquipement;
import com.unihome.api.entity.Photo;
import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.entity.Universite;
import com.unihome.api.repository.AnnonceEquipementRepository;
import com.unihome.api.repository.AnnonceRepository;
import com.unihome.api.repository.AnnonceSpecifications;
import com.unihome.api.repository.PhotoRepository;
import com.unihome.api.repository.UniversiteRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Database-side search engine for the chatbot. Receives a typed
 * {@link AnnonceSearchRequest}, composes JPA Specifications, runs the query
 * and projects results into the compact {@link AnnonceSearchResult} returned
 * to the AI service.
 *
 * <p>Always restricts results to {@code statut = VALIDEE} and non-expired
 * annonces; the AI service does not get visibility into pending / rejected
 * listings of other owners.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnnonceSearchService {

    private static final int DEFAULT_LIMIT = 10;
    private static final int HARD_LIMIT = 20;
    private static final int DEFAULT_RADIUS_METERS = 3000;

    private final AnnonceRepository annonceRepository;
    private final AnnonceEquipementRepository annonceEquipementRepository;
    private final PhotoRepository photoRepository;
    private final UniversiteRepository universiteRepository;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<AnnonceSearchResult> search(AnnonceSearchRequest request) {
        AnnonceSearchRequest filters = request != null ? request : new AnnonceSearchRequest();

        Point campusPoint = resolveCampusPoint(filters);
        int rayonMetres = filters.getRayonMetres() != null ? filters.getRayonMetres() : DEFAULT_RADIUS_METERS;

        Specification<Annonce> spec = Specification.where(AnnonceSpecifications.hasStatut(StatutAnnonceEnum.VALIDEE))
                .and(AnnonceSpecifications.notExpired())
                .and(AnnonceSpecifications.villeContains(filters.getVille()))
                .and(AnnonceSpecifications.typeLogementEquals(filters.getTypeLogement()))
                .and(AnnonceSpecifications.loyerBetween(filters.getPrixMin(), filters.getPrixMax()))
                .and(AnnonceSpecifications.surfaceAtLeast(filters.getSurfaceMin()))
                .and(AnnonceSpecifications.chargesIncluses(filters.getChargesIncluses()))
                .and(AnnonceSpecifications.scoreConfianceAtLeast(filters.getScoreConfianceMin()))
                .and(AnnonceSpecifications.withAllEquipements(filters.getEquipementsRequis()))
                .and(AnnonceSpecifications.withoutAnyEquipement(filters.getEquipementsExclus()));

        if (campusPoint != null) {
            spec = spec.and(AnnonceSpecifications.withinRadius(
                    campusPoint.getX(),
                    campusPoint.getY(),
                    rayonMetres));
        }

        int limit = clamp(filters.getLimit() != null ? filters.getLimit() : DEFAULT_LIMIT, 1, HARD_LIMIT);
        int offset = filters.getOffset() != null ? filters.getOffset() : 0;
        Pageable pageable = PageRequest.of(
                offset / Math.max(limit, 1),
                limit,
                Sort.by(Sort.Direction.DESC, "scoreConfiance")
                        .and(Sort.by(Sort.Direction.DESC, "datePublication"))
        );

        List<Annonce> annonces = annonceRepository.findAll(spec, pageable).getContent();
        if (annonces.isEmpty()) {
            log.debug("Chatbot search: 0 results for filters={}", filters);
            return List.of();
        }

        List<UUID> ids = annonces.stream().map(Annonce::getId).collect(Collectors.toList());
        Map<UUID, List<String>> equipementsByAnnonce = loadEquipementsByAnnonce(ids);
        Map<UUID, String> primaryPhotoByAnnonce = loadPrimaryPhotoByAnnonce(ids);
        Map<UUID, Double> distancesByAnnonce = campusPoint != null
                ? loadDistancesByAnnonce(ids, campusPoint.getX(), campusPoint.getY())
                : Map.of();

        log.info("Chatbot search: {} result(s) for filters={}", annonces.size(), filters);

        return annonces.stream()
                .map(annonce -> AnnonceSearchResult.builder()
                        .id(annonce.getId())
                        .titre(annonce.getTitre())
                        .ville(annonce.getLogement() != null ? annonce.getLogement().getVille() : null)
                        .typeLogement(annonce.getLogement() != null ? annonce.getLogement().getTypeLogement() : null)
                        .loyer(annonce.getLoyer())
                        .chargesIncluses(annonce.getChargesIncluses())
                        .superficie(annonce.getLogement() != null ? annonce.getLogement().getSuperficie() : null)
                        .scoreConfiance(annonce.getScoreConfiance())
                        .equipements(topEquipements(equipementsByAnnonce.getOrDefault(annonce.getId(), List.of())))
                        .distanceCampusM(distancesByAnnonce.get(annonce.getId()))
                        .photoPrincipaleUrl(primaryPhotoByAnnonce.get(annonce.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Finds the campus point either by explicit UUID, or by case/accent-insensitive
     * substring match on the university name. Returns {@code null} when no campus
     * filter was provided or the lookup failed.
     */
    private Point resolveCampusPoint(AnnonceSearchRequest filters) {
        if (filters.getAutourUniversiteId() != null) {
            return universiteRepository.findById(filters.getAutourUniversiteId())
                    .map(Universite::getCoordonnees)
                    .orElse(null);
        }
        if (filters.getAutourUniversiteNom() != null && !filters.getAutourUniversiteNom().isBlank()) {
            String needle = AnnonceSpecifications.normalize(filters.getAutourUniversiteNom());
            return universiteRepository.findAll().stream()
                    .filter(u -> u.getNom() != null && AnnonceSpecifications.normalize(u.getNom()).contains(needle))
                    .findFirst()
                    .map(Universite::getCoordonnees)
                    .orElse(null);
        }
        return null;
    }

    private Map<UUID, List<String>> loadEquipementsByAnnonce(Collection<UUID> annonceIds) {
        if (annonceIds.isEmpty()) return Map.of();
        Map<UUID, List<String>> result = new HashMap<>();
        for (UUID id : annonceIds) {
            List<String> labels = annonceEquipementRepository.findByIdAnnonceId(id).stream()
                    .map(AnnonceEquipement::getEquipement)
                    .filter(e -> e != null && e.getLibelle() != null)
                    .map(e -> e.getLibelle())
                    .collect(Collectors.toList());
            result.put(id, labels);
        }
        return result;
    }

    private Map<UUID, String> loadPrimaryPhotoByAnnonce(Collection<UUID> annonceIds) {
        if (annonceIds.isEmpty()) return Map.of();
        Map<UUID, String> result = new HashMap<>();
        for (UUID id : annonceIds) {
            List<Photo> photos = photoRepository.findByAnnonce_IdOrderByOrdreAsc(id);
            Optional<String> principale = photos.stream()
                    .filter(p -> Boolean.TRUE.equals(p.getEstPrincipale()))
                    .findFirst()
                    .map(Photo::getUrl);
            if (principale.isPresent()) {
                result.put(id, principale.get());
            } else if (!photos.isEmpty()) {
                result.put(id, photos.get(0).getUrl());
            }
        }
        return result;
    }

    /**
     * Computes the distance from each annonce's logement to the given point using
     * PostGIS ST_Distance on geography (returns meters). Issued as a single
     * Criteria query so no N+1.
     */
    private Map<UUID, Double> loadDistancesByAnnonce(Collection<UUID> annonceIds, double lon, double lat) {
        if (annonceIds.isEmpty()) return Map.of();
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Object[]> query = cb.createQuery(Object[].class);
        Root<Annonce> root = query.from(Annonce.class);
        query.multiselect(
                root.get("id"),
                cb.function(
                        "ST_Distance",
                        Double.class,
                        root.get("logement").get("coordonnees"),
                        cb.function("ST_SetSRID", Object.class,
                                cb.function("ST_MakePoint", Object.class, cb.literal(lon), cb.literal(lat)),
                                cb.literal(4326))
                )
        );
        Predicate inIds = root.get("id").in(annonceIds);
        query.where(inIds);
        Map<UUID, Double> distances = new HashMap<>();
        for (Object[] row : entityManager.createQuery(query).getResultList()) {
            UUID id = (UUID) row[0];
            Double distance = row[1] instanceof Number n ? n.doubleValue() : null;
            if (distance != null) distances.put(id, distance);
        }
        return distances;
    }

    /** Returns at most 6 equipment labels (deterministic alphabetical order). */
    private List<String> topEquipements(List<String> equipements) {
        return equipements.stream()
                .filter(label -> label != null && !label.isBlank())
                .sorted(Comparator.comparing(s -> s.toLowerCase(Locale.ROOT)))
                .limit(6)
                .collect(Collectors.toList());
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
