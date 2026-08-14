package com.unihome.api.controller;

import com.unihome.api.entity.Equipement;
import com.unihome.api.repository.EquipementRepository;
import com.unihome.api.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Proxies natural-language search interpretation to the AI service.
 * The catalogue (campuses, cities, equipment) is loaded server-side so the
 * AI can only ever map onto real values; the Python side re-validates.
 */
@RestController
@RequestMapping("/api/annonces/recherche/interpret")
@RequiredArgsConstructor
@Slf4j
public class SearchInterpretController {

    private static final Duration TIMEOUT = Duration.ofSeconds(20);
    private static final List<String> TYPES =
            List.of("STUDIO", "CHAMBRE", "APPARTEMENT", "COLOCATION");

    private final WebClient webClient;
    private final UniversiteRepository universiteRepository;
    private final EquipementRepository equipementRepository;

    public record InterpretRequest(String query) {}

    @PostMapping
    public ResponseEntity<Map<String, Object>> interpret(@RequestBody InterpretRequest request) {
        if (request == null || request.query() == null || request.query().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String query = request.query().trim();
        if (query.length() > 300) {
            query = query.substring(0, 300);
        }

        List<Map<String, String>> universites = universiteRepository.findAll().stream()
                .map(u -> Map.of(
                        "id", u.getId().toString(),
                        "nom", u.getNom(),
                        "ville", u.getVille() != null ? u.getVille() : ""))
                .toList();
        List<String> villes = universites.stream()
                .map(u -> u.get("ville"))
                .filter(v -> !v.isBlank())
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new))
                .stream().sorted().toList();
        List<String> equipements = equipementRepository.findAll().stream()
                .map(Equipement::getLibelle)
                .filter(Objects::nonNull)
                .toList();

        Map<String, Object> payload = Map.of(
                "query", query,
                "universites", universites,
                "villes", villes,
                "equipements", equipements,
                "types", TYPES);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = webClient.post()
                    .uri("/parse-search")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(TIMEOUT)
                    .block();
            return ResponseEntity.ok(result != null ? result : Map.of());
        } catch (Exception exception) {
            log.warn("Search interpretation unavailable: {}", exception.getMessage());
            return ResponseEntity.status(503).build();
        }
    }
}
