package com.unihome.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Payload sent by the frontend to create an avis.
 *
 * Security: etudiantId and consultationId are intentionally NOT in this DTO.
 * The server derives the student from the JWT and looks up the consultation
 * itself, so a logged-in attacker cannot post a review impersonating another
 * student or fake an unrelated consultation id.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvisRequestDTO {

    @NotNull
    private UUID annonceId;

    @NotNull
    @Min(1)
    @Max(5)
    private Short note;

    @Size(max = 2000, message = "Commentaire trop long (2000 caracteres maximum)")
    private String commentaire;
}

