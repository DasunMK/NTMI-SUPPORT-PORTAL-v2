package com.ntmi.support.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ntmi.support.model.Ticket;
import com.ntmi.support.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    // We need Jackson to convert the String JSON to a Ticket object manually
    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createTicket(
            @RequestPart("ticket") String ticketJson,  // The JSON data as a String
            @RequestPart(value = "images", required = false) List<MultipartFile> files, // The Images
            @RequestParam("userId") Long userId // The ID of the logged-in user
    ) {
        try {
            // Convert String JSON to Java Object
            Ticket ticket = objectMapper.readValue(ticketJson, Ticket.class);
            
            Ticket newTicket = ticketService.createTicket(ticket, userId, files);
            return ResponseEntity.ok(newTicket);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public List<Ticket> getAllTickets() {
        return ticketService.getAllTickets();
    }
}