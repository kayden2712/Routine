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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.be.dto.request.CreateOrderRequest;
import com.example.be.dto.request.UpdateOrderStatusRequest;
import com.example.be.dto.response.ApiResponse;
import com.example.be.dto.response.OrderResponse;
import com.example.be.dto.response.OrderTrackingResponse;
import com.example.be.entity.OrderStatus;
import com.example.be.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'SALES', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        List<OrderResponse> orders = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SALES', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByCustomer(@PathVariable Long customerId) {
        List<OrderResponse> orders = orderService.getOrdersByCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByStatus(@PathVariable OrderStatus status) {
        List<OrderResponse> orders = orderService.getOrdersByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        OrderResponse order = orderService.createOrder(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", order));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'SALES', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String actorEmail = authentication == null ? null : authentication.getName();
        OrderResponse order = orderService.updateOrderStatus(id, status, reason, "STAFF", actorEmail);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", order));
    }

    @PutMapping("/{id}/status-v2")
    @PreAuthorize("hasAnyRole('MANAGER', 'SALES', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatusV2(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            Authentication authentication) {
        String actorEmail = authentication == null ? null : authentication.getName();
        OrderResponse order = orderService.updateOrderStatus(id, request.getStatus(), request.getReason(), "STAFF",
                actorEmail);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", order));
    }

    @GetMapping("/{id}/tracking")
    @PreAuthorize("hasAnyRole('MANAGER', 'SALES', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<OrderTrackingResponse>> getOrderTracking(@PathVariable Long id) {
        OrderTrackingResponse tracking = orderService.getOrderTracking(id);
        return ResponseEntity.ok(ApiResponse.success(tracking));
    }
}
