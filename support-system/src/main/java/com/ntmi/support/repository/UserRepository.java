package com.ntmi.support.repository;

import com.ntmi.support.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; // ✅ Import List
import java.util.Optional;
import com.ntmi.support.model.Role;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // This method is critical for Login (Finding user by username)
    Optional<User> findByUsername(String username);
    
    // To check if email already exists during registration
    Boolean existsByEmail(String email);
    
    // To check if username already exists
    Boolean existsByUsername(String username);

    // ✅ ADDED: Find all users by Role (Needed for Notifications)
    List<User> findByRole(Role role);
}