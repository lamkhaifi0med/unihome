package com.unihome.api.repository;

import com.unihome.api.entity.Avis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AvisRepository extends JpaRepository<Avis, UUID> {
    boolean existsByEtudiant_IdAndAnnonce_Id(UUID etudiantId, UUID annonceId);

    /**
     * Returns reviews for a given annonce, newest first. Used by the public
     * annonce detail page to display the review list.
     */
    List<Avis> findByAnnonce_IdOrderByCreatedAtDesc(UUID annonceId);
}
