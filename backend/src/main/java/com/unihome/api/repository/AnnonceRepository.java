package com.unihome.api.repository;

import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.StatutAnnonceEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnnonceRepository extends JpaRepository<Annonce, UUID>, JpaSpecificationExecutor<Annonce> {

    List<Annonce> findByStatut(StatutAnnonceEnum statut);

    List<Annonce> findByStatutIn(List<StatutAnnonceEnum> statuts);

    long countByStatut(StatutAnnonceEnum statut);

    List<Annonce> findByLogementIdOrderByDatePublicationDesc(UUID logementId);

    List<Annonce> findByLogementProprietaireIdOrderByDatePublicationDesc(UUID proprietaireId);

    @Query("""
        SELECT a
        FROM Annonce a
        JOIN FETCH a.logement l
        JOIN FETCH l.proprietaire p
        WHERE a.statut = 'VALIDEE' AND a.dateExpiration > CURRENT_TIMESTAMP
        ORDER BY a.datePublication DESC
    """)
    List<Annonce> findActiveAnnonces();

    Optional<Annonce> findFirstByLogementIdAndStatutInOrderByDatePublicationDesc(UUID logementId,
                                                                                List<StatutAnnonceEnum> statuts);

    List<Annonce> findByStatutInAndDateExpirationBefore(List<StatutAnnonceEnum> statuts, LocalDateTime limite);

    long countByLogementId(UUID logementId);
}
