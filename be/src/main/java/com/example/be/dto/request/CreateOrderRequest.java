package com.example.be.dto.request;

import com.example.be.entity.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    
    private Long customerId;
    
    @NotEmpty(message = "Order items are required")
    private List<OrderItemRequest> items;
    
    @NotNull(message = "Subtotal is required")
    private BigDecimal subtotal;
    
    private BigDecimal discount;
    
    @NotNull(message = "Total is required")
    private BigDecimal total;
    
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
    
    private String notes;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {
        @NotNull
        private Long productId;
        
        @NotNull
        @Min(1)
        private Integer quantity;
        
        @NotNull
        private BigDecimal price;
        
        private String size;
        private String color;
    }
}
