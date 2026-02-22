package com.ntmi.support.service;

import com.ntmi.support.dto.ReliabilityDTO;
import com.ntmi.support.model.Asset;
import com.ntmi.support.model.Ticket;
import com.ntmi.support.repository.AssetRepository;
import com.ntmi.support.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AssetService {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private TicketRepository ticketRepository;

    // --- 1. Asset Management (Frontend) ---

    // ✅ Get Assets by Branch (With calculated costs)
    public List<Asset> getAssetsByBranch(Long branchId) {
        List<Asset> assets = assetRepository.findByBranch_BranchId(branchId);
        return calculateCostsForAssets(assets);
    }

    // ✅ Get All Assets (With calculated costs)
    public List<Asset> getAllAssets() {
        List<Asset> assets = assetRepository.findAll();
        return calculateCostsForAssets(assets);
    }

    // ✅ Create / Update Asset
    public Asset saveAsset(Asset asset) {
        return assetRepository.save(asset);
    }

    // ✅ Helper: Calculates Total Repair Cost (Handles BigDecimal)
    private List<Asset> calculateCostsForAssets(List<Asset> assets) {
        for (Asset asset : assets) {
            List<Ticket> history = ticketRepository.findByAsset_AssetId(asset.getAssetId());
            
            // ✅ FIX: Sum BigDecimal correctly
            BigDecimal totalCostBD = history.stream()
                .map(Ticket::getRepairCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Set the transient field (convert to double for frontend compatibility if needed)
            asset.setTotalRepairCost(totalCostBD.doubleValue());
        }
        return assets;
    }

    // --- 2. Analytics & Reports ---

    public List<ReliabilityDTO> getReliabilityStats() {
        // Fetch all assets
        List<Asset> allAssets = assetRepository.findAll();
        Map<String, ReliabilityDTO> modelStats = new HashMap<>();

        for (Asset asset : allAssets) {
            String model = asset.getModel(); // Group by Model Name

            // Get or create DTO for this model
            ReliabilityDTO dto = modelStats.getOrDefault(model, new ReliabilityDTO());
            if (dto.getModelName() == null) {
                dto.setModelName(model);
                dto.setTotalUnits(0L);
                dto.setTotalFailures(0L);
                dto.setTotalRepairCost(0.0);
            }

            // 1. Increment Total Units
            dto.setTotalUnits(dto.getTotalUnits() + 1);

            // 2. Check Failures & Cost
            List<Ticket> tickets = ticketRepository.findByAsset(asset);
            if (!tickets.isEmpty()) {
                dto.setTotalFailures(dto.getTotalFailures() + tickets.size());

                BigDecimal cost = tickets.stream()
                    .map(Ticket::getRepairCost)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                dto.setTotalRepairCost(dto.getTotalRepairCost() + cost.doubleValue());
            }

            modelStats.put(model, dto);
        }

        // 3. Finalize: Calculate Failure Rate %
        List<ReliabilityDTO> results = new ArrayList<>(modelStats.values());
        for (ReliabilityDTO dto : results) {
            if (dto.getTotalUnits() > 0) {
                double rate = ((double) dto.getTotalFailures() / dto.getTotalUnits()) * 100;
                dto.setFailureRate(Math.round(rate * 10.0) / 10.0); // Round to 1 decimal
            }
        }

        // Sort by Failure Rate (Highest first)
        results.sort((a, b) -> Double.compare(b.getFailureRate(), a.getFailureRate()));

        return results;
    }
}