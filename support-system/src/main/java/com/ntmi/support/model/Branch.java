package com.ntmi.support.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "branches")
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long branchId;

    @Column(nullable = false, unique = true)
    private String branchName; // e.g., "Nugegoda Operations", "Kandy"

    @Column(nullable = false, unique = true)
    private String branchCode; // e.g., "NUG", "KDY"

    private String contactNumber;
    
    private String location; // Address or City
}