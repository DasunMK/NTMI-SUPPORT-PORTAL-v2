package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "repair_records")
@Data
public class RepairRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to the Asset being repaired
    // ✅ We do NOT use 'unique = true' here, allowing one asset to have many repairs
    @ManyToOne
    @JoinColumn(name = "asset_id", nullable = false)
    @JsonIgnoreProperties({"repairRecords", "tickets", "branch"}) 
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Asset asset;

    // Link to the Ticket that caused this repair
    // ✅ CHANGED from @OneToOne to @ManyToOne
    // This allows one Ticket to generate multiple records (e.g. one for Estimate, one for Resolution)
    @ManyToOne
    @JoinColumn(name = "ticket_id")
    @JsonIgnoreProperties({"asset", "branch", "images", "comments", "assignedAdmin", "createdBy"}) 
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Ticket ticket;

    // "Replaced Hard Drive", "Software Update", "PLAN SUBMITTED", etc.
    @Column(nullable = false, length = 500)
    private String actionTaken; 

    private LocalDate repairDate;

    // ✅ Using BigDecimal for precise currency handling
    @Column(precision = 18, scale = 2)
    private BigDecimal cost = BigDecimal.ZERO; 
}