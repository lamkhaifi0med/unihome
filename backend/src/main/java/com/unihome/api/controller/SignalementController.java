package com.unihome.api.controller;

import com.unihome.api.dto.SignalementRequestDTO;
import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.Etudiant;
import com.unihome.api.entity.Signalement;
import com.unihome.api.entity.StatutSignalementEnum;
import com.unihome.api.repository.AnnonceRepository;
import com.unihome.api.repository.EtudiantRepository;
import com.unihome.api.repository.SignalementRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/annonces")
@RequiredArgsConstructor
public class SignalementController {

    private final AnnonceRepository annonceRepository;
    private final EtudiantRepository etudiantRepository;
    private final SignalementRepository signalementRepository;

    @PostMapping("/{annonceId}/signaler")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<Void> signalerAnnonce(
            @PathVariable UUID annonceId,
            @RequestBody SignalementRequestDTO body) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Etudiant etudiant = etudiantRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Etudiant introuvable"));

        Annonce annonce = annonceRepository.findById(annonceId)
                .orElseThrow(() -> new EntityNotFoundException("Annonce introuvable"));

                if (signalementRepository.existsByEtudiant_IdAndAnnonce_Id(etudiant.getId(), annonce.getId())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Vous avez deja signale cette annonce");
                }

        Signalement signalement = new Signalement();
        signalement.setEtudiant(etudiant);
        signalement.setAnnonce(annonce);
        signalement.setRaison(body.getRaison());
        signalement.setDescription(body.getDescription());
        signalement.setStatut(StatutSignalementEnum.OUVERT);
                try {
                        signalementRepository.save(signalement);
                } catch (DataIntegrityViolationException exception) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Vous avez deja signale cette annonce", exception);
                }

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
