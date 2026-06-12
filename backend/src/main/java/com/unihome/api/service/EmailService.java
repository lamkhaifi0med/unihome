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

    public void sendAccountSuspensionEmail(String to, String nomPrenom) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Votre compte a été suspendu — UniHome");
        message.setText("Bonjour " + nomPrenom + ",\n\nVotre compte UniHome a été suspendu par notre équipe.\n"
                + "Toutes vos annonces actives ont également été suspendues.\n\n"
                + "Pour plus d'informations, contactez-nous.\n\nL'équipe UniHome");
        sendIfConfigured(message, "account suspension email");
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
