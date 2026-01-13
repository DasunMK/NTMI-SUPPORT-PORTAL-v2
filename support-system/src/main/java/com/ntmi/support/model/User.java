package com.ntmi.support.model;

import jakarta.persistence.*;
import lombok.Data; // Lombbok automatically creates Getters/Setters
import com.fasterxml.jackson.annotation.JsonProperty; // For JSON control

@Entity
@Data // Generates Getters, Setters, ToString, etc. automatically
@Table(name = "users") // "User" is a reserved keyword in MSSQL, so we use "users"
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(unique = true, nullable = false)
    private String username;

    // "WRITE_ONLY" means we can accept password in JSON, 
    // but we NEVER send the password back in the JSON response (Security best practice)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // We will create this Enum next

    // If the user is a "Branch User", they belong to a Branch.
    // If "Admin", this can be null.
    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch; // We will create the Branch entity later
}