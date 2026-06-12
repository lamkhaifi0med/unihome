package com.unihome.api.controller;

import com.unihome.api.service.FavoriService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/favoris")
@RequiredArgsConstructor
public class FavoriController {

    private final FavoriService favoriService;

    @GetMapping("/me")
    public List<UUID> getMesFavoris() {
        return favoriService.getFavorisIds(currentEmail());
    }

    @PostMapping("/{annonceId}")
    public ResponseEntity<Void> ajouterFavori(@PathVariable UUID annonceId) {
        favoriService.ajouterFavori(currentEmail(), annonceId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{annonceId}")
    public ResponseEntity<Void> supprimerFavori(@PathVariable UUID annonceId) {
        favoriService.supprimerFavori(currentEmail(), annonceId);
        return ResponseEntity.noContent().build();
    }

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
