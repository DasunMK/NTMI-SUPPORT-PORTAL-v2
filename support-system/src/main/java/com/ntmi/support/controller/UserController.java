package com.ntmi.support.controller;

import com.ntmi.support.model.User;
import com.ntmi.support.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // <--- IMPORT THIS
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") 
public class UserController {

    @Autowired
    private UserService userService;

    // 1. Get All Users (Secured for ADMIN only)
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')") // <--- FIX: This allows access to Admins
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // 2. Get Single User (For Profile Page)
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}