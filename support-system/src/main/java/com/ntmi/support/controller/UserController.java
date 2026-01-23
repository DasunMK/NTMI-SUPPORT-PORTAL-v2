package com.ntmi.support.controller;

import com.ntmi.support.model.User;
import com.ntmi.support.repository.UserRepository; // ✅ Ensure Repository is imported
import com.ntmi.support.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder; // ✅ Import PasswordEncoder
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") 
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository; // ✅ Inject Repository

    @Autowired
    private PasswordEncoder passwordEncoder; // ✅ Inject PasswordEncoder

    // 1. Get All Users (Admin Only)
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // 2. Get Single User (Accessible by ANY logged-in user)
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Create User (Admin Only)
    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    // 4. Update User (Admin Only)
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    // 5. Delete User (Admin Only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().body("{\"message\": \"User deleted successfully\"}");
    }

    // ✅ 6. FIXED: Change Password (Self Service)
    // No ID in URL - Uses the logged-in user's Token
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload, Authentication auth) {
        try {
            // 1. Identify the user from the Auth Token
            String username = auth.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User context not found. Please relogin."));

            String currentPassword = payload.get("currentPassword");
            String newPassword = payload.get("newPassword");

            // 2. Validate Inputs
            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().body("Both current and new passwords are required.");
            }

            // 3. Check if Old Password matches
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.badRequest().body("Incorrect current password.");
            }

            // 4. Update and Save
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            return ResponseEntity.ok("Password updated successfully.");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}