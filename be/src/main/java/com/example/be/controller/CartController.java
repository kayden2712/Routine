package com.example.be.controller;

import com.example.be.dto.request.CartItemRequest;
import com.example.be.dto.response.ApiResponse;
import com.example.be.dto.response.CartItemResponse;
import com.example.be.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class CartController {
    
    private final CartService cartService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<CartItemResponse>>> getCartItems(Authentication authentication) {
        List<CartItemResponse> items = cartService.getCartItems(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(items));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<CartItemResponse>> addToCart(
            @Valid @RequestBody CartItemRequest request,
            Authentication authentication) {
        CartItemResponse item = cartService.addToCart(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Item added to cart", item));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CartItemResponse>> updateQuantity(
            @PathVariable Long id,
            @RequestParam Integer quantity,
            Authentication authentication) {
        CartItemResponse item = cartService.updateQuantity(id, quantity, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Cart item updated", item));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> removeFromCart(
            @PathVariable Long id,
            Authentication authentication) {
        cartService.removeFromCart(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Item removed from cart", null));
    }
    
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(Authentication authentication) {
        cartService.clearCart(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
    }
}
