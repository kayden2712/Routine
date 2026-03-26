package com.example.be.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_variants", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "size", "color"}),
       indexes = @Index(name = "idx_product_variant_product", columnList = "product_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProductVariant extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(length = 20)
    private String size;
    
    @Column(length = 50)
    private String color;
    
    @Column(nullable = false)
    private Integer stock = 0;
    
    @Column(length = 100)
    private String sku;
}
