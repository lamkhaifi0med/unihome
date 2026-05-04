package com.unihome.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.UUID;

@Entity
@Table(name = "annonce_equipements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceEquipement {

    @EmbeddedId
    private AnnonceEquipementId id;

    @ManyToOne
    @MapsId("annonceId")
    @JoinColumn(name = "annonce_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Annonce annonce;

    @ManyToOne
    @MapsId("equipementId")
    @JoinColumn(name = "equipement_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Equipement equipement;
}

