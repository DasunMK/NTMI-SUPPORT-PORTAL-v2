package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Data
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(unique = true, nullable = false)
    private String username;

    // ✅ Prevents password from being sent back in JSON responses (Write Only)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    // ✅ CRITICAL FIX: "BIT DEFAULT 1" handles existing data in DB.
    // Ensures all current users are set to TRUE automatically.
    @Column(nullable = false, columnDefinition = "BIT DEFAULT 1")
    private boolean active = true; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; 

    // --- RELATIONSHIPS ---

    @ManyToOne
    @JoinColumn(name = "branch_id")
    // Prevents infinite JSON recursion when fetching Branch -> Users
    @JsonIgnoreProperties({"users", "tickets", "assets"}) 
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Branch branch;

    // One User creates Many Tickets
    @OneToMany(mappedBy = "createdBy")
    @JsonIgnore // Prevents recursion: Ticket -> User -> Ticket
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Ticket> tickets;

    // --- SPRING SECURITY METHODS ---

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (this.role == null) return List.of();
        // ✅ FIXED: Removed "ROLE_" prefix to match @PreAuthorize("hasAuthority('ADMIN')")
        return List.of(new SimpleGrantedAuthority(this.role.name()));
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() { return true; }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() { return this.active; } // Lock account if inactive

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    @JsonIgnore
    public boolean isEnabled() { return this.active; } // Disable login if inactive
}