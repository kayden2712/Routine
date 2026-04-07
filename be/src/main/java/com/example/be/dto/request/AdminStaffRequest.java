package com.example.be.dto.request;

import com.example.be.entity.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminStaffRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^$|^0\\d{9}$", message = "Phone must be exactly 10 digits and start with 0")
    private String phone;

    private String branch;

    @NotNull(message = "Role is required")
    private UserRole role;

    private Boolean isActive;

    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
