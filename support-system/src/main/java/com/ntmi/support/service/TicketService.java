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

    // 1. Create Ticket
    @Transactional
    public Ticket createTicket(TicketDTO dto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Ticket ticket = new Ticket();
        ticket.setSubject(dto.getSubject());
        ticket.setDescription(dto.getDescription());
        ticket.setPriority(dto.getPriority());
        ticket.setCreatedBy(user);
        ticket.setBranch(user.getBranch()); 
        ticket.setStatus(TicketStatus.OPEN); 
        ticket.setCreatedAt(LocalDateTime.now()); 

        if (dto.getCategoryId() != null) {
            ErrorCategory cat = categoryRepository.findById(dto.getCategoryId()).orElse(null);
            ticket.setErrorCategory(cat);
        }
        if (dto.getTypeId() != null) {
            ErrorType type = typeRepository.findById(dto.getTypeId()).orElse(null);
            ticket.setErrorType(type);
        }

        Ticket savedTicket = ticketRepository.save(ticket);
        savedTicket.setTicketCode("TKT-" + savedTicket.getTicketId());
        return ticketRepository.save(savedTicket);
    }

    // 2. Cancel Ticket (Branch User)
    public Ticket cancelTicket(Long ticketId, Long userId) {
        System.out.println("Processing Cancel Request | Ticket: " + ticketId + " | User: " + userId);

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getCreatedBy() == null) throw new RuntimeException("Data Error: Ticket has no owner.");

        if (!ticket.getCreatedBy().getUserId().equals(userId)) {
            throw new RuntimeException("You do not have permission to cancel this ticket.");
        }

        if (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED) {
            throw new RuntimeException("Cannot cancel a completed ticket.");
        }

        ticket.setStatus(TicketStatus.CANCELLED);
        ticket.setClosedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    // 3. Get All Tickets
    public List<Ticket> getAllTickets() { return ticketRepository.findAll(); }
    
    // 4. Get Tickets by Branch
    public List<Ticket> getTicketsByBranch(Long branchId) {
        return ticketRepository.findByBranch_BranchIdAndStatusNot(branchId, TicketStatus.CANCELLED);
    }

    // 5. Start Ticket (Admin)
    public Ticket startTicket(Long ticketId, Long adminId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        if (ticket.getStatus() != TicketStatus.OPEN) throw new RuntimeException("Ticket is busy/closed");
        
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setAssignedAdmin(admin);
        return ticketRepository.save(ticket);
    }

    // 6. Close Ticket (Admin)
    public Ticket closeTicket(Long ticketId, Long adminId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setClosedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    // 7. Generic Update Status (The missing method!)
    public Ticket updateStatus(Long ticketId, TicketStatus newStatus) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        
        ticket.setStatus(newStatus);
        
        if (newStatus == TicketStatus.CLOSED || newStatus == TicketStatus.RESOLVED || newStatus == TicketStatus.CANCELLED) {
            ticket.setClosedAt(LocalDateTime.now());
        }
        
        return ticketRepository.save(ticket);
    }
}