package com.ntmi.support.controller;

import com.ntmi.support.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    // 1. KPI Cards (Spend, MTTR, MTBF)
    @GetMapping("/kpi")
    public ResponseEntity<Map<String, Object>> getKpis(
            @RequestParam(required = false) Long branch,
            @RequestParam(defaultValue = "6M") String range) {
        return ResponseEntity.ok(analyticsService.getKpis(branch, range));
    }

    // 2. Reliability (Failure Rates by Model)
    @GetMapping("/reliability")
    public ResponseEntity<List<Map<String, Object>>> getReliability(
            @RequestParam(required = false) Long branch,
            @RequestParam(defaultValue = "6M") String range) {
        return ResponseEntity.ok(analyticsService.getReliabilityAnalysis(branch, range));
    }

    // 3. Cost Trends (Monthly Spend)
    @GetMapping("/costs")
    public ResponseEntity<List<Map<String, Object>>> getCostTrends(
            @RequestParam(required = false) Long branch,
            @RequestParam(defaultValue = "6M") String range) {
        return ResponseEntity.ok(analyticsService.getCostTrends(branch, range));
    }

    // 4. Warranty Risk Watchlist
    @GetMapping("/warranty-risk")
    public ResponseEntity<List<Map<String, Object>>> getWarrantyRisk(
            @RequestParam(required = false) Long branch) {
        return ResponseEntity.ok(analyticsService.getWarrantyRisks(branch));
    }

    // 5. Failure Distribution (Pie Chart) - FIXED 404 Error
    @GetMapping("/failure-distribution")
    public ResponseEntity<List<Map<String, Object>>> getFailureDistribution(
            @RequestParam(required = false) Long branch,
            @RequestParam(defaultValue = "6M") String range) {
        return ResponseEntity.ok(analyticsService.getFailureDistribution(branch, range));
    }
}