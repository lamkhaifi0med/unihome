package com.unihome.api.dto;

import com.unihome.api.entity.TypeLogementEnum;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogementRequestDTO {

    @NotNull
    private UUID proprietaireId;

    @NotBlank
    private String adresse;

    @NotBlank
    private String ville;

    @NotNull
    @Positive
    private BigDecimal superficie;

    @NotNull
    private TypeLogementEnum typeLogement;

    @Min(-90)
    @Max(90)
    private double latitude;

    @Min(-180)
    @Max(180)
    private double longitude;

    private String justificatifUrl;

    private Boolean adresseConfirmee;
}
