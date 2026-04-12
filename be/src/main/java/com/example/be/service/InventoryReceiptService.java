package com.example.be.service;

import org.springframework.data.domain.Page;

import com.example.be.dto.request.ImportReceiptRequest;
import com.example.be.dto.request.ExportReceiptRequest;
import com.example.be.dto.response.ImportReceiptResponse;
import com.example.be.dto.response.ExportReceiptResponse;
import com.example.be.entity.enums.ReceiptStatus;

public interface InventoryReceiptService {

    Page<ImportReceiptResponse> getImportReceipts(ReceiptStatus status, int page, int size);

    ImportReceiptResponse createImportReceipt(ImportReceiptRequest request, String userEmail);

    ImportReceiptResponse confirmImportReceipt(Long receiptId, String userEmail);

    ImportReceiptResponse cancelImportReceipt(Long receiptId, String userEmail);

    Page<ExportReceiptResponse> getExportReceipts(ReceiptStatus status, int page, int size);

    ExportReceiptResponse createExportReceipt(ExportReceiptRequest request, String userEmail);

    ExportReceiptResponse confirmExportReceipt(Long receiptId, String userEmail);

    ExportReceiptResponse cancelExportReceipt(Long receiptId, String userEmail);
}
