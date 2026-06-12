package com.unihome.api.repository;

import com.unihome.api.entity.AnnonceAvecDistance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for read-only projections of active listings with distance to campus.
 * Backed by PostgreSQL view: v_annonces_avec_distance
 */
@Repository
public interface AnnonceAvecDistanceRepository extends JpaRepository<AnnonceAvecDistance, UUID> {

    /**
     * Find all active listings within a distance radius from a given point
     * @param universiteId University ID to calculate distance from
     * @param maxDistanceM Maximum distance in meters
     */
    @Query(value = """
        SELECT a.id AS annonce_id, a.titre, a.loyer, a.charges_incluses, a.statut, a.score_confiance,
               a.nb_signalements, a.date_expiration, l.id AS logement_id, l.adresse, l.ville,
               l.superficie, l.type_logement, l.coordonnees AS coordonnees_logement,
               u.nom AS proprietaire_nom, u.prenom AS proprietaire_prenom,
               u.est_verifie_cin AS proprietaire_verifie, u.note_moyenne AS proprietaire_note,
               univ.id AS universite_id, univ.nom AS universite_nom,
               ST_Distance(l.coordonnees::geography, univ.coordonnees::geography) AS distance_campus_m
        FROM annonces a
        JOIN logements l ON l.id = a.logement_id
        JOIN utilisateurs u ON u.id = l.proprietaire_id
        JOIN universites univ ON univ.id = :universiteId
        WHERE a.statut = 'VALIDEE'::statut_annonce_enum
          AND (a.date_expiration IS NULL OR a.date_expiration > now())
          AND ST_Distance(l.coordonnees::geography, univ.coordonnees::geography) <= :maxDistanceM
        ORDER BY distance_campus_m ASC
    """, nativeQuery = true)
    List<AnnonceAvecDistance> findByUniversiteWithinDistance(
        @Param("universiteId") UUID universiteId,
        @Param("maxDistanceM") Double maxDistanceM
    );

    /**
     * Find all active listings for a given universite
     */
    List<AnnonceAvecDistance> findByUniversiteId(UUID universiteId);

    /**
     * Find all active listings in a city
     */
    List<AnnonceAvecDistance> findByVille(String ville);

    /**
     * Find all active listings within a distance radius from a given point with pagination
     * @param universiteId University ID to calculate distance from
     * @param maxDistanceM Maximum distance in meters
     * @param pageable Pagination information
     */
    @Query(value = """
        SELECT a.id AS annonce_id, a.titre, a.loyer, a.charges_incluses, a.statut, a.score_confiance,
               a.nb_signalements, a.date_expiration, l.id AS logement_id, l.adresse, l.ville,
               l.superficie, l.type_logement, l.coordonnees AS coordonnees_logement,
               u.nom AS proprietaire_nom, u.prenom AS proprietaire_prenom,
               u.est_verifie_cin AS proprietaire_verifie, u.note_moyenne AS proprietaire_note,
               univ.id AS universite_id, univ.nom AS universite_nom,
               ST_Distance(l.coordonnees::geography, univ.coordonnees::geography) AS distance_campus_m
        FROM annonces a
        JOIN logements l ON l.id = a.logement_id
        JOIN utilisateurs u ON u.id = l.proprietaire_id
        JOIN universites univ ON univ.id = :universiteId
        WHERE a.statut = 'VALIDEE'::statut_annonce_enum
          AND (a.date_expiration IS NULL OR a.date_expiration > now())
          AND ST_Distance(l.coordonnees::geography, univ.coordonnees::geography) <= :maxDistanceM
        ORDER BY distance_campus_m ASC
    """, countQuery = """
        SELECT count(*)
        FROM annonces a
        JOIN logements l ON l.id = a.logement_id
        JOIN universites univ ON univ.id = :universiteId
        WHERE a.statut = 'VALIDEE'::statut_annonce_enum
          AND (a.date_expiration IS NULL OR a.date_expiration > now())
          AND ST_Distance(l.coordonnees::geography, univ.coordonnees::geography) <= :maxDistanceM
    """, nativeQuery = true)
    Page<AnnonceAvecDistance> findByUniversiteWithinDistance(
        @Param("universiteId") UUID universiteId,
        @Param("maxDistanceM") Double maxDistanceM,
        Pageable pageable
    );
}
