package com.unihome.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@DiscriminatorValue("ETUDIANT")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Etudiant extends Utilisateur {

	@Column(name = "budget_max")
	private BigDecimal budgetMax;

	@Column(name = "ville_recherche", length = 100)
	private String villeRecherche;

	@ManyToOne
	@JoinColumn(name = "universite_id")
	@EqualsAndHashCode.Exclude
	private Universite universite;
}
