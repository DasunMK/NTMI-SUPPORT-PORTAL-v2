package com.ntmi.support.controller;

import com.ntmi.support.model.Ticket;
import com.ntmi.support.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/tickets")
@CrossOrigin(origins = "*")
public class AdminTicketController {

    @Autowired
    private TicketService ticketService;

    // Admin starts (locks) the ticket
    // PUT http://localhost:8080/api/admin/tickets/1/start?adminId=1
    @PutMapping("/{ticketId}/start")
    public ResponseEntity<?> startTicket(
            @PathVariable Long ticketId, 
            @RequestParam Long adminId) {
        try {
            Ticket ticket = ticketService.startTicket(ticketId, adminId);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Admin completes the ticket
    // PUT http://localhost:8080/api/admin/tickets/1/complete?adminId=1
    @PutMapping("/{ticketId}/complete")
    public ResponseEntity<?> completeTicket(
            @PathVariable Long ticketId, 
            @RequestParam Long adminId) {
        try {
            Ticket ticket = ticketService.closeTicket(ticketId, adminId);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}