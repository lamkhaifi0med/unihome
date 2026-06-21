package com.unihome.api.dto;

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
public class ChatbotSafeListingDTO {

    private UUID id;
    private String titre;
    private String description;
    private BigDecimal loyer;
    private Boolean chargesIncluses;
    private String ville;
    private String adresse;
    private BigDecimal superficie;
    private TypeLogementEnum typeLogement;
    private Short scoreConfiance;
    private List<String> equipements;
    private List<String> photoUrls;
    private Double distanceCampusM;
}
