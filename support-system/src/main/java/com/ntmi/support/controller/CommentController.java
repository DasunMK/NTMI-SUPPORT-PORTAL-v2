package com.ntmi.support.controller;

import com.ntmi.support.dto.CommentDTO;
import com.ntmi.support.model.Comment;
import com.ntmi.support.model.User;
import com.ntmi.support.repository.UserRepository;
import com.ntmi.support.service.CommentService;
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

    // 1. Add Comment
    @PostMapping
    public ResponseEntity<Comment> addComment(@RequestBody CommentDTO dto, Authentication auth) {
        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(commentService.addComment(dto, user.getUserId()));
    }

    // 2. Get Comments by Ticket ID
    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long ticketId) {
        return ResponseEntity.ok(commentService.getCommentsByTicket(ticketId));
    }
}