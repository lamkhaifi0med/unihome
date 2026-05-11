package com.unihome.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvisRequestDTO {

    @NotNull
    private UUID etudiantId;

    @NotNull
    private UUID annonceId;

    @NotNull
    private UUID consultationId;

    @NotNull
    @Min(1)
    @Max(5)
    private Short note;

    private String commentaire;
}

