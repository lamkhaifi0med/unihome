package com.unihome.api.repository;

import com.unihome.api.entity.Recommandation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RecommandationRepository extends JpaRepository<Recommandation, UUID> {

    void deleteByAnnonce_Id(UUID annonceId);
}

