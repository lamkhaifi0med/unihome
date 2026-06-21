package com.unihome.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "avis",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_avis_etudiant_annonce",
        columnNames = {"etudiant_id", "annonce_id"}
    )
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Avis {

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

    @OneToOne
    @JoinColumn(name = "consultation_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Consultation consultation;

    @Column(name = "note", nullable = false)
    private Short note;

    @Column(name = "commentaire", columnDefinition = "TEXT")
    private String commentaire;

    @Column(name = "valide_par_ia", nullable = false)
    private Boolean valideParIa;

    // @CreationTimestamp makes Hibernate populate the field at insert time
    // using the JVM clock. The DB DEFAULT now() remains a safety net for
    // direct SQL inserts, but Hibernate-managed inserts now always return
    // a non-null createdAt to the caller without needing a re-fetch.
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
