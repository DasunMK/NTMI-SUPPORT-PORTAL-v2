package com.ntmi.support.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor // ✅ Fixes "constructor ReliabilityDTO() is undefined"
@AllArgsConstructor
public class ReliabilityDTO {
    private Long assetId;       // Optional, used for specific asset stats
    private String modelName;
    private Long totalUnits;
    private Long totalFailures;
    private Double failureRate;
    private Double totalRepairCost; // ✅ Fixes "setTotalRepairCost/getTotalRepairCost undefined"

    // Constructor for Analytics Logic
    public ReliabilityDTO(String modelName, Long totalUnits, Long totalFailures, Double failureRate) {
        this.modelName = modelName;
        this.totalUnits = totalUnits;
        this.totalFailures = totalFailures;
        this.failureRate = failureRate;
        this.totalRepairCost = 0.0;
    }
}