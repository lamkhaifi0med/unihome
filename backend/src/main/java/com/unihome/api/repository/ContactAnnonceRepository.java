package com.unihome.api.repository;

import com.unihome.api.entity.ContactAnnonce;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContactAnnonceRepository extends JpaRepository<ContactAnnonce, UUID> {
    List<ContactAnnonce> findByAnnonce_Id(UUID annonceId);

    void deleteByAnnonce_Id(UUID annonceId);
}

