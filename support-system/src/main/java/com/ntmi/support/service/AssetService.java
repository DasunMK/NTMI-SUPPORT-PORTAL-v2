package com.ntmi.support.service;

import com.ntmi.support.dto.ReliabilityDTO;
import com.ntmi.support.model.Asset;
import com.ntmi.support.model.Ticket;
import com.ntmi.support.repository.AssetRepository;
import com.ntmi.support.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AssetService {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private TicketRepository ticketRepository; // ✅ Required for cost calculation

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

    // ✅ Helper: Calculates Total Repair Cost on the fly
    private List<Asset> calculateCostsForAssets(List<Asset> assets) {
        for (Asset asset : assets) {
            // Find all tickets for this asset
            List<Ticket> history = ticketRepository.findByAsset_AssetId(asset.getAssetId());
            
            // Sum up the repair costs (safely handling nulls)
            double totalCost = history.stream()
                .filter(t -> t.getRepairCost() != null)
                .mapToDouble(Ticket::getRepairCost)
                .sum();
            
            // Set the transient field
            asset.setTotalRepairCost(totalCost);
            
            // Optional: Ensure repair count matches ticket history size
            // asset.setRepairCount(history.size()); 
        }
        return assets;
    }

    // --- 2. Analytics & Reports ---

    public List<ReliabilityDTO> getReliabilityStats() {
        // 1. Get raw data
        List<Object[]> totalAssets = assetRepository.countTotalAssetsByModel();
        List<Object[]> totalTickets = assetRepository.countTicketsByModel();

        // 2. Map Ticket Counts for fast lookup
        Map<String, Long> ticketMap = new HashMap<>();
        for (Object[] row : totalTickets) {
            ticketMap.put((String) row[0], (Long) row[1]);
        }

        // 3. Combine and Calculate
        List<ReliabilityDTO> stats = new ArrayList<>();
        for (Object[] row : totalAssets) {
            String model = (String) row[0];
            Long totalUnits = (Long) row[1];
            Long failures = ticketMap.getOrDefault(model, 0L);

            // Calculate Rate (Avoid division by zero)
            double rate = totalUnits > 0 ? ((double) failures / totalUnits) * 100 : 0.0;
            
            // Round to 1 decimal place
            rate = Math.round(rate * 10.0) / 10.0;

            stats.add(new ReliabilityDTO(model, totalUnits, failures, rate));
        }
        
        // Sort by highest failure rate
        stats.sort((a, b) -> Double.compare(b.getFailureRate(), a.getFailureRate()));
        
        return stats;
    }
}