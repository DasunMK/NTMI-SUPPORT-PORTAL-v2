package com.ntmi.support.controller;

import com.ntmi.support.dto.ChangePasswordRequest;
import com.ntmi.support.model.User;
import com.ntmi.support.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") 
public class UserController {

    @Autowired
    private UserService userService;

    // 1. Get All Users (Admin Only)
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // 2. Get Single User (Accessible by ANY logged-in user for Profile Page)
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

    // 6. Change Password (Any User - Self Service)
    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, 
                                            @RequestBody ChangePasswordRequest request,
                                            Authentication auth) {
        try {
            // Security Check: Ensure user is changing THEIR OWN password (or is Admin)
            String currentUsername = auth.getName();
            Optional<User> currentUserOpt = userService.findByUsername(currentUsername);
            
            if (currentUserOpt.isPresent()) {
                User currentUser = currentUserOpt.get();
                // If ID doesn't match AND not Admin -> Block
                if (!currentUser.getUserId().equals(id) && !currentUser.getRole().equals("ADMIN")) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only change your own password.");
                }
            }

            // Proceed to change password
            userService.changePassword(id, request.getCurrentPassword(), request.getNewPassword());
            return ResponseEntity.ok("Password changed successfully");
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}