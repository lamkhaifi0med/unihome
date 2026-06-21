package com.unihome.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotAiResponse {

    private String reply;
    private List<String> suggestedListingIds;
    private Map<String, List<String>> listingReasons;
    private List<String> quickReplies;
}
