package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets")
@Data
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketId;

    @Column(unique = true, nullable = false)
    private String ticketCode; 

    private String subject;
    
    @Column(columnDefinition = "TEXT") 
    private String description;

    @Enumerated(EnumType.STRING)
    private TicketStatus status;

    @Enumerated(EnumType.STRING)
    private TicketPriority priority;

    // --- Timestamps ---
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt; // ✅ Required for Analytics
    private LocalDateTime closedAt;

    // --- Relationships ---

    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    @JsonIgnoreProperties({"password", "roles", "branch", "tickets"}) 
    @ToString.Exclude 
    @EqualsAndHashCode.Exclude 
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "assigned_admin_id")
    @JsonIgnoreProperties({"password", "roles", "branch", "tickets"})
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User assignedAdmin;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    @JsonIgnoreProperties({"users", "tickets", "assets"}) 
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Branch branch;

    @ManyToOne
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties("tickets")
    private ErrorCategory errorCategory;

    @ManyToOne
    @JoinColumn(name = "type_id")
    @JsonIgnoreProperties("tickets")
    private ErrorType errorType;

    // ✅ Asset is OPTIONAL
    @ManyToOne
    @JoinColumn(name = "asset_id", nullable = true)
    @JsonIgnoreProperties({"branch", "tickets", "repairRecords"}) 
    @ToString.Exclude
    private Asset asset;

    // ✅ Images
    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference 
    @ToString.Exclude 
    @EqualsAndHashCode.Exclude
    private List<TicketImage> images = new ArrayList<>();

    // ✅ Comments
    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("ticket") 
    private List<Comment> comments;

    // --- Automation ---
    
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    
    private Double repairCost;
}