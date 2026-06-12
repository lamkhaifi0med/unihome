package com.unihome.api.service;

import com.unihome.api.dto.ForgotPasswordRequestDTO;
import com.unihome.api.dto.ResetPasswordRequestDTO;
import com.unihome.api.entity.ConfirmationToken;
import com.unihome.api.entity.Utilisateur;
import com.unihome.api.repository.ConfirmationTokenRepository;
import com.unihome.api.repository.ProprietaireRepository;
import com.unihome.api.repository.UtilisateurRepository;
import com.unihome.api.security.JwtUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private ProprietaireRepository proprietaireRepository;

    @Mock
    private ConfirmationTokenRepository confirmationTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private EmailService emailService;

    @Mock
    private PhotoService photoService;

    @InjectMocks
    private AuthService authService;

    @Test
    void forgotPasswordSendsEmailWhenUserExists() {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setId(UUID.randomUUID());
        utilisateur.setEmail("student@example.com");

        when(utilisateurRepository.findByEmail("student@example.com")).thenReturn(Optional.of(utilisateur));
        when(confirmationTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        authService.forgotPassword(new ForgotPasswordRequestDTO("student@example.com"));

        verify(confirmationTokenRepository).save(any());
        verify(emailService).sendPasswordResetEmail(eq("student@example.com"), startsWith("reset-"));
    }

    @Test
    void resetPasswordRejectsNonResetToken() {
        Utilisateur utilisateur = new Utilisateur();
        ConfirmationToken token = new ConfirmationToken(
                UUID.randomUUID(),
                utilisateur,
                "abc",
                LocalDateTime.now().plusHours(1),
                LocalDateTime.now()
        );
        when(confirmationTokenRepository.findByToken("abc")).thenReturn(Optional.of(token));

        assertThrows(ResponseStatusException.class,
                () -> authService.resetPassword(new ResetPasswordRequestDTO("abc", "newPass")));
    }

    @Test
    void resetPasswordUpdatesPasswordForValidToken() {
        Utilisateur utilisateur = new Utilisateur();
        ConfirmationToken token = new ConfirmationToken(
                UUID.randomUUID(),
                utilisateur,
                "reset-123",
                LocalDateTime.now().plusMinutes(30),
                LocalDateTime.now()
        );
        when(confirmationTokenRepository.findByToken("reset-123")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("newPass")).thenReturn("hashed");

        authService.resetPassword(new ResetPasswordRequestDTO("reset-123", "newPass"));

        verify(utilisateurRepository).save(utilisateur);
        verify(confirmationTokenRepository).delete(token);
    }
}

