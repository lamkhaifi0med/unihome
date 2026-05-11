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
@Table(name = "photos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "annonce_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Annonce annonce;

    @Column(name = "url", length = 500, nullable = false)
    private String url;

    @Column(name = "phash", length = 64)
    private String phash;

    @Column(name = "est_principale", nullable = false)
    private Boolean estPrincipale;

    @Column(name = "ordre", nullable = false)
    private Short ordre;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
