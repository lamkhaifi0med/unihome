package com.unihome.api.dto;

import com.unihome.api.entity.StatutSignalementEnum;
import com.unihome.api.entity.StatutAnnonceEnum;
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
public class SignalementDTO {
    private UUID id;
    private UUID annonceId;
    private String annonceTitre;
    private UUID etudiantId;
    private String etudiantNom;
    private String etudiantPrenom;
    private String raison;
    private String description;
    private StatutSignalementEnum statut;
    private LocalDateTime createdAt;
    private LocalDateTime traiteAt;
    private StatutAnnonceEnum annonceStatut;
    private String annonceVille;
    private BigDecimal annonceLoyer;
    private String annonceAdresse;
    private List<String> annoncePhotos;
    private String etudiantEmail;
    private String proprietaireNom;
    private String proprietairePrenom;
    private String proprietaireEmail;
    private String proprietaireTelephone;
}
