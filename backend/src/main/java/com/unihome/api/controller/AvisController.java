package com.unihome.api.controller;

import com.unihome.api.dto.AvisRequestDTO;
import com.unihome.api.entity.Avis;
import com.unihome.api.service.AvisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/avis")
@RequiredArgsConstructor
public class AvisController {

    private final AvisService avisService;

    @PostMapping
    public ResponseEntity<Avis> creerAvis(@RequestBody @Valid AvisRequestDTO dto) {
        Avis savedAvis = avisService.creerAvis(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAvis);
    }
}

