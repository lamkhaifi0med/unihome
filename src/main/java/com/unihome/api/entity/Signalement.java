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
@Table(name = "signalements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Signalement {

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

    @ManyToOne
    @JoinColumn(name = "admin_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Utilisateur admin;

    @Column(name = "raison", length = 100, nullable = false)
    private String raison;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    private StatutSignalementEnum statut;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "traite_at")
    private LocalDateTime traiteAt;
}

