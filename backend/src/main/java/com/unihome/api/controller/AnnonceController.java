package com.unihome.api.controller;

import com.unihome.api.dto.AnnonceDetailDTO;
import com.unihome.api.dto.AnnonceRequestDTO;
import com.unihome.api.dto.AnnonceResponseDTO;
import com.unihome.api.dto.AnnonceRechercheDTO;
import com.unihome.api.dto.AnnonceUpdateRequestDTO;
import com.unihome.api.dto.OwnerAnnonceDTO;
import com.unihome.api.repository.UtilisateurRepository;
import com.unihome.api.service.AnnonceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/annonces")
@RequiredArgsConstructor
public class AnnonceController {

    private final AnnonceService annonceService;
    private final UtilisateurRepository utilisateurRepository;

    @PostMapping(value = "/publier", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnnonceResponseDTO> publierAnnonce(
            @RequestParam UUID logementId,
            @Valid @ModelAttribute AnnonceRequestDTO annonceRequestDTO) {
        var savedAnnonce = annonceService.creerAnnonce(logementId, annonceRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(annonceService.buildResponseDTO(savedAnnonce));
    }

    @GetMapping("/proprietaire/{proprietaireId}")
    public List<OwnerAnnonceDTO> getAnnoncesProprietaire(@PathVariable UUID proprietaireId) {
        return annonceService.getAnnoncesProprietaire(proprietaireId);
    }

    @PutMapping(value = "/{annonceId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public AnnonceResponseDTO modifierAnnonce(
            @PathVariable UUID annonceId,
            @Valid @ModelAttribute AnnonceUpdateRequestDTO annonceUpdateRequestDTO) {
        var annonce = annonceService.modifierAnnonce(annonceId, currentUserId(), annonceUpdateRequestDTO);
        return annonceService.buildResponseDTO(annonce);
    }

    @PostMapping("/{annonceId}/archiver")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public AnnonceResponseDTO archiverAnnonce(@PathVariable UUID annonceId) {
        var annonce = annonceService.archiverAnnonceProprietaire(annonceId, currentUserId());
        return annonceService.buildResponseDTO(annonce);
    }

    @PostMapping("/{annonceId}/desarchiver")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public AnnonceResponseDTO desarchiverAnnonce(@PathVariable UUID annonceId) {
        var annonce = annonceService.desarchiverAnnonce(annonceId, currentUserId());
        return annonceService.buildResponseDTO(annonce);
    }

    @DeleteMapping("/{annonceId}")
    @PreAuthorize("hasRole('PROPRIETAIRE')")
    public ResponseEntity<Void> supprimerAnnonce(@PathVariable UUID annonceId) {
        annonceService.supprimerAnnonce(annonceId, currentUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{annonceId}")
    public AnnonceDetailDTO getAnnonceDetail(
            @PathVariable UUID annonceId,
            @RequestParam(defaultValue = "false") boolean includeContacts) {
        UUID currentUserId = currentUserId();
        return annonceService.getAnnonceDetail(annonceId, currentUserId, includeContacts && currentUserId != null);
    }

    @GetMapping("/recherche/campus")
    public Page<AnnonceRechercheDTO> rechercherAnnoncesProches(
            @RequestParam UUID universiteId,
            @RequestParam(defaultValue = "2000") Double rayon,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size);
        return annonceService.rechercherAnnoncesProches(universiteId, rayon, pageable);
    }

    @GetMapping("/recherche")
    public List<AnnonceRechercheDTO> rechercherAnnonces() {
        return annonceService.getAnnoncesPourRecherche();
    }

    private UUID currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return utilisateurRepository.findByEmail(authentication.getName())
                .map(com.unihome.api.entity.Utilisateur::getId)
                .orElse(null);
    }
}
