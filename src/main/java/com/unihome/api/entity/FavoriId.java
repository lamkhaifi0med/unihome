package com.unihome.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;
import java.util.Objects;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FavoriId implements Serializable {

    @Column(name = "etudiant_id")
    private UUID etudiantId;

    @Column(name = "annonce_id")
    private UUID annonceId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FavoriId that = (FavoriId) o;
        return Objects.equals(etudiantId, that.etudiantId) &&
               Objects.equals(annonceId, that.annonceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(etudiantId, annonceId);
    }
}

