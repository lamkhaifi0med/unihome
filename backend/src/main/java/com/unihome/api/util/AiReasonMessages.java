package com.unihome.api.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unihome.api.entity.StatutAnnonceEnum;

import java.util.LinkedHashMap;
import java.util.Map;

public final class AiReasonMessages {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private AiReasonMessages() {
    }

    public static String toPayloadJson(
            Short scoreGlobal,
            StatutAnnonceEnum decision,
            String adminReason,
            Map<String, String> roleMessages
    ) {
        Map<String, String> messages = new LinkedHashMap<>();
        if (roleMessages != null) {
            putIfPresent(messages, "student", roleMessages.get("student"));
            putIfPresent(messages, "owner", roleMessages.get("owner"));
            putIfPresent(messages, "admin", roleMessages.get("admin"));
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("format", "unihome-ai-reason-v1");
        payload.put("scoreGlobal", scoreGlobal);
        payload.put("decision", decision != null ? decision.name() : null);
        payload.put("messages", messages);
        payload.put("adminRaison", adminReason);

        try {
            return JSON.writeValueAsString(payload);
        } catch (Exception ignored) {
            return adminReason;
        }
    }

    public static String forRole(String storedReason, String role, String fallback) {
        if (storedReason == null || storedReason.isBlank()) {
            return fallback;
        }

        String trimmed = storedReason.trim();
        if (!trimmed.startsWith("{")) {
            return fallback != null ? fallback : storedReason;
        }

        try {
            Map<String, Object> payload = JSON.readValue(trimmed, MAP_TYPE);
            Object messagesObject = payload.get("messages");
            if (messagesObject instanceof Map<?, ?> messages) {
                Object value = messages.get(role);
                if (value instanceof String message && !message.isBlank()) {
                    return message;
                }
            }

            Object adminReason = payload.get("adminRaison");
            if ("admin".equals(role) && adminReason instanceof String message && !message.isBlank()) {
                return message;
            }
        } catch (Exception ignored) {
            return fallback != null ? fallback : storedReason;
        }

        return fallback != null ? fallback : storedReason;
    }

    private static void putIfPresent(Map<String, String> messages, String key, String value) {
        if (value != null && !value.isBlank()) {
            messages.put(key, value);
        }
    }
}