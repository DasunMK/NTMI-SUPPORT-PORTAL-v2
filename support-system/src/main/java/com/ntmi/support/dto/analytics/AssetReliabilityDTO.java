package com.ntmi.support.dto.analytics;

public class AssetReliabilityDTO {
    private Long assetId;
    private String assetCode;
    private String brand;
    private String model;
    private double purchaseCost;
    private double totalRepairCost;
    private long repairCount;
    private long ageInMonths;

    // Constructor, Getters, Setters
    public AssetReliabilityDTO(Long assetId, String assetCode, String brand, String model, 
                               double purchaseCost, double totalRepairCost, long repairCount, long ageInMonths) {
        this.assetId = assetId;
        this.assetCode = assetCode;
        this.brand = brand;
        this.model = model;
        this.purchaseCost = purchaseCost;
        this.totalRepairCost = totalRepairCost;
        this.repairCount = repairCount;
        this.ageInMonths = ageInMonths;
    }
    
    // ... Getters for all fields ...
    public Long getAssetId() { return assetId; }
    public String getAssetCode() { return assetCode; }
    public String getBrand() { return brand; }
    public String getModel() { return model; }
    public double getPurchaseCost() { return purchaseCost; }
    public double getTotalRepairCost() { return totalRepairCost; }
    public long getRepairCount() { return repairCount; }
    public long getAgeInMonths() { return ageInMonths; }
}