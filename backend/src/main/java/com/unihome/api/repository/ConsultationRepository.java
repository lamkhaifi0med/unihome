package com.unihome.api.repository;

import com.unihome.api.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, UUID> {
    boolean existsByEtudiant_IdAndAnnonce_IdAndContactsAffichesTrue(UUID etudiantId, UUID annonceId);
    long countByEtudiantId(UUID etudiantId);
    long countByAnnonce_Id(UUID annonceId);

    /** Nombre d'annonces distinctes consultees (le meme etudiant peut ouvrir une annonce plusieurs fois). */
    @Query("SELECT COUNT(DISTINCT c.annonce.id) FROM Consultation c WHERE c.etudiant.id = :etudiantId")
    long countDistinctAnnoncesByEtudiantId(UUID etudiantId);

    /** Nombre d'etudiants distincts ayant consulte l'annonce (vues cote proprietaire). */
    @Query("SELECT COUNT(DISTINCT c.etudiant.id) FROM Consultation c WHERE c.annonce.id = :annonceId")
    long countDistinctEtudiantsByAnnonceId(UUID annonceId);

    Optional<Consultation> findTopByEtudiantIdAndAnnonceIdOrderByCreatedAtDesc(UUID etudiantId, UUID annonceId);

    void deleteByAnnonce_Id(UUID annonceId);
}
