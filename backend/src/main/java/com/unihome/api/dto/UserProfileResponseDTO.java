package com.unihome.api.dto;

import com.unihome.api.entity.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDTO {

    private UUID id;
    private String nom;
    private String prenom;
    private String email;
    private RoleEnum role;
    private Boolean emailConfirme;
    private Boolean estVerifie;
    private Boolean isActive;

    private BigDecimal budgetMax;
    private String villeRecherche;
    private UUID universiteId;
    private String universiteNom;

    private String numeroCin;
    private String photoCinUrl;
    private Boolean estVerifieCin;
    private String telephone;
    private BigDecimal noteMoyenne;
    private Integer nbAvisTotal;
}

