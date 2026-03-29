package com.example.be.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.be.dto.request.AdminCustomerRequest;
import com.example.be.dto.response.AdminCustomerResponse;
import com.example.be.dto.response.ApiResponse;
import com.example.be.entity.CustomerTier;
import com.example.be.service.AdminCustomerService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/customers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'SALES')")
public class AdminCustomerController {

    private final AdminCustomerService adminCustomerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminCustomerResponse>>> getCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CustomerTier tier) {
        return ResponseEntity.ok(ApiResponse.success(adminCustomerService.getCustomers(search, tier)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminCustomerResponse>> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminCustomerService.getCustomerById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminCustomerResponse>> createCustomer(@Valid @RequestBody AdminCustomerRequest request) {
        AdminCustomerResponse created = adminCustomerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Customer created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminCustomerResponse>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody AdminCustomerRequest request) {
        AdminCustomerResponse updated = adminCustomerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success("Customer updated successfully", updated));
    }
}
