package com.unihome.api.controller;

import com.unihome.api.dto.UpdateUserProfileRequestDTO;
import com.unihome.api.dto.UserProfileResponseDTO;
import com.unihome.api.entity.Etudiant;
import com.unihome.api.entity.Proprietaire;
import com.unihome.api.entity.Utilisateur;
import com.unihome.api.repository.ConsultationRepository;
import com.unihome.api.repository.FavoriRepository;
import com.unihome.api.repository.UniversiteRepository;
import com.unihome.api.repository.UtilisateurRepository;
import com.unihome.api.service.PhotoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UtilisateurRepository utilisateurRepository;
    private final UniversiteRepository universiteRepository;
    private final FavoriRepository favoriRepository;
    private final ConsultationRepository consultationRepository;
    private final PhotoService photoService;

    @GetMapping("/me/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        Utilisateur utilisateur = getCurrentUser();
        long nbFavoris = 0;
        long nbConsultations = 0;
        if (utilisateur instanceof Etudiant etudiant) {
            nbFavoris = favoriRepository.countByIdEtudiantId(etudiant.getId());
            nbConsultations = consultationRepository.countDistinctAnnoncesByEtudiantId(etudiant.getId());
        }
        return ResponseEntity.ok(Map.of("nbFavoris", nbFavoris, "nbConsultations", nbConsultations));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponseDTO> getProfile() {
        Utilisateur utilisateur = getCurrentUser();
        return ResponseEntity.ok(toProfileDTO(utilisateur));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponseDTO> updateProfile(@Valid @RequestBody UpdateUserProfileRequestDTO dto) {
        Utilisateur utilisateur = getCurrentUser();

        if (dto.getNom() != null) {
            utilisateur.setNom(dto.getNom());
        }
        if (dto.getPrenom() != null) {
            utilisateur.setPrenom(dto.getPrenom());
        }

        if (utilisateur instanceof Etudiant etudiant) {
            if (dto.getBudgetMax() != null) {
                etudiant.setBudgetMax(dto.getBudgetMax());
            }
            if (dto.getVilleRecherche() != null) {
                etudiant.setVilleRecherche(dto.getVilleRecherche());
            }
            if (dto.getUniversiteId() != null) {
                var universite = universiteRepository.findById(dto.getUniversiteId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Universite introuvable"));
                etudiant.setUniversite(universite);
            }
        }

        if (utilisateur instanceof Proprietaire proprietaire) {
            if (dto.getTelephone() != null) {
                proprietaire.setTelephone(dto.getTelephone());
            }
        }

        Utilisateur saved = utilisateurRepository.save(utilisateur);
        return ResponseEntity.ok(toProfileDTO(saved));
    }

    @PostMapping("/me/cin")
    public ResponseEntity<UserProfileResponseDTO> updateCin(@RequestPart("cinFile") MultipartFile cinFile) {
        Utilisateur utilisateur = getCurrentUser();
        if (!(utilisateur instanceof Proprietaire proprietaire)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profil proprietaire requis");
        }
        if (cinFile == null || cinFile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier CIN requis");
        }

        String cinUrl = photoService.uploaderCin(cinFile);
        proprietaire.setPhotoCinUrl(cinUrl);
        proprietaire.setEstVerifieCin(false);
        Utilisateur saved = utilisateurRepository.save(proprietaire);
        return ResponseEntity.ok(toProfileDTO(saved));
    }

    private Utilisateur getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
    }

    private UserProfileResponseDTO toProfileDTO(Utilisateur utilisateur) {
        UUID universiteId = null;
        if (utilisateur instanceof Etudiant etudiant && etudiant.getUniversite() != null) {
            universiteId = etudiant.getUniversite().getId();
        }

        UserProfileResponseDTO dto = new UserProfileResponseDTO();
        dto.setId(utilisateur.getId());
        dto.setNom(utilisateur.getNom());
        dto.setPrenom(utilisateur.getPrenom());
        dto.setEmail(utilisateur.getEmail());
        dto.setRole(utilisateur.getRole());
        dto.setEmailConfirme(utilisateur.getEmailConfirme());
        dto.setEstVerifie(utilisateur.getEstVerifie());
        dto.setIsActive(utilisateur.getIsActive());

        if (utilisateur instanceof Etudiant etudiant) {
            dto.setBudgetMax(etudiant.getBudgetMax());
            dto.setVilleRecherche(etudiant.getVilleRecherche());
            dto.setUniversiteId(universiteId);
            if (etudiant.getUniversite() != null) {
                dto.setUniversiteNom(etudiant.getUniversite().getNom());
            }
        }
        if (utilisateur instanceof Proprietaire proprietaire) {
            dto.setNumeroCin(proprietaire.getNumeroCin());
            dto.setPhotoCinUrl(proprietaire.getPhotoCinUrl());
            dto.setEstVerifieCin(proprietaire.getEstVerifieCin());
            dto.setTelephone(proprietaire.getTelephone());
            dto.setNoteMoyenne(proprietaire.getNoteMoyenne());
            dto.setNbAvisTotal(proprietaire.getNbAvisTotal());
        }

        return dto;
    }
}

