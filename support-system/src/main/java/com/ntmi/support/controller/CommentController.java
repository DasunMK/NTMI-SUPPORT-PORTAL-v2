package com.ntmi.support.controller;

import com.ntmi.support.dto.CommentDTO;
import com.ntmi.support.model.Comment;
import com.ntmi.support.model.Ticket;
import com.ntmi.support.model.User;
import com.ntmi.support.repository.UserRepository;
import com.ntmi.support.service.CommentService;
import com.ntmi.support.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin("*")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService; // ✅ Inject Notification Service

    // 1. Add Comment
    @PostMapping
    public ResponseEntity<Comment> addComment(@RequestBody CommentDTO dto, Authentication auth) {
        String username = auth.getName();
        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Save the comment via Service
        Comment savedComment = commentService.addComment(dto, sender.getUserId());
        
        // 2. Trigger Notification
        triggerCommentNotification(savedComment, sender);

        return ResponseEntity.ok(savedComment);
    }

    // 2. Get Comments by Ticket ID
    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long ticketId) {
        return ResponseEntity.ok(commentService.getCommentsByTicket(ticketId));
    }

    // --- Helper for Notifications ---
    private void triggerCommentNotification(Comment comment, User sender) {
        try {
            Ticket ticket = comment.getTicket();
            String messagePreview = comment.getText().length() > 50 
                ? comment.getText().substring(0, 47) + "..." 
                : comment.getText();
            
            String title = "New Reply on Ticket #" + ticket.getTicketId();
            String message = sender.getFullName() + ": " + messagePreview;

            // Logic: Who sent it?
            if (sender.getUserId().equals(ticket.getCreatedBy().getUserId())) {
                // SENDER IS BRANCH USER -> Notify Admin
                if (ticket.getAssignedAdmin() != null) {
                    // Notify specific assigned admin
                    notificationService.send(ticket.getAssignedAdmin(), title, message, "INFO");
                } else {
                    // Ticket not assigned yet? Notify ALL admins
                    notificationService.notifyAllAdmins(title, message, "INFO");
                }
            } else {
                // SENDER IS ADMIN -> Notify Branch User (Creator)
                notificationService.send(ticket.getCreatedBy(), title, message, "INFO");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send comment notification: " + e.getMessage());
        }
    }
}