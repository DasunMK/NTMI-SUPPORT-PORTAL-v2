package com.ntmi.support.controller;

import com.ntmi.support.dto.TicketDTO;
import com.ntmi.support.model.Ticket;
import com.ntmi.support.model.TicketStatus;
import com.ntmi.support.model.User;
import com.ntmi.support.repository.UserRepository;
import com.ntmi.support.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private UserRepository userRepository;

    // --- SHARED ACTIONS ---

    // 1. Create Ticket (Any logged-in user)
    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody TicketDTO dto, Authentication auth) {
        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ticketService.createTicket(dto, user.getUserId()));
    }

    // 2. Get My Branch Tickets (For Branch Users)
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<Ticket>> getBranchTickets(@PathVariable Long branchId) {
        return ResponseEntity.ok(ticketService.getTicketsByBranch(branchId));
    }

    // --- ADMIN ACTIONS (Protected) ---

    // 3. Get All Tickets (Admin Only)
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    // 4. Start/Assign Ticket (Admin Only)
    // This assigns the ticket to the admin who clicked "Start"
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/start")
    public ResponseEntity<Ticket> startTicket(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        return ResponseEntity.ok(ticketService.startTicket(id, admin.getUserId()));
    }


    // 7. Cancel Ticket (Branch User)
    // 7. Cancel Ticket (Safe Version)
    // 7. Cancel Ticket (Safe Response)
    // 7. Cancel Ticket (Debug Version)
    // 7. Cancel Ticket (DEBUG VERSION)
    // 7. Cancel Ticket (DEBUG VERSION)
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelTicket(@PathVariable Long id, Authentication auth) {
        try {
            String username = auth.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Call the service
            ticketService.cancelTicket(id, user.getUserId());
            
            // Return simple success message (Prevents JSON Loops)
            return ResponseEntity.ok().body("{\"message\": \"Ticket cancelled successfully\"}");
            
        } catch (Exception e) {
            // 🚨 THIS IS THE FIX: Print the error and send it to the browser!
            System.err.println("❌ BACKEND CRASH: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("SERVER ERROR: " + e.getMessage());
        }
    }
    // 5. Close/Resolve Ticket (Admin Only)
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/close")
    public ResponseEntity<Ticket> closeTicket(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        return ResponseEntity.ok(ticketService.closeTicket(id, admin.getUserId()));
    }
    
    // 6. Generic Status Update (Optional backup)
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(@PathVariable Long id, @RequestParam TicketStatus status) {
        return ResponseEntity.ok(ticketService.updateStatus(id, status));
    }
}