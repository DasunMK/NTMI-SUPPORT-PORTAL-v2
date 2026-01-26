package com.ntmi.support.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long commentId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Who wrote the comment?
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    // ✅ Don't show sensitive user info in the comment author object
    @JsonIgnoreProperties({"password", "roles", "authorities", "branch", "tickets"}) 
    private User author;

    // Which ticket is this for?
    @ManyToOne
    @JoinColumn(name = "ticket_id", nullable = false)
    // ✅ Stop infinite loop: Ticket -> Comments -> Ticket
    @JsonIgnoreProperties({"comments", "branch", "asset", "createdBy", "assignedAdmin"}) 
    private Ticket ticket;
}