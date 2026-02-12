package com.ntmi.support.dto.analytics;

public class AnalyticsKPI {
    private double totalSpend;
    private double avgMttr; // Mean Time To Repair (in Days)
    private double mtbf;    // Mean Time Between Failures (in Hours)
    private int criticalAssets;

    public AnalyticsKPI(double totalSpend, double avgMttr, double mtbf, int criticalAssets) {
        this.totalSpend = totalSpend;
        this.avgMttr = avgMttr;
        this.mtbf = mtbf;
        this.criticalAssets = criticalAssets;
    }
    // Getters and Setters
    public double getTotalSpend() { return totalSpend; }
    public double getAvgMttr() { return avgMttr; }
    public double getMtbf() { return mtbf; }
    public int getCriticalAssets() { return criticalAssets; }
}
