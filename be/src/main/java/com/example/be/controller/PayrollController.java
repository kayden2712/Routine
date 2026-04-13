package com.example.be.controller;

import java.security.Principal;
import java.util.List;

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

import com.example.be.dto.request.PayrollGenerateRequest;
import com.example.be.dto.response.ApiResponse;
import com.example.be.dto.response.PayrollApproveResponse;
import com.example.be.dto.response.PayrollGenerateResponse;
import com.example.be.dto.response.PayrollResponse;
import com.example.be.service.PayrollService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getPayrolls(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(ApiResponse.success(payrollService.getPayrolls(month, year)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'MANAGER')")
    public ResponseEntity<ApiResponse<PayrollResponse>> getPayrollById(@PathVariable("id") Long payrollId) {
        return ResponseEntity.ok(ApiResponse.success(payrollService.getPayrollById(payrollId)));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'MANAGER')")
    public ResponseEntity<ApiResponse<PayrollGenerateResponse>> generatePayroll(
            @Valid @RequestBody PayrollGenerateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(payrollService.generatePayroll(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'MANAGER')")
    public ResponseEntity<ApiResponse<PayrollGenerateResponse>> updatePayroll(
            @PathVariable("id") Long payrollId,
            @RequestBody PayrollGenerateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(payrollService.updatePayroll(payrollId, request)));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'MANAGER')")
    public ResponseEntity<ApiResponse<PayrollApproveResponse>> approvePayroll(
            @PathVariable("id") Long payrollId,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(payrollService.approvePayroll(payrollId, principal.getName())));
    }
}
