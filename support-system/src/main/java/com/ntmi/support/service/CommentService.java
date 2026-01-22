package com.ntmi.support.service;

import com.ntmi.support.dto.CommentDTO;
import com.ntmi.support.model.Comment;
import com.ntmi.support.model.Ticket;
import com.ntmi.support.model.User;
import com.ntmi.support.repository.CommentRepository;
import com.ntmi.support.repository.TicketRepository;
import com.ntmi.support.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService; // To notify updates

    // 1. Add Comment
    public Comment addComment(CommentDTO dto, Long userId) {
        Ticket ticket = ticketRepository.findById(dto.getTicketId())
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = new Comment();
        comment.setText(dto.getText());
        comment.setTicket(ticket);
        comment.setAuthor(author);
        comment.setCreatedAt(LocalDateTime.now());

        Comment savedComment = commentRepository.save(comment);

        // --- OPTIONAL: NOTIFY THE OTHER PARTY ---
        // If Admin comments -> Notify Ticket Creator
        // If Ticket Creator comments -> Notify Assigned Admin
        User notificationTarget = null;
        if (author.getUserId().equals(ticket.getCreatedBy().getUserId())) {
            // It's the creator, notify admin (if assigned)
            notificationTarget = ticket.getAssignedAdmin();
        } else {
            // It's an admin, notify creator
            notificationTarget = ticket.getCreatedBy();
        }

        if (notificationTarget != null) {
            notificationService.send(
                notificationTarget,
                "New Comment on Ticket #" + ticket.getTicketId(),
                author.getFullName() + ": " + dto.getText(),
                "INFO"
            );
        }

        return savedComment;
    }

    // 2. Get Comments for a Ticket
    public List<Comment> getCommentsByTicket(Long ticketId) {
        return commentRepository.findByTicket_TicketIdOrderByCreatedAtAsc(ticketId);
    }
}