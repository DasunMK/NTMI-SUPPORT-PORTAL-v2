package com.ntmi.support.repository;

import com.ntmi.support.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    // We can add custom search methods here easily if needed later
    // Example: Branch findByBranchName(String name);
}