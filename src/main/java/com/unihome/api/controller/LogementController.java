package com.unihome.api.controller;

import com.unihome.api.dto.LogementRequestDTO;
import com.unihome.api.dto.LogementResponseDTO;
import com.unihome.api.entity.Logement;
import com.unihome.api.service.LogementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Point;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/logements")
@RequiredArgsConstructor
public class LogementController {

    private final LogementService logementService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LogementResponseDTO> creerLogement(
            @RequestPart("logement") @Valid LogementRequestDTO dto,
            @RequestPart(value = "justificatifFile", required = false) MultipartFile justificatifFile) {
        Logement logement = logementService.creerLogement(dto, justificatifFile);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponseDTO(logement));
    }

    private LogementResponseDTO toResponseDTO(Logement logement) {
        Point coordonnees = logement.getCoordonnees();
        Double latitude = coordonnees != null ? coordonnees.getY() : null;
        Double longitude = coordonnees != null ? coordonnees.getX() : null;

        return LogementResponseDTO.builder()
                .id(logement.getId())
                .proprietaireId(logement.getProprietaire() != null ? logement.getProprietaire().getId() : null)
                .adresse(logement.getAdresse())
                .ville(logement.getVille())
                .superficie(logement.getSuperficie())
                .typeLogement(logement.getTypeLogement())
                .statutLogement(logement.getStatutLogement())
                .latitude(latitude)
                .longitude(longitude)
                .createdAt(logement.getCreatedAt())
                .updatedAt(logement.getUpdatedAt())
                .build();
    }
}
