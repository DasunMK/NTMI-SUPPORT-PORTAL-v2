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

    // ✅ REMOVED: NotificationService dependency is no longer needed here.
    // It is now handled exclusively in the Controller layer.

    // 1. Add Comment (Pure Data Logic Only)
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

        // ✅ Save and return immediately. 
        // No notification logic here (prevents double emails/popups).
        return commentRepository.save(comment);
    }

    // 2. Get Comments for a Ticket
    public List<Comment> getCommentsByTicket(Long ticketId) {
        return commentRepository.findByTicket_TicketIdOrderByCreatedAtAsc(ticketId);
    }
}