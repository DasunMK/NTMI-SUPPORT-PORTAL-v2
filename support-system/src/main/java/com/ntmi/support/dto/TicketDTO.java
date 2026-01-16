package com.ntmi.support.dto;

import com.ntmi.support.model.TicketPriority;
import com.ntmi.support.model.TicketStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TicketDTO {
    private Long ticketId;
    private String subject;
    private String description;
    private TicketStatus status;
    private TicketPriority priority;
    
    // IDs for linking (Frontend sends these)
    private Long categoryId;
    private Long typeId;
    
    // Read-only fields (Backend sends these back)
    private String categoryName;
    private String typeName;
    private String branchName;
    private String createdBy;
    private LocalDateTime createdAt;
}