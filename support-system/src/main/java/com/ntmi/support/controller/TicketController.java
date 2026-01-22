package com.ntmi.support.controller;

import com.ntmi.support.dto.TicketDTO;
import com.ntmi.support.model.Ticket;
import com.ntmi.support.model.TicketStatus;
import com.ntmi.support.model.User;
import com.ntmi.support.repository.UserRepository;
import com.ntmi.support.service.NotificationService;
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

    @Autowired
    private NotificationService notificationService;

    // --- SHARED ACTIONS ---

    // 1. Create Ticket (Any logged-in user)
    @PostMapping
    public ResponseEntity<Ticket> createTicket(@RequestBody TicketDTO dto, Authentication auth) {
        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // 1. CRITICAL: Save to Database
        Ticket createdTicket = ticketService.createTicket(dto, user.getUserId());

        // 2. NON-CRITICAL: Send Notifications (Safe Mode)
        try {
            // Alert All Admins
            notificationService.notifyAllAdmins(
                "New Ticket #" + createdTicket.getTicketId(),
                "New issue raised by " + user.getFullName() + " (" + (createdTicket.getBranch() != null ? createdTicket.getBranch().getBranchName() : "Unknown Branch") + ")",
                "INFO"
            );

            // Confirm to User
            notificationService.send(
                user,
                "Ticket Created",
                "Your ticket #" + createdTicket.getTicketId() + " has been successfully created.",
                "SUCCESS"
            );
        } catch (Exception e) {
            // Log the error, but DO NOT stop the request
            System.err.println("⚠️ Notification Error: " + e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.ok(createdTicket);
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
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/start")
    public ResponseEntity<Ticket> startTicket(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        Ticket updatedTicket = ticketService.startTicket(id, admin.getUserId());

        try {
            notificationService.send(
                updatedTicket.getCreatedBy(),
                "Ticket In Progress",
                "Admin " + admin.getFullName() + " has started working on ticket #" + id,
                "INFO"
            );
        } catch (Exception e) {
            System.err.println("⚠️ Notification Error: " + e.getMessage());
        }

        return ResponseEntity.ok(updatedTicket);
    }

    // 5. Close/Resolve Ticket (Admin Only)
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/close")
    public ResponseEntity<Ticket> closeTicket(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        Ticket closedTicket = ticketService.closeTicket(id, admin.getUserId());

        try {
            notificationService.send(
                closedTicket.getCreatedBy(),
                "Ticket Resolved",
                "Your ticket #" + id + " has been marked as resolved. Please verify.",
                "SUCCESS"
            );
        } catch (Exception e) {
            System.err.println("⚠️ Notification Error: " + e.getMessage());
        }

        return ResponseEntity.ok(closedTicket);
    }
    
    // 6. Generic Status Update
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(@PathVariable Long id, @RequestParam TicketStatus status) {
        return ResponseEntity.ok(ticketService.updateStatus(id, status));
    }

    // 7. Cancel Ticket (Branch User)
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelTicket(@PathVariable Long id, Authentication auth) {
        try {
            String username = auth.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            ticketService.cancelTicket(id, user.getUserId());
            
            return ResponseEntity.ok().body("{\"message\": \"Ticket cancelled successfully\"}");
            
        } catch (Exception e) {
            System.err.println("❌ BACKEND CRASH: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("SERVER ERROR: " + e.getMessage());
        }
    }
}