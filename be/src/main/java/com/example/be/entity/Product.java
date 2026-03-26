package com.example.be.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_code", columnList = "code"),
    @Index(name = "idx_product_category", columnList = "category_id"),
    @Index(name = "idx_product_status", columnList = "status"),
    @Index(name = "idx_product_name", columnList = "name")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Product extends BaseEntity {
    
    @Column(nullable = false, unique = true, length = 50)
    @NotBlank
    private String code;
    
    @Column(nullable = false)
    @NotBlank
    private String name;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, precision = 15, scale = 2)
    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal price;
    
    @Column(name = "cost_price", precision = 15, scale = 2)
    private BigDecimal costPrice;
    
    @Column(name = "old_price", precision = 15, scale = 2)
    private BigDecimal oldPrice;
    
    @Column(nullable = false)
    private Integer stock = 0;
    
    @Column(name = "min_stock")
    private Integer minStock = 10;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status = ProductStatus.ACTIVE;
    
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    
    @Column(length = 100)
    private String sku;
    
    @Column(length = 255)
    private String material;
    
    @Column(length = 100)
    private String fit;
    
    @Column(length = 100)
    private String season;
    
    @Column(name = "care_instructions", columnDefinition = "TEXT")
    private String careInstructions;
    
    @Column(precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;
    
    @Column(name = "review_count")
    private Integer reviewCount = 0;
    
    @Enumerated(EnumType.STRING)
    private ProductBadge badge;
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariant> variants = new ArrayList<>();
    
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductImage> images = new ArrayList<>();
}
