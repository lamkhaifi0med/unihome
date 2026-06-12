package com.unihome.api.controller;

import com.unihome.api.dto.AdminAnnonceQueueDTO;
import com.unihome.api.dto.AdminDecisionRequestDTO;
import com.unihome.api.dto.AdminStatsDTO;
import com.unihome.api.dto.SignalementDTO;
import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.Logement;
import com.unihome.api.entity.Proprietaire;
import com.unihome.api.entity.Signalement;
import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.entity.StatutSignalementEnum;
import com.unihome.api.entity.Utilisateur;
import com.unihome.api.repository.AnnonceRepository;
import com.unihome.api.repository.PhotoRepository;
import com.unihome.api.repository.SignalementRepository;
import com.unihome.api.repository.UtilisateurRepository;
import com.unihome.api.service.EmailService;
import com.unihome.api.util.AiReasonMessages;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnnonceController {

    private final AnnonceRepository annonceRepository;
    private final PhotoRepository photoRepository;
    private final SignalementRepository signalementRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EmailService emailService;

    @GetMapping("/stats")
    public AdminStatsDTO getStats() {
        return new AdminStatsDTO(
                utilisateurRepository.count(),
                annonceRepository.count(),
                annonceRepository.countByStatut(StatutAnnonceEnum.EN_ATTENTE),
                annonceRepository.countByStatut(StatutAnnonceEnum.VALIDEE),
                annonceRepository.countByStatut(StatutAnnonceEnum.SUSPENDUE),
                signalementRepository.countByStatut(StatutSignalementEnum.OUVERT)
        );
    }

    @GetMapping("/annonces/queue")
    public List<AdminAnnonceQueueDTO> getQueue() {
        return annonceRepository
                .findByStatutIn(List.of(StatutAnnonceEnum.EN_ATTENTE, StatutAnnonceEnum.SUSPENDUE))
                .stream()
                .map(this::toQueueDTO)
                .collect(Collectors.toList());
    }

    @PostMapping("/annonces/{id}/valider")
    public ResponseEntity<Void> valider(@PathVariable UUID id) {
        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Annonce introuvable"));
        annonce.setStatut(StatutAnnonceEnum.VALIDEE);
        annonceRepository.save(annonce);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/annonces/{id}/rejeter")
    public ResponseEntity<Void> rejeter(@PathVariable UUID id,
                                        @RequestBody(required = false) AdminDecisionRequestDTO body) {
        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Annonce introuvable"));
        annonce.setStatut(StatutAnnonceEnum.REJETEE);
        if (body != null && body.getRaison() != null) {
            annonce.setRaisonStatut(body.getRaison());
        }
        annonceRepository.save(annonce);

        // Notify the owner
        Proprietaire proprietaire = (Proprietaire) annonce.getLogement().getProprietaire();
        try {
            emailService.sendAnnonceRejectionEmail(
                    proprietaire.getEmail(),
                    annonce.getTitre(),
                    body != null ? body.getRaison() : null);
        } catch (Exception ignored) {
            // Email failure must never break the moderation action
        }
        return ResponseEntity.ok().build();
    }

    // ─── Signalement Admin Endpoints ───────────────────────────────────────────

    @GetMapping("/signalements")
    public List<SignalementDTO> getSignalements(
            @RequestParam(required = false) StatutSignalementEnum statut) {
        List<Signalement> list = statut != null
                ? signalementRepository.findByStatutOrderByCreatedAtDesc(statut)
                : signalementRepository.findAllByOrderByCreatedAtDesc();
        return list.stream().map(this::toSignalementDTO).collect(Collectors.toList());
    }

    @PostMapping("/signalements/{id}/traiter")
    public ResponseEntity<Void> traiterSignalement(@PathVariable UUID id) {
        Signalement s = signalementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Signalement introuvable"));
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Utilisateur> admin = utilisateurRepository.findByEmail(email);
        s.setStatut(StatutSignalementEnum.TRAITE);
        s.setTraiteAt(LocalDateTime.now());
        admin.ifPresent(s::setAdmin);
        signalementRepository.save(s);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/signalements/{id}/rejeter")
    public ResponseEntity<Void> rejeterSignalement(@PathVariable UUID id) {
        Signalement s = signalementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Signalement introuvable"));
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Utilisateur> admin = utilisateurRepository.findByEmail(email);
        s.setStatut(StatutSignalementEnum.REJETE);
        s.setTraiteAt(LocalDateTime.now());
        admin.ifPresent(s::setAdmin);
        signalementRepository.save(s);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/signalements/{id}/suspendre-annonce")
    public ResponseEntity<Void> suspendreAnnonceDepuisSignalement(@PathVariable UUID id,
                                                                  @RequestBody(required = false) AdminDecisionRequestDTO body) {
        Signalement s = signalementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Signalement introuvable"));
        Annonce annonce = s.getAnnonce();
        if (annonce == null) {
            throw new EntityNotFoundException("Annonce introuvable");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Optional<Utilisateur> admin = utilisateurRepository.findByEmail(email);
        String raison = body != null && body.getRaison() != null && !body.getRaison().isBlank()
                ? body.getRaison()
                : "Annonce suspendue suite à un signalement confirmé.";

        annonce.setStatut(StatutAnnonceEnum.SUSPENDUE);
        annonce.setRaisonStatut(raison);
        annonceRepository.save(annonce);

        s.setStatut(StatutSignalementEnum.TRAITE);
        s.setTraiteAt(LocalDateTime.now());
        admin.ifPresent(s::setAdmin);
        signalementRepository.save(s);

        try {
            Proprietaire proprietaire = (Proprietaire) annonce.getLogement().getProprietaire();
            emailService.sendAnnonceSuspensionAfterReportEmail(
                    proprietaire.getEmail(),
                    annonce.getTitre(),
                    raison);
        } catch (Exception ignored) {
            // Email failure must never break the moderation action
        }
        return ResponseEntity.ok().build();
    }

    private SignalementDTO toSignalementDTO(Signalement s) {
        Annonce annonce = s.getAnnonce();
        Logement logement = annonce != null ? annonce.getLogement() : null;
        Proprietaire proprietaire = logement != null ? (Proprietaire) logement.getProprietaire() : null;
        List<String> photos = annonce != null
            ? photoRepository.findByAnnonce_IdOrderByOrdreAsc(annonce.getId())
                .stream()
                .map(p -> p.getUrl())
                .collect(Collectors.toList())
            : List.of();
        return new SignalementDTO(
                s.getId(),
                annonce != null ? annonce.getId() : null,
                annonce != null ? annonce.getTitre() : null,
                s.getEtudiant() != null ? s.getEtudiant().getId() : null,
                s.getEtudiant() != null ? s.getEtudiant().getNom() : null,
                s.getEtudiant() != null ? s.getEtudiant().getPrenom() : null,
                s.getRaison(),
                s.getDescription(),
                s.getStatut(),
                s.getCreatedAt(),
                s.getTraiteAt(),
                annonce != null ? annonce.getStatut() : null,
                logement != null ? logement.getVille() : null,
                annonce != null ? annonce.getLoyer() : null,
            logement != null ? logement.getAdresse() : null,
            photos,
            s.getEtudiant() != null ? s.getEtudiant().getEmail() : null,
                proprietaire != null ? proprietaire.getNom() : null,
            proprietaire != null ? proprietaire.getPrenom() : null,
            proprietaire != null ? proprietaire.getEmail() : null,
            proprietaire != null ? proprietaire.getTelephone() : null
        );
    }

    private AdminAnnonceQueueDTO toQueueDTO(Annonce annonce) {
        Logement logement = annonce.getLogement();
        Proprietaire proprietaire = logement != null ? (Proprietaire) logement.getProprietaire() : null;
        List<String> photos = photoRepository.findByAnnonce_IdOrderByOrdreAsc(annonce.getId())
                .stream()
                .map(p -> p.getUrl())
                .collect(Collectors.toList());

        return new AdminAnnonceQueueDTO(
                annonce.getId(),
                annonce.getTitre(),
                annonce.getDescription(),
                annonce.getLoyer(),
                annonce.getChargesIncluses(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
                annonce.getDetailScore(),
                AiReasonMessages.forRole(annonce.getRaisonStatut(), "admin", annonce.getRaisonStatut()),
                annonce.getNbSignalements(),
                annonce.getDatePublication(),
                logement != null ? logement.getAdresse() : null,
                logement != null ? logement.getVille() : null,
                logement != null ? logement.getSuperficie() : null,
                logement != null ? logement.getTypeLogement() : null,
                logement != null ? logement.getJustificatifUrl() : null,
                proprietaire != null ? proprietaire.getId() : null,
                proprietaire != null ? proprietaire.getNom() : null,
                proprietaire != null ? proprietaire.getPrenom() : null,
                proprietaire != null ? proprietaire.getEstVerifieCin() : null,
                proprietaire != null ? proprietaire.getPhotoCinUrl() : null,
                proprietaire != null ? proprietaire.getNumeroCin() : null,
                photos
        );
    }
}
