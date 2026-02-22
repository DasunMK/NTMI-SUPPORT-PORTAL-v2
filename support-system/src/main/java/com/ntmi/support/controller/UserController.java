package com.ntmi.support.controller;

import com.ntmi.support.model.Role;
import com.ntmi.support.model.User;
import com.ntmi.support.repository.UserRepository;
import com.ntmi.support.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 1. Get All Users
    // ✅ Secured: Only Admins and Super Admins can view the full user list
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPER_ADMIN')")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // 2. Get Single User
    // ✅ FIXED: Removed @PreAuthorize so users can view their own profiles!
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, Authentication auth) {
        User currentUser = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Security Check: If a Branch User tries to view someone else's ID, block them.
        if (currentUser.getRole() == Role.BRANCH_USER && !currentUser.getUserId().equals(id)) {
            return ResponseEntity.status(403).body("{\"message\": \"Access Denied. You can only view your own profile.\"}");
        }

        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Create User (Secure)
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody User user, Authentication auth) {
        try {
            // Fetch the creator (Current Logged In User)
            User creator = userRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

            // Ensure the user is active by default
            user.setActive(true);

            // Pass creator to service for Security Check (Prevents Privilege Escalation)
            User createdUser = userService.createUser(user, creator);
            return ResponseEntity.ok(createdUser);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. Update User
    // ✅ FIXED: Removed @PreAuthorize so users can update their own details!
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user, Authentication auth) {
        try {
            // Fetch the modifier
            User modifier = userRepository.findByUsername(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

            // Security Check: Branch users can only update their own profile
            if (modifier.getRole() == Role.BRANCH_USER && !modifier.getUserId().equals(id)) {
                return ResponseEntity.status(403).body("{\"message\": \"Access Denied. You can only edit your own profile.\"}");
            }

            User updatedUser = userService.updateUser(id, user, modifier);
            return ResponseEntity.ok(updatedUser);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. Soft Delete (Deactivate)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> deactivateUser(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // SECURITY: Prevent deactivating a Super Admin via API
            if (user.getRole() == Role.SUPER_ADMIN) {
                return ResponseEntity.status(403).body("{\"message\": \"Cannot deactivate a Super Admin.\"}");
            }

            if (!user.isActive()) {
                return ResponseEntity.badRequest().body("{\"message\": \"User is already inactive.\"}");
            }

            user.setActive(false);
            userRepository.save(user);

            return ResponseEntity.ok().body("{\"message\": \"User deactivated successfully. Access revoked.\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"Error deactivating user: " + e.getMessage() + "\"}");
        }
    }

    // 6. Reactivate User
    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> activateUser(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setActive(true);
            userRepository.save(user);
            return ResponseEntity.ok().body("{\"message\": \"User account reactivated.\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"message\": \"Error reactivating user: " + e.getMessage() + "\"}");
        }
    }

    // 7. Change Password (Self Service)
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload, Authentication auth) {
        try {
            String username = auth.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User context not found."));

            String currentPassword = payload.get("currentPassword");
            String newPassword = payload.get("newPassword");

            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().body("{\"message\": \"Both current and new passwords are required.\"}");
            }

            userService.changePassword(user.getUserId(), currentPassword, newPassword);

            return ResponseEntity.ok().body("{\"message\": \"Password updated successfully.\"}");

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("{\"message\": \"Error: " + e.getMessage() + "\"}");
        }
    }
}