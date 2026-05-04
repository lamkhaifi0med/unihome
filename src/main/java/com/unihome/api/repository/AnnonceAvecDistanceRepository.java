package com.unihome.api.repository;

import com.unihome.api.entity.AnnonceAvecDistance;
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
    @Query("""
        SELECT a FROM AnnonceAvecDistance a 
        WHERE a.universiteId = :universiteId 
        AND CAST(a.distanceCampusM AS double) <= :maxDistanceM
        ORDER BY a.distanceCampusM ASC
    """)
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
}

