package com.ntmi.support.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
//import java.util.List;

@Entity
@Data
@Table(name = "tickets")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketId;

    // A readable ID for humans (e.g., "TKT-1005")
    private String ticketCode;

    @Column(nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private TicketStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime closedAt;

    // --- Relationships ---

    // Who raised it? (Branch User)
    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    // Which Branch? (Auto-filled from User)
    @ManyToOne
    @JoinColumn(name = "branch_id")
    private Branch branch;

    // Which Error Category?
    @ManyToOne
    @JoinColumn(name = "category_id")
    private ErrorCategory errorCategory;

    // Which Error Type?
    @ManyToOne
    @JoinColumn(name = "type_id")
    private ErrorType errorType;

    // --- Admin Side ---

    // Who is fixing it? (The "Locking" mechanism)
    @ManyToOne
    @JoinColumn(name = "assigned_admin_id")
    private User assignedAdmin;
    
    // We will handle Images in a separate table below
}