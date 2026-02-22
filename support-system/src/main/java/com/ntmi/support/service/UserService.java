package com.ntmi.support.service;

import com.ntmi.support.model.Role; // ✅ Import Role
import com.ntmi.support.model.User;
import com.ntmi.support.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // --- 1. Spring Security Login ---
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    // --- 2. CRUD Operations ---

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // ✅ SECURE CREATE: Requires the 'creator' (Current User) to validate permissions
    public User createUser(User newUser, User creator) {
        if (userRepository.existsByUsername(newUser.getUsername())) {
            throw new RuntimeException("Username already exists!");
        }

        // --- SECURITY CHECK: Privilege Escalation Prevention ---
        
        // Check 1: Branch Users cannot create accounts
        if (creator.getRole() == Role.BRANCH_USER) {
            throw new RuntimeException("Access Denied: Branch users cannot create accounts.");
        }

        // Check 2: Only SUPER_ADMIN can create high-level roles
        if (newUser.getRole() == Role.SUPER_ADMIN || newUser.getRole() == Role.ACCOUNT_HEAD) {
            if (creator.getRole() != Role.SUPER_ADMIN) {
                throw new RuntimeException("Access Denied: Only Super Admin can create Executive accounts.");
            }
        }

        // Encode password
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        return userRepository.save(newUser);
    }

    // ✅ SECURE UPDATE: Prevent unauthorized Role promotions
    public User updateUser(Long id, User updatedInfo, User modifier) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Security: Prevent regular Admins from promoting users to SUPER_ADMIN
        if (updatedInfo.getRole() == Role.SUPER_ADMIN && modifier.getRole() != Role.SUPER_ADMIN) {
             throw new RuntimeException("Access Denied: You cannot promote a user to Super Admin.");
        }

        existing.setFullName(updatedInfo.getFullName());
        existing.setEmail(updatedInfo.getEmail());
        existing.setRole(updatedInfo.getRole());
        existing.setBranch(updatedInfo.getBranch());
        
        // Only update password if a new one is typed
        if (updatedInfo.getPassword() != null && !updatedInfo.getPassword().isEmpty()) {
            existing.setPassword(passwordEncoder.encode(updatedInfo.getPassword()));
        }

        return userRepository.save(existing);
    }

    // CHANGE PASSWORD (Self Service)
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify old password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect current password");
        }

        // Save new password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}