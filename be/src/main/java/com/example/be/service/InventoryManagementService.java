package com.example.be.service;

import java.util.List;

import org.springframework.data.domain.Page;

import com.example.be.dto.request.InventoryAdjustRequest;
import com.example.be.dto.response.InventoryHistoryResponse;
import com.example.be.dto.response.InventoryReportResponse;

public interface InventoryManagementService {

    List<InventoryReportResponse> getInventoryReport(String keyword, boolean lowStockOnly);

    Page<InventoryHistoryResponse> getInventoryHistory(Long productId, int page, int size);

    InventoryReportResponse adjustStock(InventoryAdjustRequest request, String userEmail);
}
