package com.ntmi.support.service;

import com.ntmi.support.model.Branch;
import com.ntmi.support.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BranchService {

    @Autowired
    private BranchRepository branchRepository;

    // Get all branches
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    // Save a new branch
    public Branch saveBranch(Branch branch) {
        return branchRepository.save(branch);
    }

    // Get a branch by ID
    public Branch getBranchById(Long id) {
        return branchRepository.findById(id).orElse(null);
    }
}