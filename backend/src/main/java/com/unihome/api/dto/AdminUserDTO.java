package com.unihome.api.dto;

import com.unihome.api.entity.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDTO {

    private UUID id;
    private String nom;
    private String prenom;
    private String email;
    private RoleEnum role;
    private Boolean isActive;
    private Boolean emailConfirme;
    private LocalDateTime createdAt;

    // Proprietaire fields (null for ETUDIANT / ADMIN)
    private Boolean estVerifieCin;
    private String numeroCin;
    private String photoCinUrl;
    private BigDecimal noteMoyenne;
    private Integer nbAvisTotal;
}
