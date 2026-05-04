package com.unihome.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.Subselect;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read-only projection of active listings with distance calculation to campus.
 * Mapped to PostgreSQL view: v_annonces_avec_distance
 */
@Entity
@Immutable
@Subselect(
    "SELECT a.id AS annonce_id, a.titre, a.loyer, a.statut, a.score_confiance, " +
    "a.nb_signalements, a.date_expiration, l.id AS logement_id, l.adresse, l.ville, " +
    "l.superficie, l.type_logement, l.coordonnees AS coordonnees_logement, " +
    "u.nom AS proprietaire_nom, u.prenom AS proprietaire_prenom, u.est_verifie_cin AS proprietaire_verifie, " +
    "u.note_moyenne AS proprietaire_note, univ.id AS universite_id, univ.nom AS universite_nom, " +
    "ST_Distance(l.coordonnees::geography, univ.coordonnees::geography) AS distance_campus_m " +
    "FROM annonces a " +
    "JOIN logements l ON l.id = a.logement_id " +
    "JOIN utilisateurs u ON u.id = l.proprietaire_id " +
    "LEFT JOIN utilisateurs etu ON etu.role = 'ETUDIANT'::role_enum " +
    "LEFT JOIN universites univ ON univ.id = etu.universite_id " +
    "WHERE a.statut = 'VALIDEE'::statut_annonce_enum " +
    "AND (a.date_expiration IS NULL OR a.date_expiration > now())"
)
@Table(name = "v_annonces_avec_distance")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceAvecDistance {

    @Id
    @Column(name = "annonce_id")
    private UUID annonceId;

    @Column(name = "titre", length = 200)
    private String titre;

    @Column(name = "loyer")
    private BigDecimal loyer;

    @Column(name = "statut")
    @Enumerated(EnumType.STRING)
    private StatutAnnonceEnum statut;

    @Column(name = "score_confiance")
    private Short scoreConfiance;

    @Column(name = "nb_signalements")
    private Integer nbSignalements;

    @Column(name = "date_expiration")
    private LocalDateTime dateExpiration;

    @Column(name = "logement_id")
    private UUID logementId;

    @Column(name = "adresse", length = 300)
    private String adresse;

    @Column(name = "ville", length = 100)
    private String ville;

    @Column(name = "superficie")
    private BigDecimal superficie;

    @Column(name = "type_logement")
    @Enumerated(EnumType.STRING)
    private TypeLogementEnum typeLogement;

    @Column(name = "coordonnees_logement", columnDefinition = "geography(POINT,4326)")
    private Point coordonneesLogement;

    @Column(name = "proprietaire_nom", length = 100)
    private String proprietaireNom;

    @Column(name = "proprietaire_prenom", length = 100)
    private String proprietairePrenom;

    @Column(name = "proprietaire_verifie")
    private Boolean proprietaireVerifie;

    @Column(name = "proprietaire_note")
    private BigDecimal proprietaireNote;

    @Column(name = "universite_id")
    private UUID universiteId;

    @Column(name = "universite_nom", length = 200)
    private String universiteNom;

    @Column(name = "distance_campus_m")
    private Double distanceCampusM;
}

