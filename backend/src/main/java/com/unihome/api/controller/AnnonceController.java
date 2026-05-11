package com.unihome.api.controller;

import com.unihome.api.dto.AnnonceRequestDTO;
import com.unihome.api.dto.AnnonceResponseDTO;
import com.unihome.api.dto.AnnonceRechercheDTO;
import com.unihome.api.service.AnnonceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
    public ResponseEntity<AnnonceResponseDTO> publierAnnonce(
            @RequestParam UUID logementId,
            @Valid @ModelAttribute AnnonceRequestDTO annonceRequestDTO) {
        var savedAnnonce = annonceService.creerAnnonce(logementId, annonceRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(annonceService.buildResponseDTO(savedAnnonce));
    }

    @GetMapping(value = "/recherche", params = "universiteId")
    public Page<AnnonceRechercheDTO> rechercherAnnoncesProches(
            @RequestParam UUID universiteId,
            @RequestParam(defaultValue = "2000") Double rayon,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("distanceCampusM").ascending());
        return annonceService.rechercherAnnoncesProches(universiteId, rayon, pageable);
    }

    @GetMapping("/recherche")
    public List<AnnonceRechercheDTO> rechercherAnnonces() {
        return annonceService.getAnnoncesPourRecherche();
    }
}
