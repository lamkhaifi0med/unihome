package com.unihome.api.service;

import com.unihome.api.dto.AnnonceDetailDTO;
import com.unihome.api.dto.ChatbotAiRequest;
import com.unihome.api.dto.ChatbotAiResponse;
import com.unihome.api.dto.ChatbotOwnerListingDTO;
import com.unihome.api.dto.ChatbotRequestDTO;
import com.unihome.api.dto.ChatbotResponseDTO;
import com.unihome.api.dto.ChatbotSafeListingDTO;
import com.unihome.api.dto.ChatbotSuggestedListingDTO;
import com.unihome.api.dto.OwnerAnnonceDTO;
import com.unihome.api.entity.RoleEnum;
import com.unihome.api.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Spring-side orchestration of the chatbot.
 *
 * <p>Heavy lifting (database queries, ranking, negation handling) is now
 * performed by Gemini through the internal endpoints under
 * {@code /api/internal/chatbot/**}. This service is reduced to:</p>
 * <ul>
 *   <li>resolving the optional {@code currentAnnonce} from its UUID,</li>
 *   <li>resolving the owner's own listings when role=PROPRIETAIRE,</li>
 *   <li>forwarding the slim payload to the AI service,</li>
 *   <li>mapping the suggested IDs back to public listing cards for the UI.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private static final Duration TIMEOUT = Duration.ofSeconds(60);
    private static final List<String> DEFAULT_QUICK_REPLIES = List.of(
            "Trouver un studio proche de mon universite",
            "Comment fonctionne le score ?",
            "Signaler une arnaque",
            "Aide pour publier une annonce"
    );

    private final WebClient webClient;
    private final AnnonceService annonceService;
    private final UtilisateurRepository utilisateurRepository;

    public ChatbotResponseDTO chat(ChatbotRequestDTO request, Authentication authentication) {
        String sessionId = normalizeSessionId(request != null ? request.getSessionId() : null);
        String message = request != null ? request.getMessage() : null;
        if (message == null || message.isBlank()) {
            return new ChatbotResponseDTO(
                    "Ecrivez un message pour que je puisse vous aider.",
                    sessionId,
                    List.of(),
                    DEFAULT_QUICK_REPLIES
            );
        }

        String role = resolveRole(authentication);
        ChatbotSafeListingDTO currentAnnonce = resolveCurrentAnnonce(request);
        List<ChatbotOwnerListingDTO> ownerListings = resolveOwnerListings(role, authentication, request);
        boolean canDiscussOwnerListings = RoleEnum.PROPRIETAIRE.name().equals(role) && !ownerListings.isEmpty();

        ChatbotAiRequest aiRequest = new ChatbotAiRequest(
                message.trim(),
                sessionId,
                role,
                "fr",
                currentAnnonce,
                Map.of(),
                ownerListings,
                List.of(),
                Map.of(
                        "canRecommendListings", true,
                        "canDiscussOwnerListings", canDiscussOwnerListings,
                        "canRevealContacts", false
                )
        );

        ChatbotAiResponse aiResponse = callAiService(aiRequest);
        List<ChatbotSuggestedListingDTO> suggestedListings = buildSuggestedListings(aiResponse);

        String reply = aiResponse != null && aiResponse.getReply() != null && !aiResponse.getReply().isBlank()
                ? aiResponse.getReply()
                : fallbackReply(message, ownerListings);
        List<String> quickReplies = aiResponse != null && aiResponse.getQuickReplies() != null && !aiResponse.getQuickReplies().isEmpty()
                ? aiResponse.getQuickReplies()
                : DEFAULT_QUICK_REPLIES;

        return new ChatbotResponseDTO(reply, sessionId, suggestedListings, quickReplies);
    }

    private ChatbotAiResponse callAiService(ChatbotAiRequest aiRequest) {
        return webClient.post()
                .uri("/chat")
                .bodyValue(aiRequest)
                .retrieve()
                .bodyToMono(ChatbotAiResponse.class)
                .timeout(TIMEOUT)
                .onErrorResume(exception -> {
                    log.error("Chatbot AI service unreachable or returned an error: {}", exception.getMessage(), exception);
                    return Mono.just(new ChatbotAiResponse(
                            fallbackReply(aiRequest.getMessage(), aiRequest.getOwnerListings()),
                            List.of(),
                            Map.of(),
                            DEFAULT_QUICK_REPLIES
                    ));
                })
                .block();
    }

    /**
     * Resolves every UUID suggested by Gemini back to a full public listing
     * card. We look up each annonce by ID so the UI always shows fresh data
     * (title, score, photos) even if Gemini's tool results are a few seconds
     * old. Unresolvable IDs are silently dropped.
     */
    private List<ChatbotSuggestedListingDTO> buildSuggestedListings(ChatbotAiResponse aiResponse) {
        if (aiResponse == null
                || aiResponse.getSuggestedListingIds() == null
                || aiResponse.getSuggestedListingIds().isEmpty()) {
            return List.of();
        }

        Map<String, List<String>> reasonsById = aiResponse.getListingReasons() != null
                ? aiResponse.getListingReasons()
                : Collections.emptyMap();

        return aiResponse.getSuggestedListingIds().stream()
                .map(this::parseUuid)
                .filter(Objects::nonNull)
                .distinct()
                .map(this::loadSuggestedListing)
                .filter(Objects::nonNull)
                .map(detail -> new ChatbotSuggestedListingDTO(
                        detail.getId(),
                        detail.getTitre(),
                        detail.getLoyer(),
                        detail.getVille(),
                        detail.getTypeLogement(),
                        detail.getScoreConfiance(),
                        reasonsById.getOrDefault(detail.getId().toString(), List.of("Annonce validee", "Donnees publiques UniHome")),
                        "/annonces/" + detail.getId()
                ))
                .collect(Collectors.toList());
    }

    private AnnonceDetailDTO loadSuggestedListing(UUID annonceId) {
        try {
            return annonceService.getAnnonceDetail(annonceId, null, false);
        } catch (Exception exception) {
            log.debug("Suggested listing {} could not be resolved: {}", annonceId, exception.getMessage());
            return null;
        }
    }

    private ChatbotSafeListingDTO toSafeListing(AnnonceDetailDTO annonce) {
        return new ChatbotSafeListingDTO(
                annonce.getId(),
                annonce.getTitre(),
                annonce.getDescription(),
                annonce.getLoyer(),
                annonce.getChargesIncluses(),
                annonce.getVille(),
                annonce.getAdresse(),
                annonce.getSuperficie(),
                annonce.getTypeLogement(),
                annonce.getScoreConfiance(),
                annonce.getEquipements(),
                annonce.getPhotos(),
                null
        );
    }

    private ChatbotOwnerListingDTO toOwnerListing(OwnerAnnonceDTO annonce) {
        return new ChatbotOwnerListingDTO(
                annonce.getId(),
                annonce.getTitre(),
                annonce.getDescription(),
                annonce.getLoyer(),
                annonce.getVille(),
                annonce.getTypeLogement(),
                annonce.getStatut(),
                annonce.getScoreConfiance(),
                annonce.getRaisonStatut(),
                annonce.getNbSignalements(),
                annonce.getPhotos() != null ? annonce.getPhotos().size() : 0,
                annonce.getEquipements()
        );
    }

    private List<ChatbotOwnerListingDTO> resolveOwnerListings(
            String role,
            Authentication authentication,
            ChatbotRequestDTO request
    ) {
        if (!RoleEnum.PROPRIETAIRE.name().equals(role)
                || authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return List.of();
        }

        return utilisateurRepository.findByEmail(authentication.getName())
                .map(user -> {
                    List<OwnerAnnonceDTO> ownerAnnonces = annonceService.getAnnoncesProprietaire(user.getId());
                    UUID requestedOwnerAnnonceId = request != null ? request.getOwnerAnnonceId() : null;
                    if (requestedOwnerAnnonceId != null) {
                        return ownerAnnonces.stream()
                                .filter(annonce -> requestedOwnerAnnonceId.equals(annonce.getId()))
                                .findFirst()
                                .map(annonce -> List.of(toOwnerListing(annonce)))
                                .orElse(List.of());
                    }
                    return ownerAnnonces.stream()
                            .limit(10)
                            .map(this::toOwnerListing)
                            .collect(Collectors.toList());
                })
                .orElse(List.of());
    }

    private ChatbotSafeListingDTO resolveCurrentAnnonce(ChatbotRequestDTO request) {
        if (request == null || request.getCurrentAnnonceId() == null) {
            return null;
        }
        try {
            AnnonceDetailDTO detail = annonceService.getAnnonceDetail(request.getCurrentAnnonceId(), null, false);
            return toSafeListing(detail);
        } catch (Exception exception) {
            log.debug("Could not resolve currentAnnonce {}: {}", request.getCurrentAnnonceId(), exception.getMessage());
            return null;
        }
    }

    private String resolveRole(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return "ANONYMOUS";
        }
        return utilisateurRepository.findByEmail(authentication.getName())
                .map(user -> user.getRole() != null ? user.getRole().name() : "ANONYMOUS")
                .orElse("ANONYMOUS");
    }

    private String normalizeSessionId(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return sessionId;
    }

    private UUID parseUuid(String value) {
        try {
            return value != null ? UUID.fromString(value) : null;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private String fallbackReply(String message, List<ChatbotOwnerListingDTO> ownerListings) {
        String lower = message != null ? message.toLowerCase() : "";
        if (ownerListings != null && !ownerListings.isEmpty() && isOwnerListingQuestion(lower)) {
            String summaries = ownerListings.stream()
                    .limit(3)
                    .map(listing -> "- " + nullToEmpty(listing.getTitre())
                            + " : statut " + (listing.getStatut() != null ? listing.getStatut().name() : "non renseigne")
                            + ", score " + (listing.getScoreConfiance() != null ? listing.getScoreConfiance() + "/100" : "en attente")
                            + ". " + nullToEmpty(listing.getOwnerTrustMessage()))
                    .collect(Collectors.joining("\n"));
            return "Je peux vous aider sur vos propres annonces uniquement. Voici un resume de vos dernieres annonces :\n"
                    + summaries
                    + "\nVous pouvez me demander comment ameliorer une annonce precise.";
        }
        if (lower.contains("score") || lower.contains("confiance")) {
            return "Le score de confiance UniHome indique le niveau de coherence d'une annonce. Un score eleve aide a reperer les annonces les plus fiables, mais il ne remplace jamais une visite avant paiement.";
        }
        if (lower.contains("signaler") || lower.contains("arnaque") || lower.contains("fraude")) {
            return "Pour signaler une annonce suspecte, ouvrez sa page detail puis utilisez l'option de signalement. UniHome peut suspendre une annonce apres plusieurs signalements.";
        }
        if (lower.contains("publier") || lower.contains("proprietaire")) {
            return "Pour publier une annonce, un proprietaire cree son logement, ajoute photos, equipements, contacts et justificatif. L'annonce passe ensuite par l'analyse de confiance UniHome.";
        }
        return "Je peux vous aider a comprendre UniHome, chercher des logements valides, expliquer le score de confiance ou guider un proprietaire pour ameliorer son annonce.";
    }

    private boolean isOwnerListingQuestion(String lowerMessage) {
        return lowerMessage.contains("mon annonce")
                || lowerMessage.contains("mes annonces")
                || lowerMessage.contains("statut")
                || lowerMessage.contains("rejet")
                || lowerMessage.contains("attente")
                || lowerMessage.contains("amelior")
                || lowerMessage.contains("pourquoi");
    }

    private String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
