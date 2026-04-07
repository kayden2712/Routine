package com.example.be.service;

import com.example.be.dto.request.CartItemRequest;
import com.example.be.entity.CartItem;
import com.example.be.entity.Customer;
import com.example.be.entity.Product;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.CartItemRepository;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CartServiceTest {

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CartService cartService;

    @Test
    void updateQuantityRejectsCartItemOwnedByAnotherCustomer() {
        when(cartItemRepository.findByIdAndCustomerEmail(9L, "customer@example.com")).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> cartService.updateQuantity(9L, 2, "customer@example.com"));
        assertNotNull(exception.getMessage());
    }

    @Test
    void addToCartRejectsQuantityBeyondStock() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setEmail("customer@example.com");

        Product product = new Product();
        product.setId(5L);
        product.setName("Shirt");
        product.setPrice(BigDecimal.valueOf(200_000));
        product.setStock(1);

        CartItemRequest request = new CartItemRequest(5L, 2, "L", "Black");

        when(customerRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(customer));
        when(productRepository.findById(5L)).thenReturn(Optional.of(product));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> cartService.addToCart("customer@example.com", request));
        assertNotNull(exception.getMessage());
        verify(cartItemRepository, never()).save(any(CartItem.class));
    }

    @Test
    void updateQuantityUsesOwnedCartItemAndPersistsNewQuantity() {
        Product product = new Product();
        product.setId(5L);
        product.setName("Shirt");
        product.setPrice(BigDecimal.valueOf(200_000));
        product.setStock(10);

        CartItem cartItem = new CartItem();
        cartItem.setId(9L);
        cartItem.setProduct(product);
        cartItem.setQuantity(1);

        when(cartItemRepository.findByIdAndCustomerEmail(9L, "customer@example.com"))
                .thenReturn(Optional.of(cartItem));
        when(cartItemRepository.save(cartItem)).thenReturn(cartItem);

        assertEquals(4, cartService.updateQuantity(9L, 4, "customer@example.com").getQuantity());
    }
}
