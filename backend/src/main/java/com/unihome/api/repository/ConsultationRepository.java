package com.unihome.api.repository;

import com.unihome.api.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, UUID> {
    boolean existsByEtudiant_IdAndAnnonce_IdAndContactsAffichesTrue(UUID etudiantId, UUID annonceId);
}
