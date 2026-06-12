package com.unihome.api.controller;

import com.unihome.api.dto.AdminDecisionRequestDTO;
import com.unihome.api.dto.AdminUserDTO;
import com.unihome.api.entity.Annonce;
import com.unihome.api.entity.Proprietaire;
import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.entity.Utilisateur;
import com.unihome.api.repository.AnnonceRepository;
import com.unihome.api.repository.UtilisateurRepository;
import com.unihome.api.service.EmailService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UtilisateurRepository utilisateurRepository;
    private final AnnonceRepository annonceRepository;
    private final EmailService emailService;

    @GetMapping
    public List<AdminUserDTO> listUsers(@RequestParam(required = false) String search) {
        String normalizedSearch = search == null ? "" : search.trim();
        return utilisateurRepository.searchUsers(normalizedSearch)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @PostMapping("/{id}/suspendre")
    @Transactional
    public ResponseEntity<Void> suspendre(@PathVariable UUID id) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        user.setIsActive(false);
        utilisateurRepository.save(user);

        // Suspend all their active annonces if they're a proprietaire (Bible §16.4)
        if (user instanceof Proprietaire) {
            List<Annonce> annonces = annonceRepository
                    .findByLogementProprietaireIdOrderByDatePublicationDesc(id);
            annonces.stream()
                    .filter(a -> a.getStatut() == StatutAnnonceEnum.VALIDEE
                            || a.getStatut() == StatutAnnonceEnum.EN_ATTENTE)
                    .forEach(a -> {
                        a.setStatut(StatutAnnonceEnum.SUSPENDUE);
                        annonceRepository.save(a);
                    });
        }

        try {
            emailService.sendAccountSuspensionEmail(
                    user.getEmail(), user.getPrenom() + " " + user.getNom());
        } catch (Exception ignored) {}

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reactiver")
    @Transactional
    public ResponseEntity<Void> reactiver(@PathVariable UUID id) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        user.setIsActive(true);
        utilisateurRepository.save(user);
        // Per Bible §16.4: listings are NOT auto-reactivated — admin must do it manually
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/valider-cin")
    @Transactional
    public ResponseEntity<Void> validerCin(@PathVariable UUID id) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        if (!(user instanceof Proprietaire proprietaire)) {
            return ResponseEntity.badRequest().build();
        }
        proprietaire.setEstVerifieCin(true);
        utilisateurRepository.save(proprietaire);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/demander-nouveau-cin")
    @Transactional
    public ResponseEntity<Void> demanderNouveauCin(@PathVariable UUID id,
                                                   @RequestBody(required = false) AdminDecisionRequestDTO body) {
        Utilisateur user = utilisateurRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        if (!(user instanceof Proprietaire proprietaire)) {
            return ResponseEntity.badRequest().build();
        }

        proprietaire.setEstVerifieCin(false);
        utilisateurRepository.save(proprietaire);

        String raison = body != null ? body.getRaison() : null;
        try {
            emailService.sendCinResubmissionRequestEmail(
                    proprietaire.getEmail(),
                    proprietaire.getPrenom() + " " + proprietaire.getNom(),
                    raison);
        } catch (Exception ignored) {}

        return ResponseEntity.ok().build();
    }

    private AdminUserDTO toDTO(Utilisateur u) {
        AdminUserDTO dto = new AdminUserDTO();
        dto.setId(u.getId());
        dto.setNom(u.getNom());
        dto.setPrenom(u.getPrenom());
        dto.setEmail(u.getEmail());
        dto.setRole(u.getRole());
        dto.setIsActive(u.getIsActive());
        dto.setEmailConfirme(u.getEmailConfirme());
        dto.setCreatedAt(u.getCreatedAt());
        if (u instanceof Proprietaire p) {
            dto.setEstVerifieCin(p.getEstVerifieCin());
            dto.setNumeroCin(p.getNumeroCin());
            dto.setPhotoCinUrl(p.getPhotoCinUrl());
            dto.setNoteMoyenne(p.getNoteMoyenne());
            dto.setNbAvisTotal(p.getNbAvisTotal());
        }
        return dto;
    }
}
