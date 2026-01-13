package com.ntmi.support.repository;

import com.ntmi.support.model.ErrorCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ErrorCategoryRepository extends JpaRepository<ErrorCategory, Long> {
}