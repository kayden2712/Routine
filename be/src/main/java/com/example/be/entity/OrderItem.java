package com.example.be.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items", indexes = {
    @Index(name = "idx_order_item_order", columnList = "order_id"),
    @Index(name = "idx_order_item_product", columnList = "product_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class OrderItem extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(name = "product_code", nullable = false, length = 50)
    @NotBlank
    private String productCode;
    
    @Column(name = "product_name", nullable = false)
    @NotBlank
    private String productName;
    
    @Column(nullable = false, precision = 15, scale = 2)
    @NotNull
    private BigDecimal price;
    
    @Column(nullable = false)
    @NotNull
    @Min(1)
    private Integer quantity;
    
    @Column(nullable = false, precision = 15, scale = 2)
    @NotNull
    private BigDecimal subtotal;
    
    @Column(length = 20)
    private String size;
    
    @Column(length = 50)
    private String color;
}
