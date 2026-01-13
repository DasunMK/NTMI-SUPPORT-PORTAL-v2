package com.ntmi.support.controller;

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

    // 1. Add Category (e.g., "Hardware")
    @PostMapping("/categories")
    public ResponseEntity<ErrorCategory> createCategory(@RequestBody ErrorCategory category) {
        return ResponseEntity.ok(service.saveCategory(category));
    }

    // 2. Get All Categories (For the first dropdown)
    @GetMapping("/categories")
    public List<ErrorCategory> getAllCategories() {
        return service.getAllCategories();
    }

    // 3. Add Error Type (e.g., "Printer Jam" for Hardware)
    @PostMapping("/types")
    public ResponseEntity<ErrorType> createType(@RequestBody ErrorType type) {
        return ResponseEntity.ok(service.saveType(type));
    }

    // 4. Get Types by Category ID (For the second dropdown)
    // Example: /api/master-data/types/by-category/1
    @GetMapping("/types/by-category/{categoryId}")
    public List<ErrorType> getTypesByCategory(@PathVariable Long categoryId) {
        return service.getTypesByCategoryId(categoryId);
    }
}