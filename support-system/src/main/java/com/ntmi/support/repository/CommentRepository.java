package com.ntmi.support.repository;

import com.ntmi.support.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Fetch comments for a specific ticket, sorted like a chat (Oldest first)
    List<Comment> findByTicket_TicketIdOrderByCreatedAtAsc(Long ticketId);
}