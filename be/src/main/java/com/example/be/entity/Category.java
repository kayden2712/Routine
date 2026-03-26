package com.example.be.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "categories", indexes = {
    @Index(name = "idx_slug", columnList = "slug")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Category extends BaseEntity {
    
    @Column(nullable = false, unique = true)
    @NotBlank
    private String name;
    
    @Column(nullable = false, unique = true)
    @NotBlank
    private String slug;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 100)
    private String icon;
    
    @Column(name = "display_order")
    private Integer displayOrder = 0;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
}
