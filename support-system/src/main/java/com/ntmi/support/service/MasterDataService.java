package com.ntmi.support.service;

import com.ntmi.support.model.Branch;
import com.ntmi.support.model.ErrorCategory;
import com.ntmi.support.model.ErrorType;
import com.ntmi.support.repository.BranchRepository;
import com.ntmi.support.repository.ErrorCategoryRepository;
import com.ntmi.support.repository.ErrorTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MasterDataService {

    @Autowired
    private ErrorCategoryRepository categoryRepository;

    @Autowired
    private ErrorTypeRepository typeRepository;

    @Autowired
    private BranchRepository branchRepository; 

    // --- CATEGORIES ---
    public ErrorCategory saveCategory(ErrorCategory category) {
        return categoryRepository.save(category);
    }

    public List<ErrorCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    // --- ERROR TYPES ---
    public ErrorType saveType(ErrorType type) {
        return typeRepository.save(type);
    }

    public List<ErrorType> getAllTypes() {
        return typeRepository.findAll();
    }

    public List<ErrorType> getTypesByCategoryId(Long categoryId) {
        // FIXED LINE BELOW: Changed "ErrorCategory" to "Category"
        return typeRepository.findByCategory_CategoryId(categoryId);
    }

    // --- BRANCHES ---
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }
}