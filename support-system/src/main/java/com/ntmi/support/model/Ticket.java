package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketId;

    private String ticketCode; // e.g. "TKT-1001"
    private String subject;
    
    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    private TicketStatus status;

    @Enumerated(EnumType.STRING)
    private TicketPriority priority;

    // ⚠️ FIX 1: Prevent Infinite Loop on 'Created By'
    // We want the User's name, but NOT their password or list of roles/tickets
    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    @JsonIgnoreProperties({"password", "roles", "branch", "tickets"}) 
    private User createdBy;

    // ⚠️ FIX 2: Prevent Infinite Loop on 'Assigned Admin'
    @ManyToOne
    @JoinColumn(name = "assigned_admin_id")
    @JsonIgnoreProperties({"password", "roles", "branch", "tickets"})
    private User assignedAdmin;

    // ⚠️ FIX 3: Prevent Infinite Loop on 'Branch'
    @ManyToOne
    @JoinColumn(name = "branch_id")
    @JsonIgnoreProperties({"users", "tickets"}) 
    private Branch branch;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private ErrorCategory errorCategory;

    @ManyToOne
    @JoinColumn(name = "type_id")
    private ErrorType errorType;

    private LocalDateTime createdAt;
    private LocalDateTime closedAt;
}