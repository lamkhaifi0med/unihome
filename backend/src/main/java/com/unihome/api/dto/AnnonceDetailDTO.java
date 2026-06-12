package com.unihome.api.dto;

import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.entity.TypeContactEnum;
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
public class AnnonceDetailDTO {

    private UUID id;
    private String titre;
    private String description;
    private BigDecimal loyer;
    private Boolean chargesIncluses;
    private StatutAnnonceEnum statut;
    private Short scoreConfiance;
    private Map<String, Integer> detailScore;
    private String raisonStatut;
    private LocalDateTime datePublication;
    private LocalDateTime dateExpiration;

    private UUID logementId;
    private String adresse;
    private String ville;
    private BigDecimal superficie;
    private TypeLogementEnum typeLogement;
    private Double latitude;
    private Double longitude;

    private String proprietaireNom;
    private String proprietairePrenom;
    private Boolean proprietaireVerifie;
    private BigDecimal proprietaireNote;
    private Integer proprietaireAvis;

    private List<String> photos;
    private List<String> equipements;
    private List<ContactDTO> contacts;
    private Boolean contactsDisponibles;
    private Boolean favori;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContactDTO {
        private TypeContactEnum plateforme;
        private String valeur;
    }
}
