package com.unihome.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.UUID;

@Entity
@Table(name = "contacts_annonce")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactAnnonce {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "annonce_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Annonce annonce;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Column(name = "plateforme", nullable = false, columnDefinition = "type_contact_enum")
    private TypeContactEnum plateforme;

    @Column(name = "valeur", length = 300, nullable = false)
    private String valeur;
}
