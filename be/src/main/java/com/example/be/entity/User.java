package com.example.be.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_phone", columnList = "phone"),
    @Index(name = "idx_user_role", columnList = "role")
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

    @Column(length = 20, unique = true)
    private String phone;

    @Column(length = 100)
    private String branch;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "employee_type", nullable = false, length = 20)
    private EmployeeType employeeType = EmployeeType.FULLTIME;

    @Column(name = "base_salary", nullable = false, precision = 15, scale = 2)
    private java.math.BigDecimal baseSalary = java.math.BigDecimal.ZERO;
    
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
}
