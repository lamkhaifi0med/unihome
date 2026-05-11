package com.unihome.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceAiRequest {

    private String titre;
    private String description;
    private BigDecimal prix;
    private List<String> photoUrls;
    private String justificatifUrl;
    private String proprietaireNomComplet;
}

