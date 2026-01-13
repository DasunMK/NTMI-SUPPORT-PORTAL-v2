package com.ntmi.support.repository;

import com.ntmi.support.model.ErrorType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ErrorTypeRepository extends JpaRepository<ErrorType, Long> {
    // Custom query to find types by their parent category ID
    List<ErrorType> findByCategory_CategoryId(Long categoryId);
}