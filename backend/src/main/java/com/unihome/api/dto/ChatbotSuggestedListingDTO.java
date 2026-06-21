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
public class ChatbotSuggestedListingDTO {

    private UUID id;
    private String titre;
    private BigDecimal loyer;
    private String ville;
    private TypeLogementEnum typeLogement;
    private Short scoreConfiance;
    private List<String> reasons;
    private String route;
}
