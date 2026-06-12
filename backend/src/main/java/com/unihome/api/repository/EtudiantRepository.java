package com.unihome.api.repository;

import com.unihome.api.entity.Etudiant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EtudiantRepository extends JpaRepository<Etudiant, UUID> {
    java.util.Optional<Etudiant> findByEmail(String email);
}

