package com.ntmi.support.service;

import com.ntmi.support.model.*;
import com.ntmi.support.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired private TicketRepository ticketRepository;
    @Autowired private RepairRecordRepository repairRecordRepository;
    @Autowired private AssetRepository assetRepository;

    // --- Helper: Parse Date Range ---
    private LocalDateTime getStartDate(String range) {
        LocalDateTime now = LocalDateTime.now();
        if ("1M".equals(range)) return now.minusMonths(1);
        if ("3M".equals(range)) return now.minusMonths(3);
        if ("1Y".equals(range)) return now.minusYears(1);
        return now.minusMonths(6); // Default 6M
    }

    // 1. KPI Calculation
    public Map<String, Object> getKpis(Long branchId, String range) {
        LocalDateTime startDate = getStartDate(range);
        
        // Fetch Tickets
        List<Ticket> tickets = (branchId == null) 
            ? ticketRepository.findByCreatedAtAfter(startDate)
            : ticketRepository.findByBranch_BranchIdAndCreatedAtAfter(branchId, startDate);

        // Fetch Repairs (for Cost)
        List<RepairRecord> repairs = (branchId == null)
            ? repairRecordRepository.findByRepairDateAfter(startDate.toLocalDate())
            : repairRecordRepository.findByAsset_Branch_BranchIdAndRepairDateAfter(branchId, startDate.toLocalDate());

        // A. Total Spend
        BigDecimal totalSpend = repairs.stream()
                .map(RepairRecord::getCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // B. MTTR (Mean Time To Repair) in Hours/Days
        double totalRepairHours = tickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLVED && t.getResolvedAt() != null)
                .mapToDouble(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toHours())
                .sum();
        long resolvedCount = tickets.stream().filter(t -> t.getStatus() == TicketStatus.RESOLVED).count();
        double avgMttrDays = resolvedCount > 0 ? (totalRepairHours / resolvedCount) / 24.0 : 0;

        // C. MTBF (Mean Time Between Failures)
        // Simplified Formula: (Total Active Assets * Days in Period * 24) / Total Failures
        long totalAssets = (branchId == null) ? assetRepository.count() : assetRepository.countByBranch_BranchId(branchId);
        long daysInPeriod = ChronoUnit.DAYS.between(startDate, LocalDateTime.now());
        long failureCount = tickets.size();
        
        // Avoid division by zero
        double mtbf = failureCount > 0 ? ((totalAssets * daysInPeriod * 24.0) / failureCount) : 0;

        Map<String, Object> response = new HashMap<>();
        response.put("totalSpend", totalSpend);
        response.put("avgMttr", Math.round(avgMttrDays * 10.0) / 10.0); // Round to 1 decimal
        response.put("mtbf", Math.round(mtbf));
        return response;
    }

    // 2. Reliability (Failure Rates)
    public List<Map<String, Object>> getReliabilityAnalysis(Long branchId, String range) {
        LocalDateTime startDate = getStartDate(range);
        List<Ticket> tickets = (branchId == null) 
            ? ticketRepository.findByCreatedAtAfter(startDate)
            : ticketRepository.findByBranch_BranchIdAndCreatedAtAfter(branchId, startDate);

        // Group tickets by Asset Model
        Map<String, Long> failuresByModel = tickets.stream()
                .filter(t -> t.getAsset() != null)
                .collect(Collectors.groupingBy(t -> t.getAsset().getModel(), Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        failuresByModel.forEach((model, count) -> {
            // In a real app, divide by total assets of that model to get %
            Map<String, Object> entry = new HashMap<>();
            entry.put("modelName", model);
            entry.put("failureRate", count); // Currently raw count, can normalize to % if needed
            result.add(entry);
        });
        
        // Sort by highest failures
        result.sort((a, b) -> Long.compare((Long)b.get("failureRate"), (Long)a.get("failureRate")));
        return result;
    }

    // 3. Cost Trends
    public List<Map<String, Object>> getCostTrends(Long branchId, String range) {
        LocalDate startDate = getStartDate(range).toLocalDate();
        List<RepairRecord> repairs = (branchId == null)
            ? repairRecordRepository.findByRepairDateAfter(startDate)
            : repairRecordRepository.findByAsset_Branch_BranchIdAndRepairDateAfter(branchId, startDate);

        // Group by Month (YYYY-MM)
        Map<String, BigDecimal> costByMonth = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (RepairRecord r : repairs) {
            String monthKey = r.getRepairDate().format(formatter);
            costByMonth.put(monthKey, costByMonth.getOrDefault(monthKey, BigDecimal.ZERO).add(r.getCost() != null ? r.getCost() : BigDecimal.ZERO));
        }

        return costByMonth.entrySet().stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("month", e.getKey());
            map.put("totalCost", e.getValue());
            return map;
        }).collect(Collectors.toList());
    }

    // 4. Warranty Risk
    public List<Map<String, Object>> getWarrantyRisks(Long branchId) {
        // Find assets expiring in next 30 days OR already expired
        LocalDate threshold = LocalDate.now().plusDays(30);
        List<Asset> assets = (branchId == null)
                ? assetRepository.findByWarrantyExpiryBefore(threshold)
                : assetRepository.findByBranch_BranchIdAndWarrantyExpiryBefore(branchId, threshold);

        return assets.stream()
                .filter(a -> "REPAIR".equals(a.getStatus()) || "DISPOSED".equals(a.getStatus())) // Critical Status only
                .map(a -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("assetId", a.getAssetId());
                    map.put("assetCode", a.getAssetCode());
                    map.put("brand", a.getBrand());
                    map.put("model", a.getModel());
                    map.put("branchName", a.getBranch().getBranchName());
                    map.put("status", a.getStatus());
                    map.put("warrantyExpiry", a.getWarrantyExpiry().toString());
                    map.put("daysLeft", ChronoUnit.DAYS.between(LocalDate.now(), a.getWarrantyExpiry()));
                    return map;
                })
                .collect(Collectors.toList());
    }

    // 5. Failure Distribution (Pie Chart)
    public List<Map<String, Object>> getFailureDistribution(Long branchId, String range) {
        LocalDateTime startDate = getStartDate(range);
        List<Ticket> tickets = (branchId == null) 
            ? ticketRepository.findByCreatedAtAfter(startDate)
            : ticketRepository.findByBranch_BranchIdAndCreatedAtAfter(branchId, startDate);

        Map<String, Long> countByCategory = tickets.stream()
                .filter(t -> t.getErrorCategory() != null)
                .collect(Collectors.groupingBy(t -> t.getErrorCategory().getCategoryName(), Collectors.counting()));

        return countByCategory.entrySet().stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", e.getKey());
            map.put("value", e.getValue());
            return map;
        }).collect(Collectors.toList());
    }
}