package com.ntmi.support.repository;

import com.ntmi.support.model.Ticket;
import com.ntmi.support.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    // 1. Basic Finders
    List<Ticket> findByBranch_BranchId(Long branchId);
    List<Ticket> findByStatus(TicketStatus status);
    
    List<Ticket> findByBranch_BranchIdAndStatusNot(Long branchId, TicketStatus status);

    // ✅ NEW: Find tickets created by a specific user (For Branch User Profile)
    List<Ticket> findByCreatedBy_UserIdOrderByCreatedAtDesc(Long userId);

    // ✅ NEW: Find tickets assigned to a specific admin (For Admin Profile)
    List<Ticket> findByAssignedAdmin_UserIdOrderByCreatedAtDesc(Long userId);

    // --- GLOBAL COUNTS (For Admin Dashboard) ---
    long countByCreatedAtAfter(LocalDateTime date);
    long countByClosedAtAfter(LocalDateTime date);

    // "Past Due" = Not Closed AND Older than 48 hours
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status != 'CLOSED' AND t.status != 'RESOLVED' AND t.createdAt < :date")
    long countPastDueTickets(@Param("date") LocalDateTime date);

    // --- BRANCH SPECIFIC COUNTS (For Branch Dashboard) ---
    long countByBranch_BranchIdAndCreatedAtAfter(Long branchId, LocalDateTime date);
    long countByBranch_BranchIdAndClosedAtAfter(Long branchId, LocalDateTime date);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.branch.branchId = :branchId AND t.status != 'CLOSED' AND t.status != 'RESOLVED' AND t.createdAt < :date")
    long countPastDueTicketsByBranch(@Param("branchId") Long branchId, @Param("date") LocalDateTime date);

    @Query("SELECT t FROM Ticket t WHERE t.status = 'RESOLVED' AND t.resolvedAt IS NOT NULL")
    List<Ticket> findAllResolvedTickets();

    List<Ticket> findByCreatedAtAfter(LocalDateTime date);
List<Ticket> findByBranch_BranchIdAndCreatedAtAfter(Long branchId, LocalDateTime date);
}