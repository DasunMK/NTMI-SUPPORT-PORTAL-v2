package com.ntmi.support.controller;

import com.ntmi.support.dto.TicketDTO;
import com.ntmi.support.model.*;
import com.ntmi.support.repository.*;
import com.ntmi.support.service.NotificationService;
import com.ntmi.support.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal; // ✅ Import BigDecimal
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    @Autowired private TicketService ticketService;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService;
    
    @Autowired private TicketRepository ticketRepository;
    @Autowired private AssetRepository assetRepository;
    @Autowired private ErrorCategoryRepository categoryRepository;
    @Autowired private ErrorTypeRepository typeRepository;
    @Autowired private RepairRecordRepository repairRecordRepository;

    // --- SHARED ACTIONS (Unchanged) ---
    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody TicketDTO dto, Authentication auth) {
        // ... (existing code remains the same)
        try {
            String username = auth.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Ticket ticket = new Ticket();
            ticket.setTicketCode("TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            ticket.setDescription(dto.getDescription());
            ticket.setPriority(dto.getPriority());
            ticket.setStatus(TicketStatus.OPEN);
            ticket.setCreatedAt(LocalDateTime.now());
            ticket.setCreatedBy(user);

            ErrorCategory category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            ErrorType type = typeRepository.findById(dto.getTypeId())
                    .orElseThrow(() -> new RuntimeException("Error Type not found"));
            
            ticket.setErrorCategory(category);
            ticket.setErrorType(type);
            ticket.setSubject(category.getCategoryName() + " - " + type.getTypeName());

            if (dto.getAssetId() != null) {
                Asset asset = assetRepository.findById(dto.getAssetId())
                        .orElseThrow(() -> new RuntimeException("Asset not found"));
                ticket.setAsset(asset);
                ticket.setBranch(asset.getBranch());
            } else {
                ticket.setAsset(null);
                ticket.setBranch(user.getBranch());
            }

            Ticket savedTicket = ticketRepository.save(ticket);

            try {
                notificationService.notifyAllAdmins(
                    "New Ticket #" + savedTicket.getTicketId(),
                    "New issue raised by " + user.getFullName() + " (" + savedTicket.getBranch().getBranchName() + ")",
                    "INFO"
                );
            } catch (Exception e) { System.err.println("⚠️ Notification Error: " + e.getMessage()); }

            return ResponseEntity.ok(savedTicket);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<Ticket>> getBranchTickets(@PathVariable Long branchId) {
        return ResponseEntity.ok(ticketService.getTicketsByBranch(branchId));
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/start")
    public ResponseEntity<?> startTicket(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setAssignedAdmin(admin);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticketRepository.save(ticket);

        if (ticket.getAsset() != null) {
            Asset asset = ticket.getAsset();
            asset.setStatus("REPAIR");
            assetRepository.save(asset);
        }

        return ResponseEntity.ok(ticket);
    }

    // ✅ 5. UPDATED Close/Resolve Ticket to handle Cost
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/close")
    public ResponseEntity<?> closeTicket(@PathVariable Long id, @RequestBody Map<String, Object> payload, Authentication auth) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        String resolutionDetails = (String) payload.get("resolution");
        boolean isDisposeRequest = "true".equals(payload.get("disposeAsset").toString());

        // ✅ Extracting Cost safely
        BigDecimal cost = BigDecimal.ZERO;
        if (payload.containsKey("cost") && payload.get("cost") != null) {
            try {
                cost = new BigDecimal(payload.get("cost").toString());
            } catch (Exception e) {
                System.err.println("Invalid cost format: " + e.getMessage());
            }
        }

        // 1. Close Ticket
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        // 2. Handle Asset Logic
        if (ticket.getAsset() != null) {
            Asset asset = ticket.getAsset();

            if (isDisposeRequest) {
                asset.setStatus("DISPOSED");
                assetRepository.save(asset);
                createRepairRecord(asset, ticket, "ASSET DISPOSED: " + resolutionDetails, cost);
            } else {
                asset.setStatus("ACTIVE");
                asset.setRepairCount(asset.getRepairCount() + 1);
                assetRepository.save(asset);
                createRepairRecord(asset, ticket, resolutionDetails, cost);
            }
        }

        return ResponseEntity.ok(ticket);
    }

    // ✅ Helper method updated to accept BigDecimal cost
    private void createRepairRecord(Asset asset, Ticket ticket, String action, BigDecimal cost) {
        if (action != null && !action.isEmpty()) {
            RepairRecord record = new RepairRecord();
            record.setAsset(asset);
            record.setTicket(ticket);
            record.setActionTaken(action);
            record.setRepairDate(LocalDate.now());
            record.setCost(cost); // ✅ Save the cost to DB
            repairRecordRepository.save(record);
        }
    }
}