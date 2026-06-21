package com.unihome.api.controller;

import com.unihome.api.dto.AvisEligibiliteDTO;
import com.unihome.api.dto.AvisRequestDTO;
import com.unihome.api.dto.AvisResponseDTO;
import com.unihome.api.service.AvisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/avis")
@RequiredArgsConstructor
public class AvisController {

    private final AvisService avisService;

    /** Public: list reviews for an annonce, newest first. */
    @GetMapping("/annonce/{annonceId}")
    public List<AvisResponseDTO> getAvisByAnnonce(@PathVariable UUID annonceId) {
        return avisService.getAvisByAnnonce(annonceId);
    }

    /**
     * Authenticated: tells the current student whether they can leave an avis
     * on this annonce. Returns a "not eligible" response for non-students.
     */
    @GetMapping("/eligibilite/{annonceId}")
    public AvisEligibiliteDTO getEligibilite(@PathVariable UUID annonceId) {
        return avisService.getEligibilite(currentEmail(), annonceId);
    }

    /**
     * Authenticated: create an avis as the currently logged-in student.
     * Identity is taken from the JWT, never from the request body.
     */
    @PostMapping
    public ResponseEntity<AvisResponseDTO> creerAvis(@RequestBody @Valid AvisRequestDTO dto) {
        AvisResponseDTO saved = avisService.creerAvis(currentEmail(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    private String currentEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return authentication.getName();
    }
}

