package com.ntmi.support.controller;

import com.ntmi.support.model.Asset;
import com.ntmi.support.model.Ticket;
import com.ntmi.support.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired private RepairRecordRepository repairRepository;
    @Autowired private AssetRepository assetRepository;
    @Autowired private TicketRepository ticketRepository;

    // 1. KPI Endpoint (Real Calculations)
    @GetMapping("/kpi")
    public ResponseEntity<Map<String, Object>> getKpis() {
        Map<String, Object> kpi = new HashMap<>();
        
        // --- A. Total Spend ---
        BigDecimal totalSpend = repairRepository.findAll().stream()
            .map(r -> r.getCost() != null ? r.getCost() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // --- B. Calculate MTBF (Mean Time Between Failures) ---
        // Formula: Total Operational Hours of All Assets / Total Number of Failures
        List<Asset> allAssets = assetRepository.findAll();
        long totalFailures = ticketRepository.count(); // Assuming every ticket is a failure
        
        long totalOperationalDays = allAssets.stream()
            .mapToLong(asset -> {
                LocalDate start = asset.getPurchasedDate() != null ? asset.getPurchasedDate() : LocalDate.now();
                return ChronoUnit.DAYS.between(start, LocalDate.now());
            }).sum();

        // Convert days to hours (assuming 8-hour workdays or 24h depending on need)
        long totalOperationalHours = totalOperationalDays * 24; 
        
        // Avoid division by zero
        long mtbf = (totalFailures > 0) ? (totalOperationalHours / totalFailures) : totalOperationalHours;

        // --- C. Calculate MTTR (Mean Time To Repair) ---
        // Formula: Sum of (Resolved Time - Created Time) / Total Resolved Tickets
        List<Ticket> resolvedTickets = ticketRepository.findAllResolvedTickets();
        double avgMttrDays = 0.0;

        if (!resolvedTickets.isEmpty()) {
            long totalRepairSeconds = resolvedTickets.stream()
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).getSeconds())
                .sum();
            
            // Convert seconds to days (86400 seconds in a day)
            avgMttrDays = (double) totalRepairSeconds / resolvedTickets.size() / 86400.0;
        }

        // --- D. Critical Assets Count ---
        // Count assets with > 20% failure rate
        long criticalCount = getReliabilityList().stream()
                .filter(m -> (double) m.get("failureRate") > 20.0)
                .count();

        kpi.put("totalSpend", totalSpend);
        kpi.put("mtbf", mtbf); 
        kpi.put("avgMttr", Math.round(avgMttrDays * 10.0) / 10.0); // Round to 1 decimal
        kpi.put("criticalAssets", criticalCount);
        
        return ResponseEntity.ok(kpi);
    }

    // 2. Reliability Data (Helper Method used by both endpoints)
    private List<Map<String, Object>> getReliabilityList() {
        List<Map<String, Object>> results = new ArrayList<>();
        Map<String, List<Asset>> assetsByModel = assetRepository.findAll().stream()
            .collect(Collectors.groupingBy(Asset::getModel));

        assetsByModel.forEach((model, assets) -> {
            long total = assets.size();
            long failures = assets.stream().filter(a -> a.getRepairCount() > 0).count();
            double rate = (total > 0) ? ((double) failures / total) * 100 : 0;

            Map<String, Object> data = new HashMap<>();
            data.put("modelName", model);
            data.put("totalUnits", total);
            data.put("totalFailures", failures);
            data.put("failureRate", Math.round(rate * 10.0) / 10.0);
            results.add(data);
        });
        return results;
    }

    @GetMapping("/reliability")
    public ResponseEntity<List<Map<String, Object>>> getReliability() {
        List<Map<String, Object>> data = getReliabilityList();
        data.sort((a, b) -> Double.compare((double) b.get("failureRate"), (double) a.get("failureRate")));
        return ResponseEntity.ok(data);
    }

    // 3. Warranty Risk Watchlist
    @GetMapping("/warranty-risk")
    public ResponseEntity<List<Map<String, Object>>> getWarrantyRisk() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysLater = today.plusDays(30);

        List<Map<String, Object>> risks = assetRepository.findAll().stream()
            .filter(a -> "REPAIR".equals(a.getStatus()) || "DISPOSED".equals(a.getStatus()))
            .filter(a -> a.getWarrantyExpiry() != null && 
                         !a.getWarrantyExpiry().isBefore(today) && 
                         a.getWarrantyExpiry().isBefore(thirtyDaysLater))
            .map(a -> {
                Map<String, Object> map = new HashMap<>();
                map.put("assetId", a.getAssetId());
                map.put("assetCode", a.getAssetCode());
                map.put("brand", a.getBrand());
                map.put("model", a.getModel());
                map.put("branchName", a.getBranch().getBranchName());
                map.put("status", a.getStatus());
                map.put("warrantyExpiry", a.getWarrantyExpiry());
                map.put("daysLeft", ChronoUnit.DAYS.between(today, a.getWarrantyExpiry()));
                return map;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(risks);
    }

    // 4. Branch Monthly Costs (Real Data from SQL)
    @GetMapping("/costs")
    public ResponseEntity<List<Map<String, Object>>> getCosts() {
        List<Map<String, Object>> rawData = repairRepository.findMonthlyCostsByBranch();
        
        // Transform the flat list into the format required by the Recharts LineChart
        // Input: [{branch: "Nugegoda", month: "2025-01", totalCost: 5000}, ...]
        // Output: [{month: "Jan", Nugegoda: 5000, Werahera: 2000, ...}]
        
        Map<String, Map<String, Double>> transformed = new LinkedHashMap<>();

        for (Map<String, Object> row : rawData) {
            String month = (String) row.get("month");
            String branch = (String) row.get("branch");
            Double cost = ((Number) row.get("totalCost")).doubleValue();

            transformed.putIfAbsent(month, new HashMap<>());
            transformed.get(month).put(branch, cost);
        }

        List<Map<String, Object>> chartData = new ArrayList<>();
        transformed.forEach((month, branchCosts) -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("month", month); // You can format this to "Jan" if needed
            entry.putAll(branchCosts);
            chartData.add(entry);
        });

        // Ensure we only return last 6 months to keep chart clean
        return ResponseEntity.ok(chartData.stream().limit(6).collect(Collectors.toList()));
    }
}