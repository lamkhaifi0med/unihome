package com.unihome.api.controller;

import com.unihome.api.dto.AnnonceDetailDTO;
import com.unihome.api.dto.AnnonceSearchRequest;
import com.unihome.api.dto.AnnonceSearchResult;
import com.unihome.api.dto.OwnerAnnonceDTO;
import com.unihome.api.service.AnnonceSearchService;
import com.unihome.api.service.AnnonceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Internal endpoints used by the AI service (Gemini function-calling) to
 * query the database safely. All routes under {@code /api/internal/**} are
 * protected by {@link com.unihome.api.security.InternalApiKeyFilter} and
 * never exposed to end-users.
 *
 * <p>Endpoints are read-only and only return data the caller could otherwise
 * reach through the public API. The search endpoint enforces
 * {@code statut=VALIDEE}; the owner endpoint must be called with the
 * owner's own UUID (the AI service determines that from the authenticated
 * frontend session before invoking the tool).</p>
 */
@RestController
@RequestMapping("/api/internal/chatbot")
@RequiredArgsConstructor
@Slf4j
public class InternalChatbotController {

    private final AnnonceSearchService annonceSearchService;
    private final AnnonceService annonceService;

    @PostMapping("/search")
    public ResponseEntity<List<AnnonceSearchResult>> search(
            @Valid @RequestBody AnnonceSearchRequest request
    ) {
        log.debug("Internal /search invoked: {}", request);
        return ResponseEntity.ok(annonceSearchService.search(request));
    }

    @GetMapping("/annonces/{annonceId}")
    public ResponseEntity<AnnonceDetailDTO> getAnnonce(@PathVariable UUID annonceId) {
        AnnonceDetailDTO detail = annonceService.getAnnonceDetail(annonceId, null, false);
        return ResponseEntity.ok(detail);
    }

    @GetMapping("/owner/{ownerId}/annonces")
    public ResponseEntity<List<OwnerAnnonceDTO>> getOwnerAnnonces(@PathVariable UUID ownerId) {
        return ResponseEntity.ok(annonceService.getAnnoncesProprietaire(ownerId));
    }
}
