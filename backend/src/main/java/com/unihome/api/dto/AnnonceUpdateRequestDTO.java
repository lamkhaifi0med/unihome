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

/**
 * Payload de modification d'une annonce rejetee.
 * Les photos existantes a conserver sont passees par URL (photosConservees),
 * les nouvelles photos par fichier (photos). Total requis : 2 a 10.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceUpdateRequestDTO {

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

    /** URLs des photos existantes que le proprietaire garde. */
    private List<String> photosConservees;

    /** Nouvelles photos ajoutees. */
    private List<MultipartFile> photos;

    /**
     * Ordre final d'affichage des photos : chaque element est soit l'URL d'une
     * photo conservee, soit "new:&lt;index&gt;" pour une nouvelle photo (index dans
     * la liste photos). La premiere devient la photo principale. Optionnel.
     */
    private List<String> ordrePhotos;

    /** Nouveau justificatif du logement (optionnel : remplace l'existant). */
    private MultipartFile justificatifFile;
}
