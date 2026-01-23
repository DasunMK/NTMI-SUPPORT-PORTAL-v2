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
    
    @Autowired private BrandRepository brandRepository;
    @Autowired private DeviceModelRepository modelRepository;
    
    @Autowired private DeviceTypeRepository deviceTypeRepository;

    // --- 1. MANAGE BRANCHES ---
    @GetMapping("/branches")
    public List<Branch> getAllBranches() { return branchRepository.findAll(); }

    @PostMapping("/branches")
    public Branch addBranch(@RequestBody Branch branch) { return branchRepository.save(branch); }

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
    @GetMapping("/categories")
    public List<ErrorCategory> getAllCategories() { return categoryRepository.findAll(); }

    @PostMapping("/categories")
    public ErrorCategory addCategory(@RequestBody ErrorCategory category) { return categoryRepository.save(category); }

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
    @GetMapping("/types")
    public List<ErrorType> getAllTypes() { return typeRepository.findAll(); }

    @PostMapping("/types")
    public ErrorType addType(@RequestBody ErrorType type) { return typeRepository.save(type); }

    @DeleteMapping("/types/{id}")
    public ResponseEntity<?> deleteType(@PathVariable Long id) {
        try {
            typeRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot delete: Used in tickets.");
        }
    }

    // --- 4. MANAGE BRANDS ---
    @GetMapping("/brands")
    public List<Brand> getAllBrands() { return brandRepository.findAll(); }

    @PostMapping("/brands")
    public Brand addBrand(@RequestBody Brand brand) { return brandRepository.save(brand); }

    @DeleteMapping("/brands/{id}")
    public ResponseEntity<?> deleteBrand(@PathVariable Long id) {
        try {
            brandRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot delete: Used by Assets/Models.");
        }
    }

    // --- 5. MANAGE MODELS (✅ UPDATED VALIDATION) ---
    @GetMapping("/models")
    public List<DeviceModel> getAllModels() { return modelRepository.findAll(); }

    @PostMapping("/models")
    public ResponseEntity<?> addModel(@RequestBody DeviceModel model) {
        // 1. Validate Brand
        if (model.getBrand() == null || model.getBrand().getId() == null) {
            return ResponseEntity.badRequest().body("Error: Select a Brand.");
        }
        // 2. Validate Device Type (✅ Added this check)
        if (model.getDeviceType() == null || model.getDeviceType().getId() == null) {
            return ResponseEntity.badRequest().body("Error: Select a Device Type.");
        }
        
        return ResponseEntity.ok(modelRepository.save(model));
    }

    @DeleteMapping("/models/{id}")
    public ResponseEntity<?> deleteModel(@PathVariable Long id) {
        try {
            modelRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot delete: Used by Assets.");
        }
    }

    // --- 6. MANAGE DEVICE TYPES ---
    @GetMapping("/device-types")
    public List<DeviceType> getAllDeviceTypes() { 
        return deviceTypeRepository.findAll(); 
    }

    @PostMapping("/device-types")
    public DeviceType addDeviceType(@RequestBody DeviceType type) { 
        return deviceTypeRepository.save(type); 
    }

    @DeleteMapping("/device-types/{id}")
    public ResponseEntity<?> deleteDeviceType(@PathVariable Long id) {
        try {
            deviceTypeRepository.deleteById(id);
            return ResponseEntity.ok("Deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Cannot delete: In use.");
        }
    }
}