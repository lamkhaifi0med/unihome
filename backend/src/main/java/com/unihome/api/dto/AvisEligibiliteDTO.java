package com.unihome.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tells the frontend whether the connected student can leave a review on a
 * given annonce, and if not, why. The UI uses this to switch between
 * "Laisser un avis", "Vous avez deja laisse un avis", or a contextual hint.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvisEligibiliteDTO {

    /** True only when no avis exists yet AND contacts have been viewed. */
    private boolean canReview;

    /** True when the current student already posted an avis for this annonce. */
    private boolean alreadyReviewed;

    /** True when a consultation exists with contacts_affiches=true. */
    private boolean hasViewedContacts;

    /** Optional short reason ("CONTACTS_NON_AFFICHES", "DEJA_AVIS", "OK"). */
    private String reason;
}
