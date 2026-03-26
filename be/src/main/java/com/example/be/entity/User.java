package com.example.be.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_role", columnList = "role")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class User extends BaseEntity {
    
    @Column(nullable = false, unique = true)
    @Email
    @NotBlank
    private String email;
    
    @Column(name = "password_hash", nullable = false)
    @NotBlank
    private String passwordHash;
    
    @Column(name = "full_name", nullable = false)
    @NotBlank
    private String fullName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;
    
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
}
