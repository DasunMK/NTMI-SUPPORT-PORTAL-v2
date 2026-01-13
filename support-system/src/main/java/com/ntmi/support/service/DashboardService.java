package com.ntmi.support.service;

import com.ntmi.support.dto.DashboardStats;
import com.ntmi.support.model.Ticket;
import com.ntmi.support.model.TicketStatus;
import com.ntmi.support.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private TicketRepository ticketRepository;

    public DashboardStats getBranchStats() {
        DashboardStats stats = new DashboardStats();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime twoDaysAgo = LocalDateTime.now().minusHours(48);

        // 1. Set Card Counts
        stats.setNewTicketsToday(ticketRepository.countByCreatedAtAfter(todayStart));
        stats.setClosedTicketsToday(ticketRepository.countByClosedAtAfter(todayStart));
        stats.setPastDueTickets(ticketRepository.countPastDueTickets(twoDaysAgo));

        // 2. Fetch ALL tickets to group them (Simple approach)
        List<Ticket> allTickets = ticketRepository.findAll();

        // 3. Category Distribution (Donut Chart)
        Map<String, Long> catMap = allTickets.stream()
            .filter(t -> t.getErrorCategory() != null)
            .collect(Collectors.groupingBy(t -> t.getErrorCategory().getCategoryName(), Collectors.counting()));
        
        List<DashboardStats.LabelValue> catList = new ArrayList<>();
        catMap.forEach((k, v) -> catList.add(new DashboardStats.LabelValue(k, v)));
        stats.setCategoryStats(catList);

        // 4. Error Distribution (Bar Chart)
        Map<String, Long> errorMap = allTickets.stream()
            .filter(t -> t.getErrorType() != null)
            .collect(Collectors.groupingBy(t -> t.getErrorType().getTypeName(), Collectors.counting()));

        List<DashboardStats.LabelValue> errorList = new ArrayList<>();
        errorMap.forEach((k, v) -> errorList.add(new DashboardStats.LabelValue(k, v)));
        stats.setErrorStats(errorList);

        // 5. Weekly Stats (Timeline)
        // This is tricky. We'll simplify: just count tickets from last 7 days.
        List<DashboardStats.DailyStat> weeklyList = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            String dayName = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            
            long total = allTickets.stream()
                .filter(t -> t.getCreatedAt().toLocalDate().equals(date))
                .count();
                
            long closed = allTickets.stream()
                .filter(t -> t.getClosedAt() != null && t.getClosedAt().toLocalDate().equals(date))
                .count();
                
            weeklyList.add(new DashboardStats.DailyStat(dayName, total, closed));
        }
        stats.setWeeklyStats(weeklyList);

        return stats;
    }
}