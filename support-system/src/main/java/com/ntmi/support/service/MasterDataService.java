package com.ntmi.support.service;

import com.ntmi.support.model.ErrorCategory;
import com.ntmi.support.model.ErrorType;
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

    // --- Category Methods ---
    public List<ErrorCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    public ErrorCategory saveCategory(ErrorCategory category) {
        return categoryRepository.save(category);
    }

    // --- Type Methods ---
    public ErrorType saveType(ErrorType type) {
        return typeRepository.save(type);
    }

    // This is the key method for your Dropdown
    public List<ErrorType> getTypesByCategoryId(Long categoryId) {
        return typeRepository.findByCategory_CategoryId(categoryId);
    }
}