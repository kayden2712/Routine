package com.example.be.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.be.dto.request.AdminStaffRequest;
import com.example.be.dto.request.UpdateStaffStatusRequest;
import com.example.be.dto.response.AdminStaffResponse;
import com.example.be.dto.response.ApiResponse;
import com.example.be.service.AdminStaffService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class AdminStaffController {

    private final AdminStaffService adminStaffService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminStaffResponse>>> getStaff() {
        return ResponseEntity.ok(ApiResponse.success(adminStaffService.getStaff()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminStaffResponse>> getStaffById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminStaffService.getStaffById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminStaffResponse>> createStaff(@Valid @RequestBody AdminStaffRequest request) {
        AdminStaffResponse created = adminStaffService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Staff created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminStaffResponse>> updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody AdminStaffRequest request) {
        AdminStaffResponse updated = adminStaffService.updateStaff(id, request);
        return ResponseEntity.ok(ApiResponse.success("Staff updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminStaffResponse>> updateStaffStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStaffStatusRequest request) {
        AdminStaffResponse updated = adminStaffService.updateStatus(id, request.getIsActive());
        return ResponseEntity.ok(ApiResponse.success("Staff status updated successfully", updated));
    }
}
