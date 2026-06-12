package com.unihome.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FraudScoreResponse {

    private Short scoreGlobal;

    private Map<String, Integer> detailScore;

    private String raisonnement;

    private Map<String, String> messages;
}

