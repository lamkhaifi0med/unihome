package com.unihome.api.dto;

import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.entity.TypeLogementEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnnonceQueueDTO {

    private UUID id;
    private String titre;
    private String description;
    private BigDecimal loyer;
    private Boolean chargesIncluses;
    private StatutAnnonceEnum statut;
    private Short scoreConfiance;
    private Map<String, Integer> detailScore;
    private String raisonStatut;
    private Integer nbSignalements;
    private LocalDateTime datePublication;

    // Logement
    private String adresse;
    private String ville;
    private BigDecimal superficie;
    private TypeLogementEnum typeLogement;
    private String justificatifUrl;

    // Owner
    private UUID proprietaireId;
    private String proprietaireNom;
    private String proprietairePrenom;
    private Boolean proprietaireVerifieCin;
    private String photoCinUrl;
    private String numeroCin;

    // Photos
    private List<String> photos;
}
