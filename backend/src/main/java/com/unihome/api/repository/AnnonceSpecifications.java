package com.unihome.api.repository;

import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.AnnonceEquipement;
import com.unihome.api.entity.Equipement;
import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.entity.TypeLogementEnum;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Factory of reusable JPA {@link Specification} predicates for {@link Annonce}.
 *
 * <p>Each method returns a tiny {@code Specification<Annonce>} that the
 * {@code AnnonceSearchService} can compose with {@code .and(...)}. All text
 * matches are case- and accent-insensitive: the entity column is wrapped in
 * {@code unaccent(lower(col))} and the user input is normalized the same way
 * in Java before being bound as a parameter.</p>
 *
 * <p>The {@code unaccent} function is provided by the PostgreSQL extension of
 * the same name (loaded by the existing {@code unihome.sql} schema). It is
 * registered as a SQL function so Hibernate calls it natively.</p>
 */
public final class AnnonceSpecifications {

    private AnnonceSpecifications() {
        // utility class
    }

    // ------------------------------------------------------------------
    // Single-column predicates
    // ------------------------------------------------------------------

    public static Specification<Annonce> hasStatut(StatutAnnonceEnum statut) {
        return (root, query, cb) -> cb.equal(root.get("statut"), statut);
    }

    /** Keeps annonces whose publication has not expired yet. */
    public static Specification<Annonce> notExpired() {
        return (root, query, cb) -> cb.or(
                cb.isNull(root.get("dateExpiration")),
                cb.greaterThan(root.get("dateExpiration"), cb.literal(LocalDateTime.now()))
        );
    }

    public static Specification<Annonce> villeContains(String ville) {
        if (ville == null || ville.isBlank()) return noop();
        String needle = normalize(ville);
        return (root, query, cb) -> cb.like(
                unaccentLower(cb, root.get("logement").get("ville")),
                "%" + needle + "%"
        );
    }

    public static Specification<Annonce> typeLogementEquals(TypeLogementEnum type) {
        if (type == null) return noop();
        return (root, query, cb) -> cb.equal(root.get("logement").get("typeLogement"), type);
    }

    public static Specification<Annonce> loyerBetween(BigDecimal min, BigDecimal max) {
        if (min == null && max == null) return noop();
        return (root, query, cb) -> {
            if (min != null && max != null) return cb.between(root.get("loyer"), min, max);
            if (min != null) return cb.greaterThanOrEqualTo(root.get("loyer"), min);
            return cb.lessThanOrEqualTo(root.get("loyer"), max);
        };
    }

    public static Specification<Annonce> surfaceAtLeast(BigDecimal min) {
        if (min == null) return noop();
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("logement").get("superficie"), min);
    }

    public static Specification<Annonce> chargesIncluses(Boolean chargesIncluses) {
        if (chargesIncluses == null) return noop();
        return (root, query, cb) -> cb.equal(root.get("chargesIncluses"), chargesIncluses);
    }

    public static Specification<Annonce> scoreConfianceAtLeast(Integer min) {
        if (min == null) return noop();
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("scoreConfiance"), min.shortValue());
    }

    // ------------------------------------------------------------------
    // Equipment predicates — the trickier ones
    // ------------------------------------------------------------------

    /**
     * Keeps annonces that have ALL of the given equipment labels. Implemented
     * as N independent EXISTS subqueries (one per label) on the join entity
     * {@link AnnonceEquipement}. Using N subqueries instead of a single
     * COUNT-DISTINCT grouping keeps pagination working correctly.
     */
    public static Specification<Annonce> withAllEquipements(List<String> labels) {
        if (labels == null || labels.isEmpty()) return noop();
        return (root, query, cb) -> {
            Predicate composite = cb.conjunction();
            for (String raw : labels) {
                if (raw == null || raw.isBlank()) continue;
                String needle = normalize(raw);
                Subquery<UUID> sub = query.subquery(UUID.class);
                Root<AnnonceEquipement> link = sub.from(AnnonceEquipement.class);
                Join<AnnonceEquipement, Equipement> eq = link.join("equipement");
                sub.select(link.get("id").get("annonceId"));
                sub.where(
                        cb.equal(link.get("id").get("annonceId"), root.get("id")),
                        cb.equal(unaccentLower(cb, eq.get("libelle")), needle)
                );
                composite = cb.and(composite, cb.exists(sub));
            }
            return composite;
        };
    }

    /**
     * Keeps annonces that have NONE of the given equipment labels. This is the
     * predicate that fixes the "appartement Berkane sans réfrigérateur" bug:
     * for each unwanted label, the annonce must not have any join row pointing
     * to an equipement with that libelle.
     */
    public static Specification<Annonce> withoutAnyEquipement(List<String> labels) {
        if (labels == null || labels.isEmpty()) return noop();
        return (root, query, cb) -> {
            Predicate composite = cb.conjunction();
            for (String raw : labels) {
                if (raw == null || raw.isBlank()) continue;
                String needle = normalize(raw);
                Subquery<UUID> sub = query.subquery(UUID.class);
                Root<AnnonceEquipement> link = sub.from(AnnonceEquipement.class);
                Join<AnnonceEquipement, Equipement> eq = link.join("equipement");
                sub.select(link.get("id").get("annonceId"));
                sub.where(
                        cb.equal(link.get("id").get("annonceId"), root.get("id")),
                        cb.equal(unaccentLower(cb, eq.get("libelle")), needle)
                );
                composite = cb.and(composite, cb.not(cb.exists(sub)));
            }
            return composite;
        };
    }

    // ------------------------------------------------------------------
    // Geospatial predicate (PostGIS)
    // ------------------------------------------------------------------

    /**
     * Keeps annonces whose logement is within {@code rayonMetres} of the given
     * point. Uses PostGIS {@code ST_DWithin} with a geography cast, which
     * benefits from the spatial GIST index already declared in the schema.
     *
     * <p>Coordinates are expected in WGS84 (lon, lat) as stored in the
     * {@code coordonnees} column.</p>
     */
    public static Specification<Annonce> withinRadius(double lon, double lat, int rayonMetres) {
        return (root, query, cb) -> cb.isTrue(cb.function(
                "ST_DWithin",
                Boolean.class,
                root.get("logement").get("coordonnees"),
                cb.function("ST_SetSRID", Object.class,
                        cb.function("ST_MakePoint", Object.class,
                                cb.literal(lon),
                                cb.literal(lat)),
                        cb.literal(4326)),
                cb.literal(rayonMetres)
        ));
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * No-op specification that matches every row. Used in place of {@code null}
     * because modern Spring Data JPA rejects {@code null} in {@code .and()}.
     */
    private static Specification<Annonce> noop() {
        return (root, query, cb) -> cb.conjunction();
    }

    /**
     * Wraps the column expression in {@code unaccent(lower(...))} so the
     * comparison is case- and accent-insensitive.
     */
    private static Expression<String> unaccentLower(
            jakarta.persistence.criteria.CriteriaBuilder cb,
            Expression<String> column
    ) {
        return cb.function("unaccent", String.class, cb.lower(column));
    }

    /** Mirrors the SQL {@code unaccent(lower(...))} behavior on the Java side. */
    public static String normalize(String value) {
        if (value == null) return "";
        String decomposed = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return decomposed.toLowerCase()
                .replace('’', '\'')
                .replace('`', '\'')
                .trim();
    }
}
