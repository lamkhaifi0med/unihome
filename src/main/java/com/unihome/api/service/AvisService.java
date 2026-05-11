package com.unihome.api.service;

import com.unihome.api.dto.AvisRequestDTO;
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

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvisService {

    private final AvisRepository avisRepository;
    private final ConsultationRepository consultationRepository;
    private final EtudiantRepository etudiantRepository;
    private final AnnonceRepository annonceRepository;

    @Transactional
    public Avis creerAvis(AvisRequestDTO dto) {
        UUID etudiantId = dto.getEtudiantId();
        UUID annonceId = dto.getAnnonceId();

        boolean hasViewedContacts = consultationRepository
            .existsByEtudiant_IdAndAnnonce_IdAndContactsAffichesTrue(etudiantId, annonceId);
        if (!hasViewedContacts) {
            throw new IllegalReviewException("Vous devez consulter les contacts avant de laisser un avis");
        }

        if (avisRepository.existsByEtudiant_IdAndAnnonce_Id(etudiantId, annonceId)) {
            throw new IllegalReviewException("Un seul avis par annonce est autorise");
        }

        Consultation consultation = consultationRepository.findById(dto.getConsultationId())
            .orElseThrow(() -> new EntityNotFoundException("Consultation not found"));
        if (!consultation.getEtudiant().getId().equals(etudiantId)
            || !consultation.getAnnonce().getId().equals(annonceId)) {
            throw new IllegalReviewException("La consultation ne correspond pas a l'etudiant ou a l'annonce");
        }

        Etudiant etudiant = etudiantRepository.findById(etudiantId)
            .orElseThrow(() -> new EntityNotFoundException("Etudiant not found"));
        Annonce annonce = annonceRepository.findById(annonceId)
            .orElseThrow(() -> new EntityNotFoundException("Annonce not found"));

        Avis avis = new Avis();
        avis.setEtudiant(etudiant);
        avis.setAnnonce(annonce);
        avis.setConsultation(consultation);
        avis.setNote(dto.getNote());
        avis.setCommentaire(dto.getCommentaire());
        avis.setValideParIa(false);

        return avisRepository.save(avis);
    }
}

