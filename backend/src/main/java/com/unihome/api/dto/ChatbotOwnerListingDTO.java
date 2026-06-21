package com.unihome.api.dto;

import com.unihome.api.entity.StatutAnnonceEnum;
import com.unihome.api.entity.TypeLogementEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotOwnerListingDTO {

    private UUID id;
    private String titre;
    private String description;
    private BigDecimal loyer;
    private String ville;
    private TypeLogementEnum typeLogement;
    private StatutAnnonceEnum statut;
    private Short scoreConfiance;
    private String ownerTrustMessage;
    private Integer nbSignalements;
    private Integer photoCount;
    private List<String> equipements;
}
