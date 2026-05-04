package com.unihome.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@DiscriminatorValue("PROPRIETAIRE")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Proprietaire extends Utilisateur {

    @Column(name = "numero_cin")
    private String numeroCin;

    @Column(name = "photo_cin_url")
    private String photoCinUrl;

    @Column(name = "est_verifie_cin", nullable = false)
    private Boolean estVerifieCin;

    @Column(name = "note_moyenne")
    private BigDecimal noteMoyenne;

    @Column(name = "nb_avis_total", nullable = false)
    private Integer nbAvisTotal;

    @Column(name = "telephone")
    private String telephone;
}

