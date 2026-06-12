package com.unihome.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceRequestDTO {

    @NotBlank
    @Size(max = 200)
    private String titre;

    @NotBlank
    private String description;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal loyer;

    @NotNull
    private Boolean chargesIncluses;

    @NotEmpty
    @Valid
    private List<ContactAnnonceDTO> contacts;

    @NotEmpty
    private List<Integer> equipementIds;

    @NotEmpty
    @Size(min = 2, max = 10)
    private List<MultipartFile> photos;
}
