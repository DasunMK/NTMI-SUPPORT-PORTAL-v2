package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference; // Import this
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString; // Import this
import lombok.EqualsAndHashCode; // Import this

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

    private String ticketCode;
    private String subject;
    
    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private TicketStatus status;

    @Enumerated(EnumType.STRING)
    private TicketPriority priority;

    // --- Relationships ---

    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    @JsonIgnoreProperties({"password", "roles", "branch", "tickets"}) 
    @ToString.Exclude // 🛑 Stop Lombok Loop
    @EqualsAndHashCode.Exclude // 🛑 Stop Lombok Loop
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "assigned_admin_id")
    @JsonIgnoreProperties({"password", "roles", "branch", "tickets"})
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User assignedAdmin;

    @ManyToOne
    @JoinColumn(name = "branch_id")
    @JsonIgnoreProperties({"users", "tickets"}) 
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Branch branch;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private ErrorCategory errorCategory;

    @ManyToOne
    @JoinColumn(name = "type_id")
    private ErrorType errorType;

    // ✅ FIX: Use JsonManagedReference to handle the parent side of the relationship
    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference 
    @ToString.Exclude // 🛑 Critical: Prevents toString() infinite loop
    @EqualsAndHashCode.Exclude
    private List<TicketImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore // Don't load comments automatically to keep it fast
    private java.util.List<Comment> comments;

    private LocalDateTime createdAt;
    private LocalDateTime closedAt;
}