package com.ntmi.support.repository;

import com.ntmi.support.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
    // This is used for the Dropdown in the Frontend
    List<Asset> findByBranch_BranchId(Long branchId);
    
    // We will use this later for the Reliability Dashboard
    @Query("SELECT a.model, COUNT(t) FROM Ticket t JOIN t.asset a GROUP BY a.model ORDER BY COUNT(t) DESC")
    List<Object[]> findUnreliableModels();

    @Query("SELECT a.model, COUNT(a) FROM Asset a GROUP BY a.model")
    List<Object[]> countTotalAssetsByModel();

    // 2. Count Total Tickets per Model (e.g., Dell Latitude: 20 tickets)
    @Query("SELECT t.asset.model, COUNT(t) FROM Ticket t WHERE t.asset IS NOT NULL GROUP BY t.asset.model")
    List<Object[]> countTicketsByModel();


    @Query("SELECT a.model, COUNT(a), " +
           "SUM(CASE WHEN a.status IN ('REPAIR', 'DISPOSED') THEN 1 ELSE 0 END) " +
           "FROM Asset a GROUP BY a.model")
    List<Object[]> getReliabilityStatsRaw();
    
    boolean existsByAssetCode(String assetCode);



long countByBranch_BranchId(Long branchId);
List<Asset> findByWarrantyExpiryBefore(LocalDate date);
List<Asset> findByBranch_BranchIdAndWarrantyExpiryBefore(Long branchId, LocalDate date);}
