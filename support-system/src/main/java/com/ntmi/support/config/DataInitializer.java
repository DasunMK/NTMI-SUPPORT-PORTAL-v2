package com.ntmi.support.config;

import com.ntmi.support.model.User;
// Make sure this import matches your Role Enum location!
import com.ntmi.support.model.Role; 
import com.ntmi.support.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("🚀 [DataInitializer] Checking Admin User...");

        Optional<User> adminOp = userRepository.findByUsername("admin");

        if (adminOp.isPresent()) {
            // User exists? FORCE RESET the password to the correct Hash
            User admin = adminOp.get();
            admin.setPassword(passwordEncoder.encode("admin123"));
            userRepository.save(admin);
            System.out.println("✅ [DataInitializer] Admin password FIXED to: admin123");
        } else {
            // User doesn't exist? Create them correctly
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123")); // Hash it!
            admin.setFullName("System Administrator");
            admin.setRole(Role.ADMIN); // Make sure Role.ADMIN exists in your Enum
            admin.setEmail("admin@ntmi.lk");
            // admin.setBranch(null); // Head Office
            
            userRepository.save(admin);
            System.out.println("✅ [DataInitializer] Admin User CREATED with password: admin123");
        }
    }
}