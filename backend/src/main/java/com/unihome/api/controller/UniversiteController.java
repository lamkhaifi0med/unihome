package com.unihome.api.controller;

import com.unihome.api.dto.UniversiteListItemDTO;
import com.unihome.api.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/universites")
@RequiredArgsConstructor
public class UniversiteController {

    private final UniversiteRepository universiteRepository;

    @GetMapping
    public ResponseEntity<List<UniversiteListItemDTO>> listUniversites() {
        var universites = universiteRepository.findAll(Sort.by("nom").ascending());
        var payload = universites.stream()
                .map(universite -> {
                    var coordonnees = universite.getCoordonnees();
                    return new UniversiteListItemDTO(
                            universite.getId(),
                            universite.getNom(),
                            universite.getVille(),
                            coordonnees != null ? coordonnees.getY() : null,
                            coordonnees != null ? coordonnees.getX() : null);
                })
                .toList();
        return ResponseEntity.ok(payload);
    }
}

