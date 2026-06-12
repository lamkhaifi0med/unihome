package com.unihome.api.dto;

public record AdminStatsDTO(
        long totalUtilisateurs,
        long totalAnnonces,
        long annoncesEnAttente,
        long annoncesValidees,
        long annoncesSuspendues,
        long signalements
) {}
