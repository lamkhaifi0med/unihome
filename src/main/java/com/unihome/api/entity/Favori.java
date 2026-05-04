package com.unihome.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "favoris")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Favori {

    @EmbeddedId
    private FavoriId id;

    @ManyToOne
    @MapsId("etudiantId")
    @JoinColumn(name = "etudiant_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Etudiant etudiant;

    @ManyToOne
    @MapsId("annonceId")
    @JoinColumn(name = "annonce_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Annonce annonce;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}

