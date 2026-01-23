package com.ntmi.support.dto;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class ReliabilityDTO {
    private String modelName;
    private long totalUnits;
    private long totalFailures;
    private double failureRate; // percentage
}