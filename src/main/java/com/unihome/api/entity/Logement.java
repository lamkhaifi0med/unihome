package com.unihome.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "logements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Logement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "proprietaire_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Proprietaire proprietaire;

    @Column(name = "adresse", length = 300, nullable = false)
    private String adresse;

    @Column(name = "ville", length = 100, nullable = false)
    private String ville;

    @Column(name = "superficie", nullable = false)
    private BigDecimal superficie;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "type_logement", nullable = false, columnDefinition = "type_logement_enum")
    private TypeLogementEnum typeLogement;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "statut_logement", nullable = false, columnDefinition = "statut_logement_enum")
    private StatutLogementEnum statutLogement;

    @Column(name = "coordonnees", columnDefinition = "geography(POINT,4326)", nullable = false)
    private Point coordonnees;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
