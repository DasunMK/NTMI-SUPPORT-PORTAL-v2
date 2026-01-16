package com.ntmi.support.controller;

import com.ntmi.support.dto.DashboardStats;
import com.ntmi.support.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    // 1. Endpoint for Admin Dashboard (Global Stats)
    @GetMapping("/admin")
    public ResponseEntity<DashboardStats> getAdminStats() {
        return ResponseEntity.ok(dashboardService.getAdminStats());
    }

    // 2. Endpoint for Branch Dashboard (Specific Branch Stats)
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<DashboardStats> getBranchStats(@PathVariable Long branchId) {
        return ResponseEntity.ok(dashboardService.getBranchStats(branchId));
    }
}