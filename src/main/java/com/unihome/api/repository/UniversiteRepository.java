package com.unihome.api.repository;

import com.unihome.api.entity.Universite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UniversiteRepository extends JpaRepository<Universite, UUID> {
}

