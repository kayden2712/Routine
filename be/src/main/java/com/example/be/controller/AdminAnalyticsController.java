package com.example.be.controller;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.be.dto.response.AdminDashboardSummaryResponse;
import com.example.be.dto.response.AdminReportSummaryResponse;
import com.example.be.dto.response.ApiResponse;
import com.example.be.service.AdminAnalyticsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'SALES', 'WAREHOUSE', 'ACCOUNTANT')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/dashboard/summary")
    public ResponseEntity<ApiResponse<AdminDashboardSummaryResponse>> getDashboardSummary(
            @RequestParam(defaultValue = "7days") String range) {
        return ResponseEntity.ok(ApiResponse.success(adminAnalyticsService.getDashboardSummary(range)));
    }

    @GetMapping("/reports/summary")
    public ResponseEntity<ApiResponse<AdminReportSummaryResponse>> getReportSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(adminAnalyticsService.getReportSummary(from, to)));
    }
}
