package com.example.be.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.be.dto.request.CancelOrderRequest;
import com.example.be.dto.request.CreateOrderRequest;
import com.example.be.dto.request.ReturnOrderRequest;
import com.example.be.dto.request.SubmitProductReviewRequest;
import com.example.be.dto.response.ApiResponse;
import com.example.be.dto.response.OrderResponse;
import com.example.be.dto.response.OrderTrackingResponse;
import com.example.be.service.OrderReviewService;
import com.example.be.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/customer/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerOrderController {

    private final OrderService orderService;
    private final OrderReviewService orderReviewService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(Authentication authentication) {
        List<OrderResponse> orders = orderService.getOrdersByCustomerEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        OrderResponse order = orderService.createOrderForCustomer(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", order));
    }

    @PutMapping("/{id}/cancel-request")
    public ResponseEntity<ApiResponse<OrderResponse>> requestCancelOrder(
            @PathVariable Long id,
            @Valid @RequestBody CancelOrderRequest request,
            Authentication authentication) {
        OrderResponse order = orderService.requestOrderCancellation(id, authentication.getName(), request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Cancellation requested", order));
    }

    @PutMapping("/{id}/cancel-request/revoke")
    public ResponseEntity<ApiResponse<OrderResponse>> revokeCancelOrderRequest(
            @PathVariable Long id,
            Authentication authentication) {
        OrderResponse order = orderService.revokeOrderCancellationRequest(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Cancellation request revoked", order));
    }

    @PutMapping("/{id}/return-request")
    public ResponseEntity<ApiResponse<OrderResponse>> requestReturnOrder(
            @PathVariable Long id,
            @Valid @RequestBody ReturnOrderRequest request,
            Authentication authentication) {
        OrderResponse order = orderService.requestOrderReturn(id, authentication.getName(), request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Return requested", order));
    }

    @PutMapping("/{id}/confirm-completed")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmOrderCompleted(
            @PathVariable Long id,
            Authentication authentication) {
        OrderResponse order = orderService.confirmOrderCompletion(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Order completed", order));
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<ApiResponse<OrderTrackingResponse>> getMyOrderTracking(
            @PathVariable Long id,
            Authentication authentication) {
        OrderTrackingResponse tracking = orderService.getOrderTrackingForCustomer(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(tracking));
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<Void>> submitProductReview(
            @PathVariable Long id,
            @Valid @RequestBody SubmitProductReviewRequest request,
            Authentication authentication) {
        orderReviewService.submitProductReview(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Review submitted", null));
    }
}
