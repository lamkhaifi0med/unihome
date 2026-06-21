package com.unihome.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotAiRequest {

    private String message;
    private String sessionId;
    private String role;
    private String locale;
    private ChatbotSafeListingDTO currentAnnonce;
    private Map<String, Object> userProfile;
    private List<ChatbotOwnerListingDTO> ownerListings;
    private List<ChatbotSafeListingDTO> safeListings;
    private Map<String, Boolean> allowedTools;
}
