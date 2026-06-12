package com.unihome.api.dto;

import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.entity.TypeLogementEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceResponseDTO {

    private UUID id;
    private String titre;
    private BigDecimal loyer;
    private StatutAnnonceEnum statut;
    private Short scoreConfiance;
    private String raisonStatut;
    private LocalDateTime datePublication;
    private LocalDateTime dateExpiration;

    private UUID logementId;
    private String adresse;
    private String ville;
    private BigDecimal superficie;
    private TypeLogementEnum typeLogement;

    private String proprietaireNom;
    private String proprietairePrenom;
    private Boolean proprietaireVerifie;
    private BigDecimal proprietaireNote;

    private List<Integer> equipementIds;
    private List<String> equipements;
}

