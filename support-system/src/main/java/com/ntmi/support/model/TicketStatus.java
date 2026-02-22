package com.ntmi.support.model;

public enum TicketStatus {
    // Step 1: Created by Branch User
    OPEN,

    // Step 2: Admin Accepted & Estimated (Waiting for Approvals)
    PENDING_SUPER_ADMIN, // Technical Approval required
    PENDING_FINANCE,     // Financial Approval required

    // Step 3 & 4: Approved by Management
    APPROVED_FOR_REPAIR, // ✅ Ready for Admin to start physical work
    REJECTED,            // Denied by management

    // Step 5: Admin Working & Resolving
    IN_PROGRESS,         // Admin actively fixing the asset
    RESOLVED,            // Work done, final cost recorded
    
    // Final States
    CLOSED,              // Verified by Branch User (optional)
    CANCELLED            // Cancelled before work started
}