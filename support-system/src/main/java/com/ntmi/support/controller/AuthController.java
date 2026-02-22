package com.ntmi.support.controller;

import com.ntmi.support.config.JwtUtils;
import com.ntmi.support.model.User;
import com.ntmi.support.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") 
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        try {
            // 1. Authenticate credentials
            // If user is inactive, Spring Security throws DisabledException here
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            // 2. Set Security Context
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // 3. Generate Token
            String jwt = jwtUtils.generateToken(username);

            // 4. Fetch User Details for Frontend Context
            Optional<User> userOp = userService.findByUsername(username);
            
            if (userOp.isPresent()) {
                User user = userOp.get();
                
                Map<String, Object> response = new HashMap<>();
                response.put("token", jwt);
                response.put("userId", user.getUserId());
                response.put("username", user.getUsername());
                response.put("fullName", user.getFullName());
                response.put("role", user.getRole().name());
                response.put("email", user.getEmail());
                
                // Handle Branch assignment safely
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

        } catch (DisabledException e) {
            // ✅ SPECIFIC ERROR: Account is disabled (active=0)
            return ResponseEntity.status(403).body("Account is disabled. Please contact Administrator.");
            
        } catch (BadCredentialsException e) {
            // ✅ SPECIFIC ERROR: Wrong Password or User doesn't exist
            return ResponseEntity.status(401).body("Invalid Username or Password");
            
        } catch (Exception e) {
            // Catch-all for other unexpected errors
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Server Error: " + e.getMessage());
        }
    }
}