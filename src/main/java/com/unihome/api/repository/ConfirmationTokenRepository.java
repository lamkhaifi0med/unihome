package com.unihome.api.repository;

import com.unihome.api.entity.ConfirmationToken;
import com.unihome.api.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConfirmationTokenRepository extends JpaRepository<ConfirmationToken, UUID> {

    Optional<ConfirmationToken> findByToken(String token);

    void deleteByUtilisateur(Utilisateur utilisateur);

    void deleteByExpiresAtBefore(LocalDateTime expiresAt);
}
