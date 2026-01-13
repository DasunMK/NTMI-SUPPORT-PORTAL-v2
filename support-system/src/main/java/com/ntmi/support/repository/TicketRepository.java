package com.ntmi.support.repository;

import com.ntmi.support.model.Ticket;
import com.ntmi.support.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    List<Ticket> findByBranch_BranchId(Long branchId);

    
    List<Ticket> findByStatus(TicketStatus status);
    
    
    long countByCreatedAtAfter(LocalDateTime date);

    
    long countByClosedAtAfter(LocalDateTime date);

    
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status != 'CLOSED' AND t.createdAt < :date")
    long countPastDueTickets(LocalDateTime date);
}