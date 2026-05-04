package com.unihome.api.dto;

import com.unihome.api.entity.StatutLogementEnum;
import com.unihome.api.entity.TypeLogementEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogementResponseDTO {

    private UUID id;
    private UUID proprietaireId;
    private String adresse;
    private String ville;
    private BigDecimal superficie;
    private TypeLogementEnum typeLogement;
    private StatutLogementEnum statutLogement;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

