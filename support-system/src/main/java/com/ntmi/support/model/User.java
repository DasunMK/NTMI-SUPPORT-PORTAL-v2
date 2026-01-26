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
import java.util.Collections;
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

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    // ✅ FIX APPLIED: Added 'columnDefinition' to handle existing data in DB.
    // "BIT DEFAULT 1" sets this to TRUE for all current users, preventing the SQL error.
    @Column(nullable = false, columnDefinition = "BIT DEFAULT 1")
    private boolean active = true; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; 

    // --- RELATIONSHIPS ---

    @ManyToOne
    @JoinColumn(name = "branch_id")
    @JsonIgnoreProperties({"users", "tickets", "assets"}) 
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Branch branch;

    @OneToMany(mappedBy = "createdBy")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Ticket> tickets;

    // --- SPRING SECURITY METHODS ---

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (this.role == null) return Collections.emptyList();
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() { return true; }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() { return this.active; } // ✅ Lock account if inactive

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    @JsonIgnore
    public boolean isEnabled() { return this.active; } // ✅ Disable account if inactive
}