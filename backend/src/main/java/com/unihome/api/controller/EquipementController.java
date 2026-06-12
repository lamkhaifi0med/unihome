package com.unihome.api.controller;

import com.unihome.api.entity.Equipement;
import com.unihome.api.repository.EquipementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/equipements")
@RequiredArgsConstructor
public class EquipementController {

    private final EquipementRepository equipementRepository;

    @GetMapping
    public List<Equipement> getEquipements() {
        return equipementRepository.findAll();
    }
}
