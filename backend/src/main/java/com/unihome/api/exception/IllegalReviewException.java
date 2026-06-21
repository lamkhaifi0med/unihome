package com.unihome.api.exception;

/**
 * Thrown when a review (avis) creation request violates business rules
 * (e.g. contacts not yet viewed, already reviewed).
 *
 * The HTTP status and JSON body shape are produced by
 * {@link GlobalExceptionHandler#handleIllegalReview}, NOT by a
 * {@code @ResponseStatus} on this class — annotating the class with
 * {@code @ResponseStatus} causes Spring to short-circuit through
 * {@code ResponseStatusExceptionResolver}, which produces an opaque error
 * body (no {@code message} field), preventing the frontend from showing
 * the real reason.
 */
public class IllegalReviewException extends RuntimeException {

    public IllegalReviewException(String message) {
        super(message);
    }
}

