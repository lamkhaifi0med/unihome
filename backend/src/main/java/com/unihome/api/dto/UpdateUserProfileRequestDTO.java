package com.unihome.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileRequestDTO {

    private String nom;

    private String prenom;

    private String telephone;

    private BigDecimal budgetMax;

    private String villeRecherche;

    private UUID universiteId;
}

