package com.ntmi.support.dto;

import lombok.Data;
import java.util.List;

@Data
public class DashboardStats {
    // Top Cards
    private long pastDueTickets;
    private long newTicketsToday;
    private long closedTicketsToday;

    // Charts data
    private List<LabelValue> categoryStats; // Donut Chart
    private List<LabelValue> errorStats;    // Bar Chart
    private List<DailyStat> weeklyStats;    // Timeline

    // Helper classes for charts
    @Data
    public static class LabelValue {
        private String name;
        private long value;
        public LabelValue(String name, long value) {
            this.name = name;
            this.value = value;
        }
    }

    @Data
    public static class DailyStat {
        private String day;
        private long total;
        private long closed;
        public DailyStat(String day, long total, long closed) {
            this.day = day;
            this.total = total;
            this.closed = closed;
        }
    }
}