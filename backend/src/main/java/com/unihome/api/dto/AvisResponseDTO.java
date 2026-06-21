package com.unihome.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Public projection of an avis (review) sent back to clients.
 * Intentionally omits internal flags (valideParIa) and FK ids
 * (consultationId, etudiantId) to limit information disclosure.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvisResponseDTO {

    private UUID id;
    private Short note;
    private String commentaire;
    private LocalDateTime createdAt;

    private String etudiantPrenom;
    private String etudiantNomInitiale;
}
