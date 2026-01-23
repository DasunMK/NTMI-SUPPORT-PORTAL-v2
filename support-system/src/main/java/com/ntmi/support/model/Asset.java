package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "assets")
@Data
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long assetId;

    @Column(unique = true, nullable = false)
    private String assetCode; 

    // ✅ Device Type (Mapped to DB column 'device_type')
    @Column(name = "device_type") 
    private String deviceType;  

    private String brand;     
    private String model;     
    private String serialNumber;

    // ✅ Date Mappings
    @Column(name = "purchase_date")
    private LocalDate purchasedDate; 

    @Column(name = "warranty_expiry")
    private LocalDate warrantyExpiry;

    // ✅ Repair Tracking (Synced with SQL)
    @Column(name = "repair_count")
    private int repairCount = 0;
    
    private String status; 

    // --- Relationships ---

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"users", "tickets", "assets"}) // Prevents Infinite Loop
    @ToString.Exclude 
    @EqualsAndHashCode.Exclude
    private Branch branch;

    // ✅ NEW: Link to Repair History
    // "mappedBy" refers to the 'asset' field in RepairRecord.java
    // "cascade = Remove" means if you delete the Asset, the History is deleted too.
    @OneToMany(mappedBy = "asset", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Important: Don't load history in the main list (fetched separately)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<RepairRecord> repairRecords;
}