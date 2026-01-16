package com.ntmi.support.repository;

import com.ntmi.support.model.ErrorType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ErrorTypeRepository extends JpaRepository<ErrorType, Long> {
    
    // FIX: The method name must match the field "category" in ErrorType.java
    List<ErrorType> findByCategory_CategoryId(Long categoryId);
}