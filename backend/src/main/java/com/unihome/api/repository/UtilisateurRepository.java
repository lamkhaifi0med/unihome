package com.unihome.api.repository;

import com.unihome.api.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, UUID> {

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM Utilisateur u WHERE " +
            "(LOWER(u.nom) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.prenom) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY u.createdAt DESC")
    List<Utilisateur> searchUsers(@Param("search") String search);
}
