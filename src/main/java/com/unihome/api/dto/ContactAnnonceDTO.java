package com.unihome.api.dto;

import com.unihome.api.entity.TypeContactEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactAnnonceDTO {

    @NotNull
    private TypeContactEnum plateforme;

    @NotBlank
    private String valeur;
}

