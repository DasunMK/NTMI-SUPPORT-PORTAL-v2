package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal; // ✅ Required for precise financial data
import java.time.LocalDate;

@Entity
@Table(name = "repair_records")
@Data
public class RepairRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to the Asset being repaired
    @ManyToOne
    @JoinColumn(name = "asset_id", nullable = false)
    @JsonIgnoreProperties({"repairRecords", "tickets", "branch"}) 
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Asset asset;

    // Link to the Ticket that caused this repair
    @OneToOne
    @JoinColumn(name = "ticket_id")
    @JsonIgnoreProperties({"asset", "branch", "images", "comments", "assignedAdmin", "createdBy"}) 
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Ticket ticket;

    // "Replaced Hard Drive", "Software Update", etc.
    @Column(nullable = false, length = 500)
    private String actionTaken; 

    private LocalDate repairDate;

    // ✅ FIXED: Using BigDecimal ensures SQL Server maps this to DECIMAL(18,2)
    // This avoids the "scale has no meaning for SQL floating point types" error.
    @Column(precision = 18, scale = 2)
    private BigDecimal cost = BigDecimal.ZERO; 
}