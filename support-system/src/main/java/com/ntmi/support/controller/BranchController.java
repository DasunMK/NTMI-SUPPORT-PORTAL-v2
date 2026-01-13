package com.ntmi.support.controller;

import com.ntmi.support.model.Branch;
import com.ntmi.support.service.BranchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@CrossOrigin(origins = "*") // Allows React/Postman to access this API without blocking
public class BranchController {

    @Autowired
    private BranchService branchService;

    // 1. Get All Branches
    // GET http://localhost:8080/api/branches
    @GetMapping
    public List<Branch> getAllBranches() {
        return branchService.getAllBranches();
    }

    // 2. Add a New Branch
    // POST http://localhost:8080/api/branches
    @PostMapping
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch) {
        Branch newBranch = branchService.saveBranch(branch);
        return ResponseEntity.ok(newBranch);
    }
}