package com.unihome.api.repository;

import com.unihome.api.entity.AnnonceEquipement;
import com.unihome.api.entity.AnnonceEquipementId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnonceEquipementRepository extends JpaRepository<AnnonceEquipement, AnnonceEquipementId> {

    /**
     * Find all equipements for a given annonce
     */
    List<AnnonceEquipement> findByIdAnnonceId(UUID annonceId);

    /**
     * Find all annonces that have a specific equipement
     */
    List<AnnonceEquipement> findByIdEquipementId(Integer equipementId);
}

