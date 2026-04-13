package com.example.be.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.be.dto.response.ApiResponse;
import com.example.be.dto.response.PayrollEmployeesResponse;
import com.example.be.service.PayrollService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
public class PayrollEmployeeController {

    private final PayrollService payrollService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'MANAGER')")
    public ResponseEntity<ApiResponse<PayrollEmployeesResponse>> getEmployees(
            @RequestParam(required = false, defaultValue = "active") String status,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(ApiResponse.success(payrollService.getActiveEmployees(month, year, status)));
    }
}
