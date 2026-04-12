package com.example.be.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.CartItemRequest;
import com.example.be.dto.response.CartItemResponse;
import com.example.be.entity.CartItem;
import com.example.be.entity.Customer;
import com.example.be.entity.Product;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ErrorCode;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.CartItemRepository;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public List<CartItemResponse> getCartItems(String customerEmail) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        return cartItemRepository.findByCustomerId(customer.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CartItemResponse addToCart(String customerEmail, CartItemRequest request) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Check if item already exists
        CartItem existingItem = cartItemRepository.findByCustomerIdAndProductIdAndSizeAndColor(
                customer.getId(), request.getProductId(), request.getSize(), request.getColor()).orElse(null);

        if (existingItem != null) {
            int updatedQuantity = existingItem.getQuantity() + request.getQuantity();
            validateStock(product, updatedQuantity);
            existingItem.setQuantity(updatedQuantity);
            CartItem updated = cartItemRepository.save(existingItem);
            return mapToResponse(updated);
        }

        validateStock(product, request.getQuantity());

        CartItem cartItem = new CartItem();
        cartItem.setCustomer(customer);
        cartItem.setProduct(product);
        cartItem.setQuantity(request.getQuantity());
        cartItem.setSize(request.getSize());
        cartItem.setColor(request.getColor());

        CartItem saved = cartItemRepository.save(cartItem);
        return mapToResponse(saved);
    }

    @Transactional
    public CartItemResponse updateQuantity(Long id, Integer quantity, String customerEmail) {
        CartItem cartItem = cartItemRepository.findByIdAndCustomerEmail(id, customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        validateStock(cartItem.getProduct(), quantity);
        cartItem.setQuantity(quantity);
        CartItem updated = cartItemRepository.save(cartItem);
        return mapToResponse(updated);
    }

    @Transactional
    public void removeFromCart(Long id, String customerEmail) {
        CartItem cartItem = cartItemRepository.findByIdAndCustomerEmail(id, customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        cartItemRepository.delete(cartItem);
    }

    @Transactional
    public void clearCart(String customerEmail) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        cartItemRepository.deleteAllByCustomerId(customer.getId());
    }

    private CartItemResponse mapToResponse(CartItem cartItem) {
        Product p = cartItem.getProduct();
        BigDecimal subtotal = p.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));

        return CartItemResponse.builder()
                .id(cartItem.getId())
                .product(CartItemResponse.ProductSummary.builder()
                        .id(p.getId())
                        .code(p.getCode())
                        .name(p.getName())
                        .price(p.getPrice())
                        .imageUrl(p.getImageUrl())
                        .stock(p.getStock())
                        .build())
                .quantity(cartItem.getQuantity())
                .size(cartItem.getSize())
                .color(cartItem.getColor())
                .subtotal(subtotal)
                .build();
    }

    private void validateStock(Product product, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BadRequestException(ErrorCode.CART_QUANTITY_INVALID, "Quantity must be greater than 0");
        }
        if (product.getStock() < quantity) {
            throw new BadRequestException(ErrorCode.STOCK_INSUFFICIENT,
                    "Insufficient stock for product: " + product.getName());
        }
    }
}
