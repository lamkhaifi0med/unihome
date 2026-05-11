package com.unihome.api.service;

import com.unihome.api.dto.AnnonceAiRequest;
import com.unihome.api.dto.FraudScoreResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnnonceAiClient {

    private static final Duration TIMEOUT = Duration.ofSeconds(3);

    private final WebClient webClient;

    public FraudScoreResponse analyserAnnonce(AnnonceAiRequest request) {
        return webClient.post()
                .uri("/analyze-listing")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(FraudScoreResponse.class)
                .timeout(TIMEOUT)
                .onErrorResume(exception -> {
                    log.error("AI service unreachable or returned an error: {}", exception.getMessage(), exception);
                    return Mono.empty();
                })
                .block();
    }
}

