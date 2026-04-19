package com.example.be.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.be.entity.converter.UserRoleListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
    
    @Convert(converter = UserRoleListConverter.class)
    @Column(name = "role", nullable = false, length = 255)
    private List<UserRole> roles = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "employee_type", nullable = false, length = 20)
    private EmployeeType employeeType = EmployeeType.FULLTIME;

    @Column(name = "base_salary", nullable = false, precision = 15, scale = 2)
    private java.math.BigDecimal baseSalary = java.math.BigDecimal.ZERO;
    
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;
    
    @Column(name = "is_active")
    private Boolean isActive = true;

    public UserRole getRole() {
        return (roles == null || roles.isEmpty()) ? null : roles.get(0);
    }

    public void setRole(UserRole role) {
        if (role == null) {
            this.roles = new ArrayList<>();
            return;
        }
        this.roles = new ArrayList<>(List.of(role));
    }

    public boolean hasRole(UserRole role) {
        return role != null && roles != null && roles.contains(role);
    }
}
