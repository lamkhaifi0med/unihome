package com.unihome.api.exception;

/**
 * Levee quand un utilisateur suspendu tente de se connecter avec des
 * identifiants valides. Porte le motif de suspension pour l'ecran de ban
 * cote frontend (code ACCOUNT_SUSPENDED).
 */
public class AccountSuspendedException extends RuntimeException {

    private final String raison;

    public AccountSuspendedException(String raison) {
        super("Compte suspendu");
        this.raison = raison;
    }

    public String getRaison() {
        return raison;
    }
}
