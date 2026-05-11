package com.unihome.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.confirmation.base-url}")
    private String confirmationBaseUrl;

    @Value("${app.mail.from:${spring.mail.username}}")
    private String mailFrom;

    public void sendConfirmationEmail(String to, String token) {
        String link = confirmationBaseUrl.contains("{token}")
                ? confirmationBaseUrl.replace("{token}", token)
                : confirmationBaseUrl + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Confirmation de votre email");
        message.setText("Veuillez confirmer votre email en cliquant sur le lien : " + link);
        mailSender.send(message);
    }
}

