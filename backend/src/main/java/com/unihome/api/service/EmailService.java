package com.unihome.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.confirmation.base-url}")
    private String confirmationBaseUrl;

    @Value("${app.mail.from:${spring.mail.username}}")
    private String mailFrom;

    @Value("${app.reset.base-url}")
    private String resetBaseUrl;

    public void sendConfirmationEmail(String to, String token) {
        String link = confirmationBaseUrl.contains("{token}")
                ? confirmationBaseUrl.replace("{token}", token)
                : confirmationBaseUrl + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Confirmation de votre email");
        message.setText("Veuillez confirmer votre email en cliquant sur le lien : " + link);
        sendIfConfigured(message, "confirmation email");
    }

    public void sendPasswordResetEmail(String to, String token) {
        String link = resetBaseUrl.contains("{token}")
                ? resetBaseUrl.replace("{token}", token)
                : resetBaseUrl + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Reinitialisation de mot de passe");
        message.setText("Pour reinitialiser votre mot de passe, cliquez sur le lien : " + link);
        sendIfConfigured(message, "password reset email");
    }

    /**
     * Notification au proprietaire apres la decision de verification automatique
     * (IA) : VALIDEE, EN_ATTENTE ou REJETEE.
     */
    public void sendAnnonceDecisionEmail(String to, String titreProp, com.unihome.api.entity.StatutAnnonceEnum statut,
                                         Short score, String messageIa) {
        String subject;
        String intro;
        switch (statut) {
            case VALIDEE -> {
                subject = "Votre annonce est publiée — UniHome";
                intro = "Bonne nouvelle ! Votre annonce \"" + titreProp + "\" a passé la vérification automatique"
                        + " et est maintenant visible par les étudiants.";
            }
            case REJETEE -> {
                subject = "Votre annonce n'a pas été validée — UniHome";
                intro = "Votre annonce \"" + titreProp + "\" n'a pas passé la vérification automatique.\n"
                        + "Vous pouvez la modifier depuis la page \"Mes annonces\" puis la resoumettre.";
            }
            default -> {
                subject = "Votre annonce est en cours de vérification — UniHome";
                intro = "Votre annonce \"" + titreProp + "\" nécessite une vérification complémentaire par notre équipe.\n"
                        + "Elle sera publiée dès qu'elle aura été validée.";
            }
        }

        StringBuilder body = new StringBuilder("Bonjour,\n\n").append(intro).append("\n\n");
        if (score != null) {
            body.append("Score de confiance : ").append(score).append("/100\n");
        }
        if (messageIa != null && !messageIa.isBlank()) {
            body.append("Détail : ").append(messageIa).append("\n");
        }
        body.append("\nL'équipe UniHome");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body.toString());
        sendIfConfigured(message, "annonce decision email");
    }

    /** Notification au proprietaire quand son annonce expire (90 jours) et est archivee. */
    public void sendAnnonceExpiredEmail(String to, String titreProp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Votre annonce a expiré — UniHome");
        message.setText("Bonjour,\n\nVotre annonce \"" + titreProp + "\" a atteint sa durée de publication de 90 jours"
                + " et a été archivée automatiquement.\n\n"
                + "Si le logement est toujours disponible, vous pouvez la désarchiver depuis la page \"Mes annonces\""
                + " pour la republier pour 90 jours.\n\nL'équipe UniHome");
        sendIfConfigured(message, "annonce expired email");
    }

    public void sendAnnonceRejectionEmail(String to, String titreProp, String raison) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Votre annonce a été rejetée — UniHome");
        message.setText("Bonjour,\n\nVotre annonce \"" + titreProp + "\" a été rejetée par notre équipe de modération.\n\n"
                + (raison != null && !raison.isBlank() ? "Raison : " + raison + "\n\n" : "")
                + "Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter.\n\nL'équipe UniHome");
        sendIfConfigured(message, "annonce rejection email");
    }

    public void sendCinResubmissionRequestEmail(String to, String nomPrenom, String raison) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Nouvelle photo CIN demandée — UniHome");
        message.setText("Bonjour " + nomPrenom + ",\n\nNotre équipe n'a pas pu valider votre CIN avec la photo actuelle.\n\n"
                + (raison != null && !raison.isBlank() ? "Motif : " + raison + "\n\n" : "")
                + "Veuillez téléverser une nouvelle photo CIN claire depuis votre profil propriétaire.\n"
                + "Conseils : document complet, bonne lumière, texte lisible, pas de flou.\n\nL'équipe UniHome");
        sendIfConfigured(message, "CIN resubmission email");
    }

    public void sendAnnonceSuspensionAfterReportEmail(String to, String titreProp, String raison) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Votre annonce est suspendue temporairement — UniHome");
        message.setText("Bonjour,\n\nVotre annonce \"" + titreProp + "\" a été suspendue temporairement suite à un signalement traité par notre équipe.\n\n"
                + (raison != null && !raison.isBlank() ? "Motif : " + raison + "\n\n" : "")
                + "Vous pouvez corriger les éléments concernés puis contacter l'équipe UniHome pour une nouvelle vérification.\n\nL'équipe UniHome");
        sendIfConfigured(message, "annonce suspension email");
    }

    public void sendAccountSuspensionEmail(String to, String nomPrenom, String raison) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Votre compte a été suspendu — UniHome");
        message.setText("Bonjour " + nomPrenom + ",\n\nVotre compte UniHome a été suspendu par notre équipe.\n"
                + (raison != null && !raison.isBlank() ? "Motif : " + raison + "\n" : "")
                + "Toutes vos annonces actives ont également été suspendues.\n\n"
                + "Si vous pensez qu'il s'agit d'une erreur, vous pouvez faire appel depuis la page de connexion UniHome.\n\nL'équipe UniHome");
        sendIfConfigured(message, "account suspension email");
    }

    public void sendAccountReactivationEmail(String to, String nomPrenom) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Votre compte a été réactivé — UniHome");
        message.setText("Bonjour " + nomPrenom + ",\n\nBonne nouvelle : votre compte UniHome a été réactivé par notre équipe.\n"
                + "Vous pouvez dès maintenant vous reconnecter.\n\n"
                + "Note : vos annonces suspendues ne sont pas réactivées automatiquement. Elles seront réexaminées par notre équipe.\n\nL'équipe UniHome");
        sendIfConfigured(message, "account reactivation email");
    }

    private void sendIfConfigured(SimpleMailMessage message, String purpose) {
        if (isBlank(mailHost) || mailHost.contains("example.com") || isBlank(mailFrom)) {
            log.warn("Email disabled or not configured; skipped {} to {}", purpose, recipients(message));
            return;
        }

        try {
            mailSender.send(message);
        } catch (RuntimeException exception) {
            log.warn("Could not send {} to {}: {}", purpose, recipients(message), exception.getMessage());
        }
    }

    private String recipients(SimpleMailMessage message) {
        String[] to = message.getTo();
        return to == null || to.length == 0 ? "unknown recipient" : String.join(", ", to);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
