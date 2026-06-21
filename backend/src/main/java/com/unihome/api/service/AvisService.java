package com.unihome.api.service;

import com.unihome.api.dto.AvisEligibiliteDTO;
import com.unihome.api.dto.AvisRequestDTO;
import com.unihome.api.dto.AvisResponseDTO;
import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.Avis;
import com.unihome.api.entity.Consultation;
import com.unihome.api.entity.Etudiant;
import com.unihome.api.exception.IllegalReviewException;
import com.unihome.api.repository.AnnonceRepository;
import com.unihome.api.repository.AvisRepository;
import com.unihome.api.repository.ConsultationRepository;
import com.unihome.api.repository.EtudiantRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvisService {

    private final AvisRepository avisRepository;
    private final ConsultationRepository consultationRepository;
    private final EtudiantRepository etudiantRepository;
    private final AnnonceRepository annonceRepository;

    /**
     * Creates an avis for the connected student. The student identity is
     * resolved from the JWT (passed in via {@code currentEmail}), never from
     * the request body, so a logged-in user cannot impersonate someone else.
     *
     * Business rules enforced:
     *  - the student must have viewed contacts at least once (a consultation
     *    with contacts_affiches=true must exist),
     *  - at most one avis per (student, annonce) — enforced both by this
     *    check and the unique constraint on the DB table.
     *
     * The consultation row is looked up on the server (most recent matching
     * one) so the client does not need to send a consultation id.
     */
    @Transactional
    public AvisResponseDTO creerAvis(String currentEmail, AvisRequestDTO dto) {
        Etudiant etudiant = etudiantRepository.findByEmail(currentEmail)
            .orElseThrow(() -> new IllegalReviewException("Seuls les etudiants peuvent laisser un avis"));

        UUID etudiantId = etudiant.getId();
        UUID annonceId = dto.getAnnonceId();

        Consultation consultation = consultationRepository
            .findTopByEtudiantIdAndAnnonceIdOrderByCreatedAtDesc(etudiantId, annonceId)
            .filter(c -> Boolean.TRUE.equals(c.getContactsAffiches()))
            .orElseThrow(() -> new IllegalReviewException(
                "Vous devez consulter les contacts du proprietaire avant de laisser un avis"
            ));

        if (avisRepository.existsByEtudiant_IdAndAnnonce_Id(etudiantId, annonceId)) {
            throw new IllegalReviewException("Vous avez deja laisse un avis pour cette annonce");
        }

        Annonce annonce = annonceRepository.findById(annonceId)
            .orElseThrow(() -> new EntityNotFoundException("Annonce introuvable"));

        Avis avis = new Avis();
        avis.setEtudiant(etudiant);
        avis.setAnnonce(annonce);
        avis.setConsultation(consultation);
        avis.setNote(dto.getNote());
        avis.setCommentaire(dto.getCommentaire());
        avis.setValideParIa(false);

        // saveAndFlush forces Hibernate to run the INSERT inside this
        // method so @CreationTimestamp is populated before we read
        // saved.getCreatedAt() in toResponse() below.
        Avis saved = avisRepository.saveAndFlush(avis);
        return toResponse(saved);
    }

    /** Returns the list of public reviews for an annonce, newest first. */
    @Transactional(readOnly = true)
    public List<AvisResponseDTO> getAvisByAnnonce(UUID annonceId) {
        return avisRepository.findByAnnonce_IdOrderByCreatedAtDesc(annonceId).stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * Tells the caller (a student) whether they can leave an avis on this
     * annonce right now. Used by the UI to show the appropriate CTA or hint.
     *
     * If the caller is not a student (owner, admin, anonymous), the response
     * is "not eligible, no review possible".
     */
    @Transactional(readOnly = true)
    public AvisEligibiliteDTO getEligibilite(String currentEmail, UUID annonceId) {
        if (currentEmail == null || currentEmail.isBlank()) {
            return new AvisEligibiliteDTO(false, false, false, "NON_AUTHENTIFIE");
        }

        return etudiantRepository.findByEmail(currentEmail)
            .map(etudiant -> {
                UUID etudiantId = etudiant.getId();
                boolean hasViewedContacts = consultationRepository
                    .existsByEtudiant_IdAndAnnonce_IdAndContactsAffichesTrue(etudiantId, annonceId);
                boolean alreadyReviewed = avisRepository
                    .existsByEtudiant_IdAndAnnonce_Id(etudiantId, annonceId);

                String reason;
                if (alreadyReviewed) {
                    reason = "DEJA_AVIS";
                } else if (!hasViewedContacts) {
                    reason = "CONTACTS_NON_AFFICHES";
                } else {
                    reason = "OK";
                }

                return new AvisEligibiliteDTO(
                    hasViewedContacts && !alreadyReviewed,
                    alreadyReviewed,
                    hasViewedContacts,
                    reason
                );
            })
            .orElseGet(() -> new AvisEligibiliteDTO(false, false, false, "PAS_ETUDIANT"));
    }

    /**
     * Builds the public projection. Only the first letter of the surname is
     * exposed to preserve some privacy ("Sara B." rather than full last name).
     */
    private AvisResponseDTO toResponse(Avis avis) {
        Etudiant author = avis.getEtudiant();
        String prenom = author != null ? author.getPrenom() : null;
        String nom = author != null ? author.getNom() : null;
        String initiale = (nom != null && !nom.isBlank())
            ? String.valueOf(nom.charAt(0)).toUpperCase() + "."
            : null;
        return AvisResponseDTO.builder()
            .id(avis.getId())
            .note(avis.getNote())
            .commentaire(avis.getCommentaire())
            .createdAt(avis.getCreatedAt())
            .etudiantPrenom(prenom)
            .etudiantNomInitiale(initiale)
            .build();
    }
}

