package com.example.be.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCustomerResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private String address;
    private String tier;
    private Integer totalOrders;
    private BigDecimal totalSpent;
    private LocalDateTime lastOrderAt;
    private LocalDateTime createdAt;
}
