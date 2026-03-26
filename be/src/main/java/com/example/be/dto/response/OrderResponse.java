package com.example.be.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private CustomerSummary customer;
    private List<OrderItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal total;
    private String paymentMethod;
    private String status;
    private String createdByName;
    private String notes;
    private LocalDateTime createdAt;
    
    @Data
    @Builder
    public static class CustomerSummary {
        private Long id;
        private String fullName;
        private String phone;
        private String email;
    }
    
    @Data
    @Builder
    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private String productCode;
        private String productName;
        private BigDecimal price;
        private Integer quantity;
        private BigDecimal subtotal;
        private String size;
        private String color;
    }
}
