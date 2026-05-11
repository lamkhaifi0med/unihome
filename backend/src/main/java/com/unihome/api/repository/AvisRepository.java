package com.unihome.api.repository;

import com.unihome.api.entity.Avis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AvisRepository extends JpaRepository<Avis, UUID> {
    boolean existsByEtudiant_IdAndAnnonce_Id(UUID etudiantId, UUID annonceId);
}
