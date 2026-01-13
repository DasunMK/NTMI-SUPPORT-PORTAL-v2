package com.ntmi.support.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class DashboardStats {
    // Top Cards
    private long pastDueTickets;
    private long newTicketsToday;
    private long closedTicketsToday;

    // Charts
    private List<LabelValue> categoryStats; // For Donut Chart
    private List<LabelValue> errorStats;    // For Bar Chart
    private List<DailyStat> weeklyStats;    // For Timeline

    // Helper classes for the charts
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