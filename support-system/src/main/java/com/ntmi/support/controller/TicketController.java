package com.ntmi.support.controller;

import com.ntmi.support.dto.TicketDTO;
import com.ntmi.support.model.*;
import com.ntmi.support.repository.*;
import com.ntmi.support.service.AssetService;
import com.ntmi.support.service.NotificationService;
import com.ntmi.support.service.TicketService;
import com.ntmi.support.dto.ReliabilityDTO;
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
    @Autowired private AssetService assetService;

    @Autowired private TicketRepository ticketRepository;
    @Autowired private AssetRepository assetRepository;
    @Autowired private ErrorCategoryRepository categoryRepository;
    @Autowired private ErrorTypeRepository typeRepository;
    @Autowired private RepairRecordRepository repairRecordRepository;
    @Autowired private TicketImageRepository ticketImageRepository;

    // --- STEP 1: BRANCH USER CREATES TICKET ---
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

            Ticket savedTicket = ticketRepository.save(ticket);

            // Handle Images
            if (dto.getImages() != null && !dto.getImages().isEmpty()) {
                for (String base64Image : dto.getImages()) {
                    if (base64Image != null && !base64Image.isEmpty()) {
                        try {
                            TicketImage image = new TicketImage();
                            image.setBase64Data(base64Image);
                            image.setTicket(savedTicket);
                            ticketImageRepository.save(image);
                        } catch (Exception e) {
                            System.err.println("Failed to save one of the images: " + e.getMessage());
                        }
                    }
                }
            }

            // Notify Admins (Safe Wrapper)
            try {
                if (savedTicket.getBranch() != null && user.getFullName() != null) {
                    notificationService.notifyAllAdmins(
                        "New Ticket #" + savedTicket.getTicketId(),
                        "New issue raised by " + user.getFullName() + " (" + savedTicket.getBranch().getBranchName() + ")",
                        "INFO"
                    );
                }
            } catch (Exception e) {
                System.err.println("⚠️ Notification Error: " + e.getMessage());
            }

            return ResponseEntity.ok(savedTicket);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // --- STEP 2: ADMIN ACCEPTS & ESTIMATES (Starts Approval Flow) ---
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/estimate")
    public ResponseEntity<?> submitEstimate(@PathVariable Long id, @RequestBody Map<String, Object> payload, Authentication auth) {
        Ticket ticket = ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket not found"));
        User admin = userRepository.findByUsername(auth.getName()).orElseThrow(() -> new RuntimeException("Admin not found"));

        // 1. Assign Admin
        ticket.setAssignedAdmin(admin);

        // 2. Capture Logic Fields
        String source = (String) payload.getOrDefault("repairSource", "EXTERNAL");
        String description = (String) payload.getOrDefault("repairDescription", "General Repair");

        // 3. Capture Cost
        BigDecimal estimatedCost = BigDecimal.ZERO;
        if (payload.containsKey("estimatedCost") && payload.get("estimatedCost") != null) {
            try {
                estimatedCost = new BigDecimal(payload.get("estimatedCost").toString());
            } catch (Exception e) {
                System.err.println("Invalid cost format");
            }
        }

        // Save Repair Plan Details
        ticket.setRepairSource(source);
        ticket.setRepairDescription(description);
        ticket.setEstimatedCost(estimatedCost);

        // Create Preliminary Record
        String logMsg = "PLAN SUBMITTED (" + source + "): " + description + " | Est: " + estimatedCost;
        if (ticket.getAsset() != null) {
            createRepairRecord(ticket.getAsset(), ticket, logMsg, estimatedCost);
        }

        // Trigger Approval Workflow
        ticket.setStatus(TicketStatus.PENDING_SUPER_ADMIN);
        ticketRepository.save(ticket);

        // Safe Notification
        try {
            notificationService.notifyRole(Role.SUPER_ADMIN, "Approval Required",
                "Ticket #" + id + " estimate submitted: Rs." + estimatedCost, "WARNING");
        } catch (Exception e) {
            System.err.println("⚠️ Notification failed: " + e.getMessage());
        }

        return ResponseEntity.ok(ticket);
    }

    // --- STEP 5a: ADMIN STARTS REPAIR (After Approval) ---
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/start-work")
    public ResponseEntity<?> startRepairWork(@PathVariable Long id) {
        Ticket ticket = ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getStatus() != TicketStatus.APPROVED_FOR_REPAIR) {
            return ResponseEntity.badRequest().body("Ticket is not approved for repair yet.");
        }

        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticketRepository.save(ticket);

        if (ticket.getAsset() != null) {
            Asset asset = ticket.getAsset();
            asset.setStatus("REPAIR");
            assetRepository.save(asset);
        }

        // Safe Notification
        try {
            if (ticket.getCreatedBy() != null) {
                notificationService.send(ticket.getCreatedBy(), "Repair Started", "Admin has started working on your ticket.", "INFO");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Notification failed: " + e.getMessage());
        }

        return ResponseEntity.ok(ticket);
    }

    // --- STEP 5b: ADMIN RESOLVES (Final Cost & Action) ---
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}/resolve-final")
    public ResponseEntity<?> resolveFinal(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Ticket ticket = ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket not found"));

            String resolution = (String) payload.get("resolution");
            // Prevent null resolution text
            if (resolution == null || resolution.trim().isEmpty()) {
                resolution = "No details provided";
            }

            boolean isDisposeRequest = "true".equals(String.valueOf(payload.get("disposeAsset")));
            String varianceReason = (String) payload.get("varianceReason");

            BigDecimal finalCost = BigDecimal.ZERO;
            if (payload.containsKey("finalCost") && payload.get("finalCost") != null) {
                try {
                    finalCost = new BigDecimal(payload.get("finalCost").toString());
                } catch (Exception e) {
                    System.err.println("Invalid cost format");
                }
            }

            // Finalize Ticket
            ticket.setStatus(TicketStatus.RESOLVED);
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setRepairCost(finalCost);
            ticket.setVarianceReason(varianceReason);
            ticketRepository.save(ticket);

            // Save Bill Image
            if (payload.containsKey("billImage") && payload.get("billImage") != null) {
                String base64Image = (String) payload.get("billImage");
                if (base64Image != null && !base64Image.isEmpty()) {
                    try {
                        TicketImage bill = new TicketImage();
                        bill.setBase64Data(base64Image);
                        bill.setTicket(ticket);
                        ticketImageRepository.save(bill);
                    } catch (Exception e) {
                        System.err.println("Failed to save bill image: " + e.getMessage());
                    }
                }
            }

            // Update Asset & Create Final Record
            if (ticket.getAsset() != null) {
                Asset asset = ticket.getAsset();
                if (isDisposeRequest) {
                    asset.setStatus("DISPOSED");
                    createRepairRecord(asset, ticket, "DISPOSED: " + resolution, finalCost);
                } else {
                    asset.setStatus("ACTIVE");
                    
                    // ✅ FIX: Handle Integer (Wrapper) safely to prevent NullPointerException
                    Integer currentCount = asset.getRepairCount();
                    if (currentCount == null) {
                        currentCount = 0;
                    }
                    asset.setRepairCount(currentCount + 1);
                    
                    createRepairRecord(asset, ticket, "RESOLVED: " + resolution, finalCost);
                }
                assetRepository.save(asset);
            }

            // Safe Notification
            try {
                if (ticket.getCreatedBy() != null) {
                    notificationService.send(ticket.getCreatedBy(), "Ticket Resolved", "Repair completed.", "SUCCESS");
                }
            } catch (Exception e) {
                System.err.println("⚠️ Notification failed for resolved ticket: " + e.getMessage());
            }

            return ResponseEntity.ok(ticket);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error resolving ticket: " + e.getMessage());
        }
    }

    // --- NEW: CANCEL TICKET ENDPOINT ---
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelTicket(@PathVariable Long id, Authentication auth) {
        try {
            String username = auth.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Ticket ticket = ticketRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Ticket not found"));

            // Security Check
            if (!ticket.getCreatedBy().getUserId().equals(user.getUserId())) {
                return ResponseEntity.status(403).body("Unauthorized: You can only cancel tickets you created.");
            }

            if (ticket.getStatus() == TicketStatus.IN_PROGRESS || ticket.getStatus() == TicketStatus.RESOLVED) {
                 return ResponseEntity.badRequest().body("Cannot cancel ticket that is already in progress or resolved.");
            }

            ticket.setStatus(TicketStatus.CANCELLED);
            ticket.setClosedAt(LocalDateTime.now());
            ticketRepository.save(ticket);

            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error cancelling ticket: " + e.getMessage());
        }
    }

    // --- OTHER GETTERS & HELPERS ---

    @PreAuthorize("hasAnyAuthority('ADMIN', 'SUPER_ADMIN', 'ACCOUNT_HEAD')")
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/created-by/{userId}")
    public List<Ticket> getTicketsByCreator(@PathVariable Long userId) {
        return ticketRepository.findByCreatedBy_UserIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/assigned-to/{adminId}")
    public List<Ticket> getTicketsByAssignee(@PathVariable Long adminId) {
        return ticketRepository.findByAssignedAdmin_UserIdOrderByCreatedAtDesc(adminId);
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<Ticket>> getBranchTickets(@PathVariable Long branchId) {
        return ResponseEntity.ok(ticketService.getTicketsByBranch(branchId));
    }

    @GetMapping("/reliability")
    public ResponseEntity<Map<String, Object>> getReliabilityStats() {
        Map<String, Object> stats = new HashMap<>();
        LocalDateTime twoDaysAgo = LocalDateTime.now().minusHours(48);
        stats.put("pastDueTickets", ticketRepository.countPastDueTickets(twoDaysAgo));
        stats.put("totalResolved", ticketRepository.findAllResolvedTickets().size());
        Double totalCost = repairRecordRepository.sumTotalCost();
        stats.put("totalRepairCost", totalCost != null ? totalCost : 0.0);
        Double avgTime = ticketRepository.getAverageResolutionTime();
        stats.put("avgResolutionHours", avgTime != null ? Math.round(avgTime * 10.0) / 10.0 : 0.0);
        Double availability = ticketRepository.calculateAssetAvailability();
        stats.put("assetAvailability", availability != null ? Math.round(availability) : 100);
        List<ReliabilityDTO> reliabilityStats = assetService.getReliabilityStats();
        List<Map<String, Object>> assetFailures = reliabilityStats.stream().limit(5).map(dto -> {
            Map<String, Object> map = new HashMap<>();
            map.put("brand", "N/A");
            map.put("model", dto.getModelName());
            map.put("count", dto.getTotalFailures());
            return map;
        }).collect(Collectors.toList());
        stats.put("topFailingAssets", assetFailures);
        return ResponseEntity.ok(stats);
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