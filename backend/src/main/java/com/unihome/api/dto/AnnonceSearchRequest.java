package com.unihome.api.dto;

import com.unihome.api.entity.TypeLogementEnum;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Filters accepted by the internal chatbot search endpoint.
 *
 * <p>This DTO is the entry point used by the AI service (Gemini function-calling)
 * to ask Spring Boot for listings matching natural-language criteria. Each field
 * is optional; the search service combines only the non-null ones into a JPA
 * Specification. All comparisons are case- and accent-insensitive.</p>
 *
 * <p>Security: only annonces with {@code statut = VALIDEE} are ever returned by
 * this endpoint, regardless of the caller.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnonceSearchRequest {

    /** City name (case/accent-insensitive substring match). */
    @Size(max = 100)
    private String ville;

    /** Logement type. Accepts the {@link TypeLogementEnum} values. */
    private TypeLogementEnum typeLogement;

    /** Minimum rent in MAD (inclusive). */
    @DecimalMin(value = "0", inclusive = true)
    private BigDecimal prixMin;

    /** Maximum rent in MAD (inclusive). */
    @DecimalMin(value = "0", inclusive = true)
    private BigDecimal prixMax;

    /** Minimum living surface in m² (inclusive). */
    @DecimalMin(value = "0", inclusive = true)
    private BigDecimal surfaceMin;

    /** Set to true to keep only annonces with charges included in the rent. */
    private Boolean chargesIncluses;

    /** Minimum UniHome trust score (0–100). */
    @Min(0)
    @Max(100)
    private Integer scoreConfianceMin;

    /** Equipment labels that MUST be present (AND). Matched case/accent-insensitive. */
    @Size(max = 10)
    private List<String> equipementsRequis;

    /** Equipment labels that MUST be absent (e.g. "Réfrigérateur" to handle "sans X"). */
    @Size(max = 10)
    private List<String> equipementsExclus;

    /** Optional: name of a university to filter by proximity (PostGIS ST_DWithin). */
    @Size(max = 200)
    private String autourUniversiteNom;

    /** Optional: explicit university UUID (preferred over name when both provided). */
    private UUID autourUniversiteId;

    /** Search radius in meters around the chosen university (default 3000). */
    @Min(100)
    @Max(50_000)
    private Integer rayonMetres;

    /** Pagination: max number of results to return (default 10, hard cap 20). */
    @Min(1)
    @Max(20)
    private Integer limit;

    /** Pagination: offset (default 0, hard cap 200 to limit DB cost). */
    @Min(0)
    @Max(200)
    private Integer offset;
}
