package com.ntmi.support.scheduler;

import com.ntmi.support.model.Ticket;
import com.ntmi.support.model.TicketStatus;
import com.ntmi.support.repository.TicketImageRepository;
import com.ntmi.support.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ImageCleanupScheduler {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private TicketImageRepository imageRepository;

    // Run every day at 2:00 AM
    @Scheduled(cron = "0 0 2 * * ?") 
    @Transactional
    public void deleteOldTicketImages() {
        System.out.println("🧹 Starting Daily Image Cleanup Task...");

        // 1. Calculate the cutoff date (30 Days Ago)
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);

        // 2. Find tickets that are CLOSED/RESOLVED and older than 30 days
        // Note: You might need to add a custom query to your Repository if this gets complex,
        // but for now, we will fetch and filter.
        
        List<Ticket> oldTickets = ticketRepository.findAll(); // Optimization: Use a custom query for production

        int deletedCount = 0;

        for (Ticket ticket : oldTickets) {
            // Check if ticket is resolved/closed AND the closed date is older than 30 days
            boolean isCompleted = (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED);
            
            if (isCompleted && ticket.getClosedAt() != null && ticket.getClosedAt().isBefore(cutoffDate)) {
                
                // Check if it has images
                if (!ticket.getImages().isEmpty()) {
                    int imageCount = ticket.getImages().size();
                    
                    // Delete all images associated with this ticket
                    imageRepository.deleteAll(ticket.getImages());
                    
                    // Clear the list in the object to keep Hibernate in sync
                    ticket.getImages().clear(); 
                    ticketRepository.save(ticket);
                    
                    deletedCount += imageCount;
                    System.out.println("   - Deleted " + imageCount + " images from Ticket #" + ticket.getTicketId());
                }
            }
        }

        System.out.println("✅ Cleanup Complete. Total images removed: " + deletedCount);
    }
}