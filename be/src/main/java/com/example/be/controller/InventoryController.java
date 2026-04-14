package com.example.be.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

import com.example.be.dto.request.ExportReceiptRequest;
import com.example.be.dto.request.ImportReceiptRequest;
import com.example.be.dto.request.InventoryAdjustRequest;
import com.example.be.dto.request.InventoryCheckApproveRequest;
import com.example.be.dto.request.InventoryCheckConfirmRequest;
import com.example.be.dto.request.InventoryCheckSubmitRequest;
import com.example.be.dto.response.ApiResponse;
import com.example.be.dto.response.ExportReceiptResponse;
import com.example.be.dto.response.ImportReceiptResponse;
import com.example.be.dto.response.InventoryCheckItemResponse;
import com.example.be.dto.response.InventoryCheckListResponse;
import com.example.be.dto.response.InventoryCheckSessionResponse;
import com.example.be.dto.response.InventoryDiscrepancyReportResponse;
import com.example.be.dto.response.InventoryHistoryResponse;
import com.example.be.dto.response.InventoryReportResponse;
import com.example.be.entity.enums.ReceiptStatus;
import com.example.be.service.InventoryCheckService;
import com.example.be.service.InventoryManagementService;
import com.example.be.service.InventoryReceiptService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryManagementService inventoryManagementService;
    private final InventoryReceiptService inventoryReceiptService;
    private final InventoryCheckService inventoryCheckService;

    @GetMapping("/items")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<InventoryCheckListResponse>> getInventoryItemsForCheck(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkDate) {
        InventoryCheckListResponse response = inventoryCheckService.getInventoryItems(principal.getName(), checkDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/check")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<InventoryCheckItemResponse>> submitInventoryCheck(
            @Valid @RequestBody InventoryCheckSubmitRequest request,
            Principal principal) {
        InventoryCheckItemResponse response = inventoryCheckService.submitCheck(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Inventory check submitted", response));
    }

    @PostMapping("/check/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<InventoryCheckListResponse>> approveInventoryCheck(
            @Valid @RequestBody InventoryCheckApproveRequest request,
            Principal principal) {
        InventoryCheckListResponse response = inventoryCheckService.approveStocktake(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Inventory check approved", response));
    }

    @GetMapping("/check-sessions")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<List<InventoryCheckSessionResponse>>> getInventoryCheckSessions(Principal principal) {
        List<InventoryCheckSessionResponse> response = inventoryCheckService.getInventorySessions(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping(value = "/report", params = "stocktakeId")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<InventoryDiscrepancyReportResponse>> getInventoryDiscrepancyReport(
            @RequestParam Long stocktakeId) {
        InventoryDiscrepancyReportResponse response = inventoryCheckService.getDiscrepancyReport(stocktakeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<InventoryCheckItemResponse>> confirmInventoryCheck(
            @Valid @RequestBody InventoryCheckConfirmRequest request,
            Principal principal) {
        InventoryCheckItemResponse response = inventoryCheckService.confirmCheck(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Inventory check confirmation updated", response));
    }

    @GetMapping("/report")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE', 'SALES')")
    public ResponseEntity<ApiResponse<List<InventoryReportResponse>>> getInventoryReport(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "false") boolean lowStockOnly) {
        List<InventoryReportResponse> report = inventoryManagementService.getInventoryReport(keyword, lowStockOnly);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE', 'SALES')")
    public ResponseEntity<ApiResponse<Page<InventoryHistoryResponse>>> getInventoryHistory(
            @RequestParam(required = false) Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<InventoryHistoryResponse> history = inventoryManagementService.getInventoryHistory(productId, page, size);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<InventoryReportResponse>> adjustInventory(
            @Valid @RequestBody InventoryAdjustRequest request,
            Principal principal) {
        InventoryReportResponse response = inventoryManagementService.adjustStock(request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Inventory adjusted successfully", response));
    }

    @GetMapping("/import-receipts")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<Page<ImportReceiptResponse>>> getImportReceipts(
            @RequestParam(required = false) ReceiptStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ImportReceiptResponse> receipts = inventoryReceiptService.getImportReceipts(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(receipts));
    }

    @PostMapping("/import-receipts")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<ImportReceiptResponse>> createImportReceipt(
            @Valid @RequestBody ImportReceiptRequest request,
            Principal principal) {
        ImportReceiptResponse response = inventoryReceiptService.createImportReceipt(request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Import receipt created", response));
    }

    @PostMapping("/import-receipts/{id}/confirm")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<ImportReceiptResponse>> confirmImportReceipt(
            @PathVariable("id") Long id,
            Principal principal) {
        ImportReceiptResponse response = inventoryReceiptService.confirmImportReceipt(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Import receipt confirmed", response));
    }

    @PostMapping("/import-receipts/{id}/cancel")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<ImportReceiptResponse>> cancelImportReceipt(
            @PathVariable("id") Long id,
            Principal principal) {
        ImportReceiptResponse response = inventoryReceiptService.cancelImportReceipt(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Import receipt cancelled", response));
    }

    @GetMapping("/export-receipts")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<Page<ExportReceiptResponse>>> getExportReceipts(
            @RequestParam(required = false) ReceiptStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ExportReceiptResponse> receipts = inventoryReceiptService.getExportReceipts(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(receipts));
    }

    @PostMapping("/export-receipts")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<ExportReceiptResponse>> createExportReceipt(
            @Valid @RequestBody ExportReceiptRequest request,
            Principal principal) {
        ExportReceiptResponse response = inventoryReceiptService.createExportReceipt(request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Export receipt created", response));
    }

    @PostMapping("/export-receipts/{id}/confirm")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<ExportReceiptResponse>> confirmExportReceipt(
            @PathVariable("id") Long id,
            Principal principal) {
        ExportReceiptResponse response = inventoryReceiptService.confirmExportReceipt(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Export receipt confirmed", response));
    }

    @PostMapping("/export-receipts/{id}/cancel")
    @PreAuthorize("hasAnyRole('MANAGER', 'WAREHOUSE')")
    public ResponseEntity<ApiResponse<ExportReceiptResponse>> cancelExportReceipt(
            @PathVariable("id") Long id,
            Principal principal) {
        ExportReceiptResponse response = inventoryReceiptService.cancelExportReceipt(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Export receipt cancelled", response));
    }
}
