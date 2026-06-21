package com.unihome.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotRequestDTO {

    private String message;
    private String sessionId;
    private UUID currentAnnonceId;
    private UUID ownerAnnonceId;
    private String intentHint;
}
