package com.ntmi.support.repository;

import com.ntmi.support.model.RepairRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface RepairRecordRepository extends JpaRepository<RepairRecord, Long> {

    // ✅ FIX: Add this line to allow searching repairs by Asset ID
    List<RepairRecord> findByAsset_AssetId(Long assetId);

    // --- Existing Monthly Cost Query (Keep this) ---
    @Query(value = """
        SELECT 
            b.branch_name AS branch, 
            FORMAT(r.repair_date, 'yyyy-MM') AS month, 
            SUM(r.cost) AS totalCost 
        FROM repair_records r
        JOIN assets a ON r.asset_id = a.asset_id
        JOIN branches b ON a.branch_id = b.branch_id
        GROUP BY b.branch_name, FORMAT(r.repair_date, 'yyyy-MM')
        ORDER BY month DESC
    """, nativeQuery = true)
    List<Map<String, Object>> findMonthlyCostsByBranch();
List<RepairRecord> findByRepairDateAfter(LocalDate date);
List<RepairRecord> findByAsset_Branch_BranchIdAndRepairDateAfter(Long branchId, LocalDate date);

    // Calculate total lifetime cost of all repairs
    @Query("SELECT SUM(r.cost) FROM RepairRecord r")
    Double sumTotalCost();

}