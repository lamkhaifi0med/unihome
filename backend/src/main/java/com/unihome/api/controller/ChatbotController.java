package com.unihome.api.controller;

import com.unihome.api.dto.ChatbotRequestDTO;
import com.unihome.api.dto.ChatbotResponseDTO;
import com.unihome.api.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping
    public ResponseEntity<ChatbotResponseDTO> chat(
            @RequestBody ChatbotRequestDTO request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(chatbotService.chat(request, authentication));
    }
}
