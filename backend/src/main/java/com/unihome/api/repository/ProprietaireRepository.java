package com.unihome.api.repository;

import com.unihome.api.entity.Proprietaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProprietaireRepository extends JpaRepository<Proprietaire, UUID> {
    boolean existsByNumeroCin(String numeroCin);
}
