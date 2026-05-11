package com.unihome.api.controller;

import com.unihome.api.dto.AuthResponseDTO;
import com.unihome.api.dto.LoginRequestDTO;
import com.unihome.api.dto.RegisterRequestDTO;
import com.unihome.api.dto.ResendConfirmationRequestDTO;
import com.unihome.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/confirm")
    public ResponseEntity<String> confirmEmail(@RequestParam("token") String token) {
        return ResponseEntity.ok(authService.confirmEmail(token));
    }

    @PostMapping("/resend-confirmation")
    public ResponseEntity<String> resendConfirmation(@Valid @RequestBody ResendConfirmationRequestDTO dto) {
        return ResponseEntity.ok(authService.resendConfirmationToken(dto));
    }
}
