package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonFormat; // ✅ Import this
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String message;

    // Types: INFO, SUCCESS, WARNING, SECURITY
    private String type; 

    private boolean isRead = false;

    // ✅ FIX: This format makes the date readable by JavaScript/React
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Link notification to a specific user (Admin or Branch User)
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User recipient; 
}