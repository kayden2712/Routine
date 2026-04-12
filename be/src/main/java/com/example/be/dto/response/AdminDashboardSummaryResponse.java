package com.example.be.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardSummaryResponse {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalCustomers;
    private Long lowStockCount;
    private List<RecentOrder> recentOrders;
    private List<StockAlert> stockAlerts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentOrder {
        private Long id;
        private String orderNumber;
        private String status;
        private BigDecimal total;
        private LocalDateTime createdAt;
        private String customerName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StockAlert {
        private Long productId;
        private String productCode;
        private String productName;
        private Integer stock;
        private Integer minStock;
    }
}
