package com.ntmi.support.service;

import com.ntmi.support.dto.TicketDTO;
import com.ntmi.support.model.*;
import com.ntmi.support.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TicketService {

    @Autowired private TicketRepository ticketRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ErrorCategoryRepository categoryRepository;
    @Autowired private ErrorTypeRepository typeRepository;
    @Autowired private TicketImageRepository ticketImageRepository;
    @Autowired private AssetRepository assetRepository;

    @Transactional
    public Ticket createTicket(TicketDTO dto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Ticket ticket = new Ticket();
        
        // 1. Handle Categories & Auto-Subject
        ErrorCategory cat = null;
        ErrorType type = null;

        if (dto.getCategoryId() != null) {
            cat = categoryRepository.findById(dto.getCategoryId()).orElse(null);
            ticket.setErrorCategory(cat);
        }
        if (dto.getTypeId() != null) {
            type = typeRepository.findById(dto.getTypeId()).orElse(null);
            ticket.setErrorType(type);
        }

        // Auto-Generate Subject
        String autoSubject = "Support Request";
        if (cat != null && type != null) {
            autoSubject = cat.getCategoryName() + " - " + type.getTypeName();
        } else if (cat != null) {
            autoSubject = cat.getCategoryName() + " Issue";
        }
        ticket.setSubject(autoSubject);

        // 2. Set Basic Fields (Description is Optional)
        ticket.setDescription(dto.getDescription()); 
        ticket.setPriority(dto.getPriority());
        ticket.setCreatedBy(user);
        ticket.setBranch(user.getBranch()); 
        ticket.setStatus(TicketStatus.OPEN); 
        ticket.setCreatedAt(LocalDateTime.now()); 

        // 3. Save Ticket First (to get ID)
        Ticket savedTicket = ticketRepository.save(ticket);
        savedTicket.setTicketCode("TKT-" + savedTicket.getTicketId());

        // 4. Handle Images (Optional, Max 5)
        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            List<String> rawImages = dto.getImages();
            // Limit to first 5 just in case
            int limit = Math.min(rawImages.size(), 5);
            
            for (int i = 0; i < limit; i++) {
                String base64 = rawImages.get(i);
                if (base64 != null && !base64.isEmpty()) {
                    TicketImage img = new TicketImage();
                    img.setBase64Data(base64);
                    img.setTicket(savedTicket);
                    ticketImageRepository.save(img); // Save individually
                }
            }
        }

        if (dto.getAssetId() != null) {
        Asset asset = assetRepository.findById(dto.getAssetId())
                      .orElseThrow(() -> new RuntimeException("Asset not found"));
        ticket.setAsset(asset);
    }


        return ticketRepository.save(savedTicket);
    }

    // ... (Keep existing methods: cancelTicket, getAllTickets, etc.) ...
    public List<Ticket> getAllTickets() { return ticketRepository.findAll(); }
    
    public List<Ticket> getTicketsByBranch(Long branchId) {
        return ticketRepository.findByBranch_BranchIdAndStatusNot(branchId, TicketStatus.CANCELLED);
    }

    public Ticket startTicket(Long ticketId, Long adminId) {
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow();
        User admin = userRepository.findById(adminId).orElseThrow();
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setAssignedAdmin(admin);
        return ticketRepository.save(ticket);
    }

    public Ticket closeTicket(Long ticketId, Long adminId) {
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow();
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setClosedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }
    
    public Ticket cancelTicket(Long ticketId, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow();
        if(!ticket.getCreatedBy().getUserId().equals(userId)) throw new RuntimeException("Unauthorized");
        ticket.setStatus(TicketStatus.CANCELLED);
        ticket.setClosedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }
    
    public Ticket updateStatus(Long ticketId, TicketStatus status) {
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow();
        ticket.setStatus(status);
        if(status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) ticket.setClosedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }
}