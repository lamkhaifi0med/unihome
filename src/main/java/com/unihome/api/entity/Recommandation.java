package com.unihome.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "recommandations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Recommandation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "etudiant_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Etudiant etudiant;

    @ManyToOne
    @JoinColumn(name = "annonce_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Annonce annonce;

    @Column(name = "score_pertinence")
    private BigDecimal score;

    @Column(name = "raison", columnDefinition = "TEXT")
    private String raison;

    @Column(name = "date_generation", insertable = false, updatable = false)
    private LocalDateTime dateGeneration;

    @Column(name = "date_expiration", insertable = false, updatable = false)
    private LocalDateTime dateExpiration;
}
