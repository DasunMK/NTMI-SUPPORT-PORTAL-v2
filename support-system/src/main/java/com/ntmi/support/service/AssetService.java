package com.ntmi.support.service;

import com.ntmi.support.dto.ReliabilityDTO;
import com.ntmi.support.repository.AssetRepository;
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