package com.ntmi.support.controller;

import com.ntmi.support.model.Branch;
import com.ntmi.support.service.BranchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // ✅ Import Security
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches") // ⚠️ Note: Ensure your Frontend calls '/api/branches', not '/master-data/branches'
@CrossOrigin(origins = "*") 
public class BranchController {

    @Autowired
    private BranchService branchService;

    // 1. Get All Branches
    // ✅ UPDATED: Allow Super Admin, Account Head, and Branch Users to see the list
    // This fixes the "Manage Users" crash for Super Admin.
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPER_ADMIN', 'ACCOUNT_HEAD', 'BRANCH_USER')")
    public ResponseEntity<List<Branch>> getAllBranches() {
        List<Branch> branches = branchService.getAllBranches();
        return ResponseEntity.ok(branches);
    }

    // 2. Add a New Branch
    // ✅ UPDATED: Only IT Admin should be able to create new office branches
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch) {
        Branch newBranch = branchService.saveBranch(branch);
        return ResponseEntity.ok(newBranch);
    }
}