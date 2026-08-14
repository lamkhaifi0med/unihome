package com.unihome.api.service;

import com.unihome.api.dto.AuthResponseDTO;
import com.unihome.api.dto.LoginRequestDTO;
import com.unihome.api.dto.RegisterRequestDTO;
import com.unihome.api.dto.ResendConfirmationRequestDTO;
import com.unihome.api.dto.ForgotPasswordRequestDTO;
import com.unihome.api.dto.ResetPasswordRequestDTO;
import com.unihome.api.dto.SuspensionAppealRequestDTO;
import com.unihome.api.entity.Admin;
import com.unihome.api.entity.ConfirmationToken;
import com.unihome.api.entity.Etudiant;
import com.unihome.api.entity.Proprietaire;
import com.unihome.api.entity.Utilisateur;
import com.unihome.api.exception.AccountSuspendedException;
import com.unihome.api.repository.ConfirmationTokenRepository;
import com.unihome.api.repository.ProprietaireRepository;
import com.unihome.api.repository.UtilisateurRepository;
import com.unihome.api.security.JwtUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final ProprietaireRepository proprietaireRepository;
    private final ConfirmationTokenRepository confirmationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final PhotoService photoService;

    public AuthResponseDTO register(RegisterRequestDTO dto) {
        if (dto.getRole() == com.unihome.api.entity.RoleEnum.PROPRIETAIRE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inscription proprietaire: utilisez multipart avec CIN");
        }
        if (utilisateurRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        Utilisateur utilisateur = createUserByRole(dto);
        utilisateur.setNom(dto.getNom());
        utilisateur.setPrenom(dto.getPrenom());
        utilisateur.setEmail(dto.getEmail());
        utilisateur.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        utilisateur.setEstVerifie(Boolean.FALSE);
        utilisateur.setEmailConfirme(Boolean.FALSE);
        utilisateur.setIsActive(Boolean.TRUE);

        Utilisateur saved = utilisateurRepository.save(utilisateur);
        ConfirmationToken token = new ConfirmationToken(
                null,
                saved,
                UUID.randomUUID().toString(),
                LocalDateTime.now().plusHours(24),
                LocalDateTime.now()
        );
        confirmationTokenRepository.save(token);

        emailService.sendConfirmationEmail(saved.getEmail(), token.getToken());
        return new AuthResponseDTO(null, token.getToken());
    }

    public AuthResponseDTO registerProprietaire(RegisterRequestDTO dto, org.springframework.web.multipart.MultipartFile cinFile) {
        if (dto.getRole() != com.unihome.api.entity.RoleEnum.PROPRIETAIRE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role invalide pour cette inscription");
        }
        if (cinFile == null || cinFile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier CIN requis");
        }
        if (dto.getNumeroCin() == null || dto.getNumeroCin().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Numero CIN requis");
        }
        if (dto.getTelephone() == null || dto.getTelephone().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telephone requis");
        }
        if (utilisateurRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (proprietaireRepository.existsByNumeroCin(dto.getNumeroCin())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CIN deja utilise");
        }

        Utilisateur utilisateur = createUserByRole(dto);
        utilisateur.setNom(dto.getNom());
        utilisateur.setPrenom(dto.getPrenom());
        utilisateur.setEmail(dto.getEmail());
        utilisateur.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        utilisateur.setEstVerifie(Boolean.FALSE);
        utilisateur.setEmailConfirme(Boolean.FALSE);
        utilisateur.setIsActive(Boolean.TRUE);

        if (utilisateur instanceof Proprietaire proprietaire) {
            proprietaire.setNumeroCin(dto.getNumeroCin());
            proprietaire.setTelephone(dto.getTelephone());
            String cinUrl = photoService.uploaderCin(cinFile);
            proprietaire.setPhotoCinUrl(cinUrl);
        }

        Utilisateur saved = utilisateurRepository.save(utilisateur);
        ConfirmationToken token = new ConfirmationToken(
                null,
                saved,
                UUID.randomUUID().toString(),
                LocalDateTime.now().plusHours(24),
                LocalDateTime.now()
        );
        confirmationTokenRepository.save(token);
        emailService.sendConfirmationEmail(saved.getEmail(), token.getToken());
        return new AuthResponseDTO(null, token.getToken());
    }

    public AuthResponseDTO login(LoginRequestDTO dto) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getMotDePasse()));
        } catch (DisabledException exception) {
            // Compte suspendu (enabled=false). On ne revele la suspension que si
            // le mot de passe est correct, sinon 401 classique.
            Utilisateur suspendu = utilisateurRepository.findByEmail(dto.getEmail())
                    .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
            if (!passwordEncoder.matches(dto.getMotDePasse(), suspendu.getMotDePasse())) {
                throw new BadCredentialsException("Invalid credentials");
            }
            throw new AccountSuspendedException(suspendu.getRaisonSuspension());
        }
        if (!authentication.isAuthenticated()) {
            throw new EntityNotFoundException("Invalid credentials");
        }
        Utilisateur utilisateur = utilisateurRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur not found"));
        if (Boolean.FALSE.equals(utilisateur.getIsActive())) {
            throw new AccountSuspendedException(utilisateur.getRaisonSuspension());
        }
        if (Boolean.FALSE.equals(utilisateur.getEmailConfirme())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email non confirme");
        }
        UserDetails userDetails = userDetailsService.loadUserByUsername(dto.getEmail());
        String jwt = jwtUtils.generateToken(userDetails);
        return new AuthResponseDTO(jwt, null);
    }

    /**
     * Appel d'un utilisateur suspendu. Identite verifiee par email + mot de
     * passe (pas de JWT possible : le compte ne peut pas se connecter).
     * Un seul appel actif a la fois : un nouvel appel remplace l'ancien.
     */
    public void deposerAppelSuspension(SuspensionAppealRequestDTO dto) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants incorrects"));
        if (!passwordEncoder.matches(dto.getMotDePasse(), utilisateur.getMotDePasse())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Identifiants incorrects");
        }
        if (!Boolean.FALSE.equals(utilisateur.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce compte n'est pas suspendu.");
        }
        utilisateur.setAppelMessage(dto.getMessage().trim());
        utilisateur.setAppelDate(LocalDateTime.now());
        utilisateurRepository.save(utilisateur);
    }

    public String confirmEmail(String token) {
        if (token != null && token.startsWith("reset-")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token invalide");
        }
        ConfirmationToken confirmationToken = confirmationTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token invalide"));
        if (LocalDateTime.now().isAfter(confirmationToken.getExpiresAt())) {
            confirmationTokenRepository.delete(confirmationToken);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token expire");
        }
        Utilisateur utilisateur = confirmationToken.getUtilisateur();
        if (Boolean.TRUE.equals(utilisateur.getEmailConfirme())) {
            return "Email deja confirme";
        }
        utilisateur.setEmailConfirme(Boolean.TRUE);
        utilisateurRepository.save(utilisateur);
        confirmationTokenRepository.delete(confirmationToken);
        return "Email confirme";
    }

    public String resendConfirmationToken(ResendConfirmationRequestDTO dto) {
        confirmationTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        Utilisateur utilisateur = utilisateurRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur not found"));
        if (Boolean.TRUE.equals(utilisateur.getEmailConfirme())) {
            return "Email deja confirme";
        }
        confirmationTokenRepository.deleteByUtilisateur(utilisateur);
        ConfirmationToken token = new ConfirmationToken(
                null,
                utilisateur,
                UUID.randomUUID().toString(),
                LocalDateTime.now().plusHours(24),
                LocalDateTime.now()
        );
        confirmationTokenRepository.save(token);
        emailService.sendConfirmationEmail(utilisateur.getEmail(), token.getToken());
        return "Nouveau token envoye";
    }

    public String forgotPassword(ForgotPasswordRequestDTO dto) {
        confirmationTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        Utilisateur utilisateur = utilisateurRepository.findByEmail(dto.getEmail()).orElse(null);
        if (utilisateur == null) {
            return "Si un compte existe, un email a ete envoye";
        }
        String token = "reset-" + UUID.randomUUID();
        ConfirmationToken resetToken = new ConfirmationToken(
                null,
                utilisateur,
                token,
                LocalDateTime.now().plusHours(1),
                LocalDateTime.now()
        );
        confirmationTokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(utilisateur.getEmail(), token);
        return "Email de reinitialisation envoye";
    }

    public String resetPassword(ResetPasswordRequestDTO dto) {
        ConfirmationToken resetToken = confirmationTokenRepository.findByToken(dto.getToken())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token invalide"));
        if (resetToken.getToken() == null || !resetToken.getToken().startsWith("reset-")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token invalide");
        }
        if (LocalDateTime.now().isAfter(resetToken.getExpiresAt())) {
            confirmationTokenRepository.delete(resetToken);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token expire");
        }
        Utilisateur utilisateur = resetToken.getUtilisateur();
        utilisateur.setMotDePasse(passwordEncoder.encode(dto.getNewPassword()));
        utilisateurRepository.save(utilisateur);
        confirmationTokenRepository.delete(resetToken);
        return "Mot de passe reinitialise";
    }

    private Utilisateur createUserByRole(RegisterRequestDTO dto) {
        return switch (dto.getRole()) {
            case ETUDIANT -> new Etudiant();
            case PROPRIETAIRE -> {
                Proprietaire proprietaire = new Proprietaire();
                proprietaire.setEstVerifieCin(Boolean.FALSE);
                proprietaire.setNbAvisTotal(0);
                yield proprietaire;
            }
            case ADMIN -> new Admin();
        };
    }
}
