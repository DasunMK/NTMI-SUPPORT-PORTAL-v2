package com.ntmi.support.controller;

import com.ntmi.support.model.Asset;
import com.ntmi.support.model.Branch;
import com.ntmi.support.model.RepairRecord;
import com.ntmi.support.repository.AssetRepository;
import com.ntmi.support.repository.BranchRepository;
import com.ntmi.support.repository.RepairRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // ✅ Important Import
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private RepairRecordRepository repairRecordRepository;

    // --- 1. READ ACTIONS ---

    @GetMapping
    public ResponseEntity<List<Asset>> getAllAssets() {
        return ResponseEntity.ok(assetRepository.findAll());
    }

    // ✅ FIX: Allow BOTH 'ADMIN' and 'BRANCH_USER' (or 'BRANCH_OFFICER') to access this endpoint
    // This prevents the 403 Forbidden error that causes the frontend to log you out.
    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'BRANCH_USER', 'BRANCH_OFFICER')") 
    public ResponseEntity<List<Asset>> getAssetsByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(assetRepository.findByBranch_BranchId(branchId));
    }

    // ✅ Allow history view for all authenticated users (so branch users can see repair logs)
    @GetMapping("/{id}/history")
    public ResponseEntity<List<RepairRecord>> getAssetHistory(@PathVariable Long id) {
        return ResponseEntity.ok(repairRecordRepository.findByAsset_AssetId(id));
    }

    // --- 2. CREATE ACTION ---

    @PostMapping
    public ResponseEntity<?> createAsset(@RequestParam Long branchId, @RequestBody Asset asset) {
        try {
            Branch branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new RuntimeException("Branch not found"));
            
            asset.setBranch(branch);
            if (asset.getStatus() == null) asset.setStatus("ACTIVE");
            
            return ResponseEntity.ok(assetRepository.save(asset));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating asset: " + e.getMessage());
        }
    }

    // --- 3. UPDATE ACTION ---

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAsset(@PathVariable Long id, @RequestBody Asset assetDetails) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        // Basic Info
        asset.setAssetCode(assetDetails.getAssetCode());
        asset.setBrand(assetDetails.getBrand());
        asset.setModel(assetDetails.getModel());
        asset.setSerialNumber(assetDetails.getSerialNumber());
        asset.setDeviceType(assetDetails.getDeviceType()); 

        // Status & Dates
        asset.setStatus(assetDetails.getStatus());
        asset.setPurchasedDate(assetDetails.getPurchasedDate());
        asset.setWarrantyExpiry(assetDetails.getWarrantyExpiry());

        // Update Branch only if a new one is passed
        if (assetDetails.getBranch() != null && assetDetails.getBranch().getBranchId() != null) {
            Branch newBranch = branchRepository.findById(assetDetails.getBranch().getBranchId())
                    .orElse(asset.getBranch());
            asset.setBranch(newBranch);
        }

        return ResponseEntity.ok(assetRepository.save(asset));
    }

    // --- 4. DELETE ACTION ---

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAsset(@PathVariable Long id) {
        try {
            assetRepository.deleteById(id);
            return ResponseEntity.ok().body("{\"message\": \"Asset deleted successfully\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot delete asset. It may be linked to tickets.");
        }
    }
}