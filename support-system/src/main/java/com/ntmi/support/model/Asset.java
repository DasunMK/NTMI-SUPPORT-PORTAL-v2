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

    // ✅ Purchase Cost
    @Column(name = "purchase_cost")
    private Double purchaseCost;

    // ✅ FIX: Changed 'int' to 'Integer' to allow NULL values from DB without crashing
    @Column(name = "repair_count")
    private Integer repairCount;
    
    private String status; 

    // --- Relationships ---

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"users", "tickets", "assets"}) 
    @ToString.Exclude 
    @EqualsAndHashCode.Exclude
    private Branch branch;

    @OneToMany(mappedBy = "asset", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore 
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<RepairRecord> repairRecords;

    // ✅ Calculated Field for Frontend (Not stored in DB)
    @Transient 
    private Double totalRepairCost;

    // Helper to ensure frontend doesn't get null for transient field
    public Double getTotalRepairCost() {
        return totalRepairCost == null ? 0.0 : totalRepairCost;
    }

    public void setTotalRepairCost(Double totalRepairCost) {
        this.totalRepairCost = totalRepairCost;
    }
}