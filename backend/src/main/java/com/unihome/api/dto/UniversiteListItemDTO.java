package com.unihome.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UniversiteListItemDTO {

    private UUID id;
    private String nom;
    private String ville;
    private Double latitude;
    private Double longitude;
}

