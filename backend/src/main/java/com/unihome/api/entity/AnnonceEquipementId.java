package com.unihome.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceEquipementId implements Serializable {

    @Column(name = "annonce_id")
    private UUID annonceId;

    @Column(name = "equipement_id")
    private Integer equipementId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AnnonceEquipementId that = (AnnonceEquipementId) o;
        return Objects.equals(annonceId, that.annonceId) &&
               Objects.equals(equipementId, that.equipementId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(annonceId, equipementId);
    }
}

