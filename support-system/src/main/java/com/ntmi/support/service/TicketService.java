package com.ntmi.support.service;

import com.ntmi.support.model.*;
import com.ntmi.support.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate; // Import this!
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TicketImageRepository imageRepository;

    @Autowired
    private FileStorageService fileStorageService;

    // --- NEW: The tool to push messages to Frontend ---
    @Autowired
    private SimpMessagingTemplate messagingTemplate; 

    @Transactional
    public Ticket createTicket(Ticket ticket, Long userId, List<MultipartFile> files) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ticket.setCreatedBy(user);
        ticket.setBranch(user.getBranch());
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setStatus(TicketStatus.OPEN);

        Ticket savedTicket = ticketRepository.save(ticket);
        savedTicket.setTicketCode("TKT-" + savedTicket.getTicketId());
        ticketRepository.save(savedTicket);

        if (files != null && !files.isEmpty()) {
            if (files.size() > 3) throw new RuntimeException("Max 3 images allowed!");
            for (MultipartFile file : files) {
                String fileName = fileStorageService.saveFile(file);
                TicketImage image = new TicketImage();
                image.setTicket(savedTicket);
                image.setImageUrl(fileName);
                imageRepository.save(image);
            }
        }

        // --- NOTIFICATION LOGIC: Notify All Admins ---
        // We send a message to "/topic/admin-notifications"
        String message = "New Ticket (" + savedTicket.getTicketCode() + ") from " + user.getBranch().getBranchName();
        messagingTemplate.convertAndSend("/topic/admin-notifications", message);

        return savedTicket;
    }

    public Ticket startTicket(Long ticketId, Long adminId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new RuntimeException("Ticket is already taken or closed!");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticket.setAssignedAdmin(admin);
        Ticket updatedTicket = ticketRepository.save(ticket);

        // --- NOTIFICATION LOGIC: Notify Specific Branch User ---
        // We send to "/topic/user/{userId}/notifications"
        String message = "Your ticket " + ticket.getTicketCode() + " is now being processed by " + admin.getFullName();
        String destination = "/topic/user/" + ticket.getCreatedBy().getUserId() + "/notifications";
        messagingTemplate.convertAndSend(destination, message);

        return updatedTicket;
    }

    public Ticket closeTicket(Long ticketId, Long adminId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (ticket.getAssignedAdmin() == null || !ticket.getAssignedAdmin().getUserId().equals(adminId)) {
            throw new RuntimeException("You cannot close this ticket!");
        }

        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(LocalDateTime.now());
        Ticket updatedTicket = ticketRepository.save(ticket);

        // --- NOTIFICATION LOGIC: Notify Specific Branch User ---
        String message = "Ticket " + ticket.getTicketCode() + " has been resolved/closed.";
        String destination = "/topic/user/" + ticket.getCreatedBy().getUserId() + "/notifications";
        messagingTemplate.convertAndSend(destination, message);

        return updatedTicket;
    }
    
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }
}