package com.unihome.api.repository;

import com.unihome.api.entity.Favori;
import com.unihome.api.entity.FavoriId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FavoriRepository extends JpaRepository<Favori, FavoriId> {

    /**
     * Find all favorites by etudiant ID
     */
    List<Favori> findByIdEtudiantId(UUID etudiantId);

    /**
     * Find all favorites by annonce ID
     */
    List<Favori> findByIdAnnonceId(UUID annonceId);
}

