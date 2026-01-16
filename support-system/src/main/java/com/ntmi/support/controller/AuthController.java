package com.ntmi.support.controller;

import com.ntmi.support.config.JwtUtils;
import com.ntmi.support.model.User;
import com.ntmi.support.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allow requests from React
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    // --- ✅ NEW: REGISTER ENDPOINT (Fixes 404 Error) ---
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            // The UserService already handles Password Encoding inside saveUser()
            User savedUser = userService.saveUser(user);
            return ResponseEntity.ok("User registered successfully with ID: " + savedUser.getUserId());
        } catch (RuntimeException e) {
            // Catch "Username already exists" errors
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error registering user: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateToken(username);

            Optional<User> userOp = userService.findByUsername(username);
            
            if (userOp.isPresent()) {
                User user = userOp.get();
                Map<String, Object> response = new HashMap<>();
                response.put("token", jwt);
                response.put("userId", user.getUserId());
                response.put("username", user.getUsername());
                response.put("fullName", user.getFullName());
                response.put("role", user.getRole().name());
                
                if (user.getBranch() != null) {
                    response.put("branchName", user.getBranch().getBranchName());
                    response.put("branchId", user.getBranch().getBranchId());
                } else {
                    response.put("branchName", "Head Office");
                    response.put("branchId", null);
                }
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.badRequest().body("User not found");

        } catch (Exception e) {
            return ResponseEntity.status(403).body("Login Failed: " + e.getMessage());
        }
    }
}