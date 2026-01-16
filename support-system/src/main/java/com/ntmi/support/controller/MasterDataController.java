package com.ntmi.support.controller;

import com.ntmi.support.model.Branch;
import com.ntmi.support.model.ErrorCategory;
import com.ntmi.support.model.ErrorType;
import com.ntmi.support.service.MasterDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/master-data")
@CrossOrigin(origins = "*")
public class MasterDataController {

    @Autowired
    private MasterDataService service;

    // --- BRANCHES ---
    
    // 1. Get All Branches (For Profile Filter & Dropdowns)
    @GetMapping("/branches")
    public List<Branch> getAllBranches() {
        return service.getAllBranches();
    }

    // --- CATEGORIES ---

    @PostMapping("/categories")
    public ResponseEntity<ErrorCategory> createCategory(@RequestBody ErrorCategory category) {
        return ResponseEntity.ok(service.saveCategory(category));
    }

    @GetMapping("/categories")
    public List<ErrorCategory> getAllCategories() {
        return service.getAllCategories();
    }

    // --- ERROR TYPES ---

    @PostMapping("/types")
    public ResponseEntity<ErrorType> createType(@RequestBody ErrorType type) {
        return ResponseEntity.ok(service.saveType(type));
    }

    // 2. Get All Types (For Profile Filter)
    @GetMapping("/types")
    public List<ErrorType> getAllTypes() {
        return service.getAllTypes();
    }

    // 3. Get Types by Category (For Create Ticket Dropdown)
    @GetMapping("/types/by-category/{categoryId}")
    public List<ErrorType> getTypesByCategory(@PathVariable Long categoryId) {
        return service.getTypesByCategoryId(categoryId);
    }
}