package com.ntmi.support.controller;

import com.ntmi.support.dto.ReliabilityDTO;
import com.ntmi.support.dto.TicketDTO;
import com.ntmi.support.model.*;
import com.ntmi.support.repository.*;
import com.ntmi.support.service.AssetService;
import com.ntmi.support.service.NotificationService;
import com.ntmi.support.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {

    @Autowired private TicketService ticketService;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private AssetService assetService; // ✅ Added to fetch Failure Stats

    @Autowired private TicketRepository ticketRepository;
    @Autowired private AssetRepository assetRepository;
    @Autowired private ErrorCategoryRepository categoryRepository;
    @Autowired private ErrorTypeRepository typeRepository;
    @Autowired private RepairRecordRepository repairRecordRepository;
    
    // ✅ Inject TicketImageRepository
    @Autowired private TicketImageRepository ticketImageRepository; 

    // --- SHARED ACTIONS ---
    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody TicketDTO dto, Authentication auth) {
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

            // 1. Save Ticket
            Ticket savedTicket = ticketRepository.save(ticket);

            // 2. Save Images
            if (dto.getImages() != null && !dto.getImages().isEmpty()) {
                for (String base64Image : dto.getImages()) {
                    if (base64Image != null && !base64Image.isEmpty()) {
                        TicketImage image = new TicketImage();
                        image.setBase64Data(base64Image);
                        image.setTicket(savedTicket);
                        ticketImageRepository.save(image);
                    }
                }
            }

            // 3. Send Notification
            try {
                notificationService.notifyAllAdmins(
                    "New Ticket #" + savedTicket.getTicketId(),
                    "New issue raised by " + user.getFullName() + " (" + savedTicket.getBranch().getBranchName() + ")",
                    "INFO"
                );
            } catch (Exception e) { System.err.println("⚠️ Notification Error: " + e.getMessage()); }

            return ResponseEntity.ok(savedTicket);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // --- PROFILE ACTIONS ---
    @GetMapping("/created-by/{userId}")
    public List<Ticket> getTicketsByCreator(@PathVariable Long userId) {
        return ticketRepository.findByCreatedBy_UserIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/assigned-to/{adminId}")
    public List<Ticket> getTicketsByAssignee(@PathVariable Long adminId) {
        return ticketRepository.findByAssignedAdmin_UserIdOrderByCreatedAtDesc(adminId);
    }

    // --- GET RELIABILITY STATS (UPDATED) ---
    @GetMapping("/reliability")
    public ResponseEntity<Map<String, Object>> getReliabilityStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. Past Due Tickets (Older than 48 hours)
        LocalDateTime twoDaysAgo = LocalDateTime.now().minusHours(48);
        long pastDueCount = ticketRepository.countPastDueTickets(twoDaysAgo);
        stats.put("pastDueTickets", pastDueCount);

        // 2. Total Resolved Tickets
        stats.put("totalResolved", ticketRepository.findAllResolvedTickets().size());

        // 3. Total Repair Cost
        Double totalCost = repairRecordRepository.sumTotalCost();
        stats.put("totalRepairCost", totalCost != null ? totalCost : 0.0);

        // 4. Avg Resolution Time (Hours)
        // Requires SQL Server Native Query in Repository
        Double avgTime = ticketRepository.getAverageResolutionTime();
        stats.put("avgResolutionHours", avgTime != null ? Math.round(avgTime * 10.0) / 10.0 : 0.0);

        // 5. Asset Availability (%)
        // Requires SQL Server Native Query in Repository
        Double availability = ticketRepository.calculateAssetAvailability();
        stats.put("assetAvailability", availability != null ? Math.round(availability) : 100);

        // 6. Top Failing Assets (Using AssetService)
        List<ReliabilityDTO> reliabilityStats = assetService.getReliabilityStats();
        
        // Map DTO to structure expected by Frontend (brand, model, count)
        List<Map<String, Object>> assetFailures = reliabilityStats.stream().limit(5).map(dto -> {
            Map<String, Object> map = new HashMap<>();
            map.put("brand", "N/A"); // DTO focuses on modelName
            map.put("model", dto.getModelName());
            map.put("count", dto.getTotalFailures());
            return map;
        }).collect(Collectors.toList());
        
        stats.put("topFailingAssets", assetFailures);

        return ResponseEntity.ok(stats);
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

        notificationService.send(ticket.getCreatedBy(), "Ticket In Progress", "Your ticket #" + id + " is being processed by " + admin.getFullName(), "INFO");

        return ResponseEntity.ok(ticket);
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/close")
    public ResponseEntity<?> closeTicket(@PathVariable Long id, @RequestBody Map<String, Object> payload, Authentication auth) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        String resolutionDetails = (String) payload.get("resolution");
        boolean isDisposeRequest = "true".equals(payload.get("disposeAsset").toString());

        BigDecimal cost = BigDecimal.ZERO;
        if (payload.containsKey("cost") && payload.get("cost") != null) {
            try {
                cost = new BigDecimal(payload.get("cost").toString());
            } catch (Exception e) {
                System.err.println("Invalid cost format: " + e.getMessage());
            }
        }

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

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

        notificationService.send(ticket.getCreatedBy(), "Ticket Resolved", "Your ticket #" + id + " has been resolved.", "SUCCESS");

        return ResponseEntity.ok(ticket);
    }

    private void createRepairRecord(Asset asset, Ticket ticket, String action, BigDecimal cost) {
        if (action != null && !action.isEmpty()) {
            RepairRecord record = new RepairRecord();
            record.setAsset(asset);
            record.setTicket(ticket);
            record.setActionTaken(action);
            record.setRepairDate(LocalDate.now());
            record.setCost(cost);
            repairRecordRepository.save(record);
        }
    }
}