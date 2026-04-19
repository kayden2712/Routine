package com.example.be.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStaffResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String branch;
    private String role;
    private List<String> roles;
    private String employeeType;
    private Long baseSalary;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
