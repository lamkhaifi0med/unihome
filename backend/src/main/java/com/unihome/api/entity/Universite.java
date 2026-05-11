package com.unihome.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "universites")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Universite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nom", length = 200, nullable = false)
    private String nom;

    @Column(name = "ville", length = 100, nullable = false)
    private String ville;

    @Column(name = "adresse", length = 300)
    private String adresse;

    @Column(name = "coordonnees", columnDefinition = "geography(POINT,4326)", nullable = false)
    private Point coordonnees;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
