package com.ntmi.support.controller;

import com.ntmi.support.dto.CommentDTO;
import com.ntmi.support.model.Comment;
import com.ntmi.support.model.Ticket;
import com.ntmi.support.model.User;
import com.ntmi.support.repository.UserRepository;
import com.ntmi.support.service.CommentService;
import com.ntmi.support.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin("*")
public class CommentController {

    private static final Logger logger = LoggerFactory.getLogger(CommentController.class);

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
            
            // Create a short preview of the message (max 50 chars)
            String messagePreview = comment.getText().length() > 50 
                ? comment.getText().substring(0, 47) + "..." 
                : comment.getText();
            
            String title = "New Reply on Ticket #" + ticket.getTicketId();
            String message = sender.getFullName() + ": " + messagePreview;

            // Logic: Who sent it?
            // Check if Sender is the Ticket Creator (Branch User)
            boolean isCreator = sender.getUserId().equals(ticket.getCreatedBy().getUserId());

            if (isCreator) {
                // CASE 1: Branch User sent a message -> Notify Admin
                if (ticket.getAssignedAdmin() != null) {
                    // Notify specific assigned admin
                    notificationService.sendPrivateNotification(
                        ticket.getAssignedAdmin().getUsername(), 
                        title, 
                        message
                    );
                } else {
                    // Ticket not assigned yet? Notify ALL admins
                    notificationService.notifyAllAdmins(title, message);
                }
            } else {
                // CASE 2: Admin sent a message -> Notify Branch User (Creator)
                notificationService.sendPrivateNotification(
                    ticket.getCreatedBy().getUsername(), 
                    title, 
                    message
                );
            }
        } catch (Exception e) {
            // Log error but don't fail the comment request
            logger.error("Failed to send notification for Ticket #{}", comment.getTicket().getTicketId(), e);
        }
    }
}