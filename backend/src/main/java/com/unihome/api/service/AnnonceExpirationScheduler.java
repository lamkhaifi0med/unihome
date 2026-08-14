package com.unihome.api.service;

import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.Logement;
import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.repository.AnnonceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Archive automatiquement les annonces dont la date d'expiration (90 jours
 * apres publication, calculee par trigger DB) est depassee.
 *
 * Seules VALIDEE et EN_ATTENTE expirent : les annonces SUSPENDUE restent sous
 * le controle de l'equipe de moderation. Le proprietaire peut desarchiver une
 * annonce expiree, ce qui la republie pour 90 jours.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AnnonceExpirationScheduler {

    private static final List<StatutAnnonceEnum> STATUTS_EXPIRABLES = List.of(
            StatutAnnonceEnum.VALIDEE,
            StatutAnnonceEnum.EN_ATTENTE
    );

    private final AnnonceRepository annonceRepository;
    private final EmailService emailService;

    @Scheduled(initialDelayString = "PT2M", fixedDelayString = "PT1H")
    @Transactional
    public void archiverAnnoncesExpirees() {
        List<Annonce> expirees = annonceRepository
                .findByStatutInAndDateExpirationBefore(STATUTS_EXPIRABLES, LocalDateTime.now());
        if (expirees.isEmpty()) {
            return;
        }

        for (Annonce annonce : expirees) {
            annonce.setStatut(StatutAnnonceEnum.ARCHIVEE);
            annonce.setRaisonStatut(
                    "Expirée automatiquement après 90 jours de publication. "
                    + "Désarchivez-la depuis \"Mes annonces\" pour la republier.");
            annonceRepository.save(annonce);

            Logement logement = annonce.getLogement();
            if (logement != null && logement.getProprietaire() != null
                    && logement.getProprietaire().getEmail() != null) {
                emailService.sendAnnonceExpiredEmail(
                        logement.getProprietaire().getEmail(),
                        annonce.getTitre());
            }
        }
        log.info("{} annonce(s) expirée(s) archivée(s) automatiquement", expirees.size());
    }
}
