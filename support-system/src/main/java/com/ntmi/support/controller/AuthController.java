package com.ntmi.support.controller;

import com.ntmi.support.dto.LoginRequest;
import com.ntmi.support.dto.LoginResponse;
import com.ntmi.support.model.User;
import com.ntmi.support.repository.UserRepository;
import com.ntmi.support.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        // 1. Find User
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();

            // 2. Check Password
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                
                // 3. Generate Token
                String token = jwtUtils.generateToken(user);
                
                // 4. Return Response
                Long branchId = (user.getBranch() != null) ? user.getBranch().getBranchId() : null;
                
                return ResponseEntity.ok(new LoginResponse(
                        token,
                        user.getUserId(),
                        user.getUsername(),
                        user.getRole().name(),
                        branchId
                ));
            }
        }
        
        return ResponseEntity.status(401).body("Invalid Username or Password");
    }
}