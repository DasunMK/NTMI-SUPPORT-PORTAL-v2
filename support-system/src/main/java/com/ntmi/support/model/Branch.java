package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import java.util.List;

@Entity
@Data
@Table(name = "branches")
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long branchId;

    @Column(nullable = false, unique = true)
    private String branchName; // e.g., "Nugegoda Operations"

    @Column(nullable = false, unique = true)
    private String branchCode; // e.g., "NUG"

    private String contactNumber;
    private String location; 

    // --- RELATIONSHIPS (Crucial Fix for 500 Error) ---
    // We map these so the DB knows they exist, but use @JsonIgnore 
    // so the API doesn't try to load them infinitely.

    @OneToMany(mappedBy = "branch")
    @JsonIgnore // 🛑 STOPS INFINITE LOOP
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<User> users;

    @OneToMany(mappedBy = "branch")
    @JsonIgnore // 🛑 STOPS INFINITE LOOP
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Ticket> tickets;

    @OneToMany(mappedBy = "branch")
    @JsonIgnore // 🛑 STOPS INFINITE LOOP
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Asset> assets;
}