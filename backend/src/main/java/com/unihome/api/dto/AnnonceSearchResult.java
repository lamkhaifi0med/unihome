package com.unihome.api.dto;

import com.unihome.api.entity.TypeLogementEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Compact projection of a listing returned to the AI service. Intentionally
 * omits heavy fields (full description, owner contacts, all photos) so Gemini
 * can fit many results in its context window. If Gemini needs more detail it
 * calls the dedicated {@code get_annonce_details} tool.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceSearchResult {

    private UUID id;
    private String titre;
    private String ville;
    private TypeLogementEnum typeLogement;
    private BigDecimal loyer;
    private Boolean chargesIncluses;
    private BigDecimal superficie;
    private Short scoreConfiance;

    /** Up to 6 equipment labels for quick context. */
    private List<String> equipements;

    /** Distance in meters to the requested university (null if not requested). */
    private Double distanceCampusM;

    /** URL of the primary photo (null if the annonce has no photos). */
    private String photoPrincipaleUrl;
}
