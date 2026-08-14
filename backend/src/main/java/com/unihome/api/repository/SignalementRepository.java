package com.unihome.api.repository;

import com.unihome.api.entity.Signalement;
import com.unihome.api.entity.StatutSignalementEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SignalementRepository extends JpaRepository<Signalement, UUID> {

    @Query(value = "SELECT COUNT(*) FROM signalements s WHERE s.statut = CAST(:#{#statut.name()} AS statut_signalement_enum)", nativeQuery = true)
    long countByStatut(@Param("statut") StatutSignalementEnum statut);

    boolean existsByEtudiant_IdAndAnnonce_Id(UUID etudiantId, UUID annonceId);

    List<Signalement> findByAnnonceIdOrderByCreatedAtDesc(UUID annonceId);

    List<Signalement> findAllByOrderByCreatedAtDesc();

    @Query(value = "SELECT * FROM signalements s WHERE s.statut = CAST(:#{#statut.name()} AS statut_signalement_enum) ORDER BY s.created_at DESC", nativeQuery = true)
    List<Signalement> findByStatutOrderByCreatedAtDesc(@Param("statut") StatutSignalementEnum statut);

    void deleteByAnnonce_Id(UUID annonceId);
}

