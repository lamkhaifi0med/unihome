package com.unihome.api.controller;

import com.unihome.api.dto.AuthResponseDTO;
import com.unihome.api.dto.LoginRequestDTO;
import com.unihome.api.dto.RegisterRequestDTO;
import com.unihome.api.dto.ResendConfirmationRequestDTO;
import com.unihome.api.dto.ForgotPasswordRequestDTO;
import com.unihome.api.dto.ResetPasswordRequestDTO;
import com.unihome.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(dto));
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthResponseDTO> registerProprietaire(
            @Valid @RequestPart("user") RegisterRequestDTO dto,
            @RequestPart("cinFile") MultipartFile cinFile) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerProprietaire(dto, cinFile));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @GetMapping(value = "/confirm", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> confirmEmail(@RequestParam("token") String token) {
        return ResponseEntity.ok(authService.confirmEmail(token));
    }

    @GetMapping(value = "/confirm", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> confirmEmailPage(@RequestParam("token") String token) {
        try {
            return ResponseEntity.ok(renderConfirmationPage(authService.confirmEmail(token), false));
        } catch (ResponseStatusException exception) {
            String message = exception.getReason() != null ? exception.getReason() : "Lien invalide ou expire";
            return ResponseEntity
                    .status(exception.getStatusCode())
                    .contentType(MediaType.TEXT_HTML)
                    .body(renderConfirmationPage(message, true));
        }
    }

    @PostMapping("/resend-confirmation")
    public ResponseEntity<String> resendConfirmation(@Valid @RequestBody ResendConfirmationRequestDTO dto) {
        return ResponseEntity.ok(authService.resendConfirmationToken(dto));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO dto) {
        return ResponseEntity.ok(authService.forgotPassword(dto));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO dto) {
        return ResponseEntity.ok(authService.resetPassword(dto));
    }

    private String renderConfirmationPage(String serviceMessage, boolean error) {
        String normalizedMessage = serviceMessage == null ? "" : serviceMessage.toLowerCase();
        boolean alreadyConfirmed = normalizedMessage.contains("deja") || normalizedMessage.contains("déjà");
        String title = error ? "Lien invalide" : alreadyConfirmed ? "Email déjà confirmé" : "Email confirmé";
        String message = error
            ? readableErrorMessage(serviceMessage)
            : alreadyConfirmed
                ? "Votre adresse email est déjà activée. Vous pouvez vous connecter à UniHome."
                : "Votre adresse email a été confirmée avec succès. Bienvenue sur UniHome.";
        String icon = error ? "!" : "✓";
        String toneColor = error ? "#fb7185" : alreadyConfirmed ? "#fbbf24" : "#34d399";
        String toneBackground = error
            ? "rgba(251, 113, 133, 0.14)"
            : alreadyConfirmed ? "rgba(251, 191, 36, 0.14)" : "rgba(52, 211, 153, 0.14)";
        String frontendUrl = frontendBaseUrl.endsWith("/")
            ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
            : frontendBaseUrl;

        return """
                                <!doctype html>
                                <html lang="fr">
                                <head>
                                    <meta charset="utf-8" />
                                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                                    <title>__TITLE__ — UniHome</title>
                                    <style>
                                        :root { color-scheme: dark; }
                                        * { box-sizing: border-box; }
                                        body {
                                            margin: 0;
                                            min-height: 100vh;
                                            display: grid;
                                            place-items: center;
                                            padding: 24px;
                                            overflow: hidden;
                                            background: linear-gradient(135deg, #1e1b4b 0%, #581c87 48%, #020617 100%);
                                            color: #fff;
                                            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                                        }
                                        body::before,
                                        body::after {
                                            content: "";
                                            position: fixed;
                                            width: 360px;
                                            height: 360px;
                                            border-radius: 999px;
                                            filter: blur(76px);
                                            opacity: 0.24;
                                            pointer-events: none;
                                        }
                                        body::before {
                                            top: 8%;
                                            left: 10%;
                                            background: radial-gradient(circle, #7c3aed, #4f46e5);
                                        }
                                        body::after {
                                            right: 8%;
                                            bottom: 6%;
                                            background: radial-gradient(circle, #3b82f6, #1d4ed8);
                                        }
                                        .card {
                                            position: relative;
                                            z-index: 1;
                                            width: min(100%, 460px);
                                            padding: 42px 34px;
                                            border: 1px solid rgba(255, 255, 255, 0.16);
                                            border-radius: 32px;
                                            background: rgba(255, 255, 255, 0.08);
                                            backdrop-filter: blur(22px);
                                            box-shadow: 0 28px 80px rgba(0, 0, 0, 0.35);
                                            text-align: center;
                                        }
                                        .logo {
                                            display: inline-flex;
                                            align-items: center;
                                            gap: 12px;
                                            margin-bottom: 28px;
                                            color: #fff;
                                            text-decoration: none;
                                            font-weight: 800;
                                            font-size: 28px;
                                            letter-spacing: -0.04em;
                                        }
                                        .logo-icon {
                                            display: grid;
                                            place-items: center;
                                            width: 42px;
                                            height: 42px;
                                            border-radius: 12px;
                                            background: linear-gradient(135deg, #6366f1, #a78bfa);
                                        }
                                        .logo-gradient {
                                            background: linear-gradient(135deg, #6366f1, #a78bfa, #ec4899);
                                            -webkit-background-clip: text;
                                            background-clip: text;
                                            color: transparent;
                                        }
                                        .status-icon {
                                            display: grid;
                                            place-items: center;
                                            width: 82px;
                                            height: 82px;
                                            margin: 0 auto 24px;
                                            border-radius: 999px;
                                            border: 1px solid __TONE_COLOR__66;
                                            background: __TONE_BACKGROUND__;
                                            color: __TONE_COLOR__;
                                            font-size: 42px;
                                            font-weight: 900;
                                        }
                                        h1 {
                                            margin: 0 0 12px;
                                            font-size: clamp(28px, 5vw, 34px);
                                            line-height: 1.1;
                                            letter-spacing: -0.04em;
                                        }
                                        p {
                                            margin: 0;
                                            color: rgba(255, 255, 255, 0.68);
                                            font-size: 15px;
                                            line-height: 1.7;
                                        }
                                        .meta {
                                            margin: 24px 0;
                                            padding: 15px 16px;
                                            border: 1px solid rgba(255, 255, 255, 0.1);
                                            border-radius: 16px;
                                            background: rgba(255, 255, 255, 0.06);
                                            color: rgba(255, 255, 255, 0.58);
                                            font-size: 13px;
                                        }
                                        .actions {
                                            display: grid;
                                            gap: 12px;
                                            margin-top: 26px;
                                        }
                                        .button {
                                            display: inline-flex;
                                            align-items: center;
                                            justify-content: center;
                                            min-height: 48px;
                                            padding: 12px 18px;
                                            border-radius: 14px;
                                            color: #fff;
                                            background: linear-gradient(135deg, #4f46e5, #9333ea);
                                            text-decoration: none;
                                            font-weight: 800;
                                            box-shadow: 0 18px 38px rgba(79, 70, 229, 0.28);
                                        }
                                        .button.secondary {
                                            border: 1px solid rgba(255, 255, 255, 0.12);
                                            background: rgba(255, 255, 255, 0.06);
                                            box-shadow: none;
                                            color: rgba(255, 255, 255, 0.76);
                                        }
                                    </style>
                                </head>
                                <body>
                                    <main class="card" aria-live="polite">
                                        <a class="logo" href="__HOME_URL__" aria-label="UniHome">
                                            <span class="logo-icon">
                                                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                                                    <path d="M16 6L26 14v12H20v-7h-8v7H6V14L16 6z" fill="white"/>
                                                    <circle cx="16" cy="14" r="2.5" fill="white" fill-opacity="0.7"/>
                                                </svg>
                                            </span>
                                            <span>Uni<span class="logo-gradient">Home</span></span>
                                        </a>
                                        <div class="status-icon">__ICON__</div>
                                        <h1>__TITLE__</h1>
                                        <p>__MESSAGE__</p>
                                        <div class="meta">Vous pouvez fermer cette page ou revenir à l'application.</div>
                                        <div class="actions">
                                            <a class="button" href="__LOGIN_URL__">Aller à la connexion</a>
                                            <a class="button secondary" href="__HOME_URL__">Retour à l'accueil</a>
                                        </div>
                                    </main>
                                </body>
                                </html>
                                """
                                .replace("__TITLE__", escapeHtml(title))
                                .replace("__MESSAGE__", escapeHtml(message))
                                .replace("__ICON__", escapeHtml(icon))
                                .replace("__TONE_COLOR__", toneColor)
                                .replace("__TONE_BACKGROUND__", toneBackground)
                                .replace("__HOME_URL__", escapeHtml(frontendUrl + "/"))
                                .replace("__LOGIN_URL__", escapeHtml(frontendUrl + "/login"));
    }

    private String readableErrorMessage(String serviceMessage) {
        String normalizedMessage = serviceMessage == null ? "" : serviceMessage.toLowerCase();
        if (normalizedMessage.contains("expire")) {
            return "Ce lien de confirmation a expiré. Demandez un nouveau lien depuis la page de connexion.";
        }
        return "Ce lien de confirmation est invalide ou a déjà été utilisé. Demandez un nouveau lien depuis la page de connexion.";
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
