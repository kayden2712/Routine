package com.example.be.dto.request;

import com.example.be.entity.UserRole;
import com.example.be.validation.StrongPassword;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterUserRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Password is required")
    @StrongPassword
    private String password;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    @NotNull(message = "Role is required")
    private UserRole role;
}
