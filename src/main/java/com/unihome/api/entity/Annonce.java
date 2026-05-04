package com.unihome.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "annonces")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Annonce {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "logement_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Logement logement;

    @Column(name = "titre", length = 200, nullable = false)
    private String titre;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "loyer", nullable = false)
    private BigDecimal loyer;

    @Column(name = "charges_incluses", nullable = false)
    private Boolean chargesIncluses;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "statut", nullable = false, columnDefinition = "statut_annonce_enum")
    private StatutAnnonceEnum statut;

    @Column(name = "score_confiance")
    private Short scoreConfiance;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detail_score", columnDefinition = "jsonb")
    private Map<String, Integer> detailScore;

    @Column(name = "nb_signalements", nullable = false)
    private Integer nbSignalements;

    @Column(name = "date_publication")
    private LocalDateTime datePublication;

    @Column(name = "date_expiration")
    private LocalDateTime dateExpiration;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}


