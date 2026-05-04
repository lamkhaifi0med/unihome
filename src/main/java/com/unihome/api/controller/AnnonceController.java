package com.unihome.api.controller;

import com.unihome.api.dto.AnnonceRequestDTO;
import com.unihome.api.dto.AnnonceRechercheDTO;
import com.unihome.api.service.AnnonceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/annonces")
@RequiredArgsConstructor
public class AnnonceController {

    private final AnnonceService annonceService;

    @PostMapping(value = "/publier", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnnonceRechercheDTO> publierAnnonce(
            @RequestParam UUID logementId,
            @Valid @ModelAttribute AnnonceRequestDTO annonceRequestDTO) {
        var savedAnnonce = annonceService.creerAnnonce(logementId, annonceRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(annonceService.buildRechercheDTO(savedAnnonce));
    }

    @GetMapping("/recherche")
    public List<AnnonceRechercheDTO> rechercherAnnonces() {
        return annonceService.getAnnoncesPourRecherche();
    }
}
