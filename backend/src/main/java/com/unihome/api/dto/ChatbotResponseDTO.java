package com.unihome.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotResponseDTO {

    private String reply;
    private String sessionId;
    private List<ChatbotSuggestedListingDTO> suggestedListings;
    private List<String> quickReplies;
}
