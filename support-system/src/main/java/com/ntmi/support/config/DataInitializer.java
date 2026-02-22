package com.ntmi.support.config;

import com.ntmi.support.model.Branch;
import com.ntmi.support.model.User;
import com.ntmi.support.model.Role;
import com.ntmi.support.repository.BranchRepository;
import com.ntmi.support.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository; 

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🚀 [DataInitializer] Checking System Data...");

        // 1. ROBUST BRANCH CHECK
        // Don't rely on ID=1. Find existing "HO-001" or create it.
        List<Branch> allBranches = branchRepository.findAll();
        
        Branch headOffice = allBranches.stream()
            .filter(b -> "HO-001".equals(b.getBranchCode()))
            .findFirst()
            .orElseGet(() -> {
                System.out.println("⚙️ Creating Default Head Office Branch...");
                Branch b = new Branch();
                b.setBranchName("Head Office");
                b.setBranchCode("HO-001");
                b.setLocation("Colombo");
                b.setContactNumber("011-0000000");
                return branchRepository.save(b);
            });

        // --------------------------------------------------------
        // 2. CREATE SUPER ADMIN
        // --------------------------------------------------------
        Optional<User> superAdminOp = userRepository.findByUsername("superadmin");

        if (superAdminOp.isEmpty()) {
            User root = new User();
            root.setUsername("superadmin");
            root.setPassword(passwordEncoder.encode("admin123")); 
            root.setFullName("Technical Director");
            root.setEmail("root@ntmi.lk");
            root.setRole(Role.SUPER_ADMIN);
            root.setBranch(headOffice); 

            userRepository.save(root);
            System.out.println("✅ [DataInitializer] SUPER_ADMIN Created.");
        } else {
            System.out.println("ℹ️ [DataInitializer] SUPER_ADMIN already exists.");
        }

        // --------------------------------------------------------
        // 3. CREATE/FIX REGULAR ADMIN
        // --------------------------------------------------------
        Optional<User> adminOp = userRepository.findByUsername("admin");

        if (adminOp.isPresent()) {
            User admin = adminOp.get();
            // Ensure legacy admin is linked to a valid branch
            if (admin.getBranch() == null) {
                admin.setBranch(headOffice);
                userRepository.save(admin);
                System.out.println("✅ [DataInitializer] Linked 'admin' to Head Office.");
            }
        } else {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("System Administrator");
            admin.setRole(Role.ADMIN);
            admin.setEmail("admin@ntmi.lk");
            admin.setBranch(headOffice); 
            
            userRepository.save(admin);
            System.out.println("✅ [DataInitializer] 'admin' user Created.");
        }
    }
}