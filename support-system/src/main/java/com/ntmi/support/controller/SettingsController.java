package com.ntmi.support.controller;

import com.ntmi.support.model.*;
import com.ntmi.support.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAuthority('ADMIN')")
public class SettingsController {

    @Autowired private BranchRepository branchRepository;
    @Autowired private ErrorCategoryRepository categoryRepository;
    @Autowired private ErrorTypeRepository typeRepository;

    // --- 1. MANAGE BRANCHES ---
    
    // ✅ ADD THIS GET METHOD
    @GetMapping("/branches")
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    @PostMapping("/branches")
    public Branch addBranch(@RequestBody Branch branch) {
        return branchRepository.save(branch);
    }

    @DeleteMapping("/branches/{id}")
    public ResponseEntity<?> deleteBranch(@PathVariable Long id) {
        try {
            branchRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot delete: This branch is used in tickets/users.");
        }
    }

    // --- 2. MANAGE CATEGORIES ---

    // ✅ ADD THIS GET METHOD
    @GetMapping("/categories")
    public List<ErrorCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    @PostMapping("/categories")
    public ErrorCategory addCategory(@RequestBody ErrorCategory category) {
        return categoryRepository.save(category);
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        try {
            categoryRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot delete: Used by tickets or types.");
        }
    }

    // --- 3. MANAGE ERROR TYPES ---

    // ✅ ADD THIS GET METHOD
    @GetMapping("/types")
    public List<ErrorType> getAllTypes() {
        return typeRepository.findAll();
    }

    @PostMapping("/types")
    public ErrorType addType(@RequestBody ErrorType type) {
        return typeRepository.save(type);
    }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<?> deleteType(@PathVariable Long id) {
        try {
            typeRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot delete: Used in tickets.");
        }
    }
}