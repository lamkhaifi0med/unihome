package com.unihome.api.repository;

import com.unihome.api.entity.ContactAnnonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ContactAnnonceRepository extends JpaRepository<ContactAnnonce, UUID> {
}

