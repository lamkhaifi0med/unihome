package com.unihome.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Appel d'un utilisateur suspendu (verifie par email + mot de passe). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuspensionAppealRequestDTO {

    @NotBlank
    private String email;

    @NotBlank
    private String motDePasse;

    @NotBlank
    @Size(max = 2000)
    private String message;
}
