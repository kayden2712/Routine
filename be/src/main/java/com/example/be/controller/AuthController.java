package com.example.be.controller;

import com.example.be.dto.request.LoginRequest;
import com.example.be.dto.request.RegisterCustomerRequest;
import com.example.be.dto.request.RegisterUserRequest;
import com.example.be.dto.response.ApiResponse;
import com.example.be.dto.response.AuthResponse;
import com.example.be.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/admin/register")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<AuthResponse>> registerAdmin(@Valid @RequestBody RegisterUserRequest request) {
        AuthResponse response = authService.registerUser(request);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", response));
    }
    
    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<AuthResponse>> loginAdmin(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginUser(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
    
    @PostMapping("/customer/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCustomer(@Valid @RequestBody RegisterCustomerRequest request) {
        AuthResponse response = authService.registerCustomer(request);
        return ResponseEntity.ok(ApiResponse.success("Customer registered successfully", response));
    }
    
    @PostMapping("/customer/login")
    public ResponseEntity<ApiResponse<AuthResponse>> loginCustomer(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.loginCustomer(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}
