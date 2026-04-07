package com.example.be.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.example.be.dto.request.ApplyPromotionRequest;
import com.example.be.dto.request.CheckPromotionRequest;
import com.example.be.dto.request.CreatePromotionRequest;
import com.example.be.dto.request.UpdatePromotionRequest;
import com.example.be.dto.response.ApiResponse;
import com.example.be.dto.response.ApplyPromotionResponse;
import com.example.be.dto.response.CheckPromotionResponse;
import com.example.be.dto.response.PromotionDetailResponse;
import com.example.be.dto.response.PromotionResponse;
import com.example.be.entity.enums.PromotionStatus;
import com.example.be.service.PromotionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getAllPromotions(
            @RequestParam(required = false) PromotionStatus status) {
        List<PromotionResponse> promotions = status != null
                ? promotionService.getPromotionsByStatus(status)
                : promotionService.getAllPromotions();
        return ResponseEntity.ok(ApiResponse.success(promotions));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getActivePromotions() {
        List<PromotionResponse> promotions = promotionService.getActivePromotions();
        return ResponseEntity.ok(ApiResponse.success(promotions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PromotionDetailResponse>> getPromotionById(@PathVariable Long id) {
        PromotionDetailResponse promotion = promotionService.getPromotionById(id);
        return ResponseEntity.ok(ApiResponse.success(promotion));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<PromotionResponse>> getPromotionByCode(@PathVariable String code) {
        PromotionResponse promotion = promotionService.getPromotionByCode(code);
        return ResponseEntity.ok(ApiResponse.success(promotion));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PromotionResponse>> createPromotion(
            @Valid @RequestBody CreatePromotionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long createdBy = extractUserIdFromUserDetails(userDetails);
        PromotionResponse created = promotionService.createPromotion(request, createdBy);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo chương trình khuyến mại thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PromotionResponse>> updatePromotion(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePromotionRequest request) {
        PromotionResponse updated = promotionService.updatePromotion(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chương trình khuyến mại thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable Long id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa chương trình khuyến mại thành công", null));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PromotionResponse>> activatePromotion(@PathVariable Long id) {
        PromotionResponse activated = promotionService.activatePromotion(id);
        return ResponseEntity.ok(ApiResponse.success("Kích hoạt khuyến mại thành công", activated));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PromotionResponse>> cancelPromotion(@PathVariable Long id) {
        PromotionResponse cancelled = promotionService.cancelPromotion(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy khuyến mại thành công", cancelled));
    }

    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<ApplyPromotionResponse>> applyPromotion(
            @Valid @RequestBody ApplyPromotionRequest request,
            @RequestParam(required = false) Long orderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long appliedBy = userDetails != null ? extractUserIdFromUserDetails(userDetails) : null;
        ApplyPromotionResponse result = promotionService.applyPromotion(request, orderId, appliedBy);

        if (Boolean.TRUE.equals(result.getApplicable())) {
            return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
        } else {
            return ResponseEntity.ok(ApiResponse.success(result));
        }
    }

    @PostMapping("/check")
    public ResponseEntity<ApiResponse<CheckPromotionResponse>> checkPromotions(
            @Valid @RequestBody CheckPromotionRequest request) {
        CheckPromotionResponse result = promotionService.checkApplicablePromotions(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private Long extractUserIdFromUserDetails(UserDetails userDetails) {
        if (userDetails == null) {
            return null;
        }
        try {
            return Long.valueOf(userDetails.getUsername());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
