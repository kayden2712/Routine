package com.example.be.service;

import com.example.be.dto.request.CreateOrderRequest;
import com.example.be.dto.response.OrderResponse;
import com.example.be.entity.Order;
import com.example.be.entity.PaymentMethod;
import com.example.be.entity.Product;
import com.example.be.entity.ProductStatus;
import com.example.be.entity.User;
import com.example.be.exception.BadRequestException;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.OrderRepository;
import com.example.be.repository.ProductRepository;
import com.example.be.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void createOrderCalculatesAmountsFromServerSidePrices() {
        User user = new User();
        user.setId(2L);
        user.setEmail("manager@example.com");
        user.setFullName("Manager");

        Product product = new Product();
        product.setId(7L);
        product.setCode("P001");
        product.setName("Routine Tee");
        product.setPrice(BigDecimal.valueOf(250_000));
        product.setStock(10);
        product.setStatus(ProductStatus.ACTIVE);

        CreateOrderRequest.OrderItemRequest itemRequest =
                new CreateOrderRequest.OrderItemRequest(7L, 2, BigDecimal.ONE, "M", "Blue");
        CreateOrderRequest request = new CreateOrderRequest(
                null,
                List.of(itemRequest),
                BigDecimal.ONE,
                BigDecimal.valueOf(50_000),
                BigDecimal.ONE,
                PaymentMethod.CASH,
                "note"
        );

        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findById(7L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(99L);
            return order;
        });

        OrderResponse response = orderService.createOrder(request, "manager@example.com");

        assertEquals(BigDecimal.valueOf(500_000), response.getSubtotal());
        assertEquals(BigDecimal.valueOf(450_000), response.getTotal());
        assertEquals(BigDecimal.valueOf(250_000), response.getItems().get(0).getPrice());
        assertEquals(8, product.getStock());
    }

    @Test
    void createOrderRejectsDiscountGreaterThanSubtotal() {
        User user = new User();
        user.setEmail("manager@example.com");
        user.setFullName("Manager");

        Product product = new Product();
        product.setId(7L);
        product.setCode("P001");
        product.setName("Routine Tee");
        product.setPrice(BigDecimal.valueOf(100_000));
        product.setStock(10);

        CreateOrderRequest request = new CreateOrderRequest(
                null,
                List.of(new CreateOrderRequest.OrderItemRequest(7L, 1, BigDecimal.ONE, null, null)),
                BigDecimal.ZERO,
                BigDecimal.valueOf(150_000),
                BigDecimal.ZERO,
                PaymentMethod.CASH,
                null
        );

        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findById(7L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        assertThrows(BadRequestException.class,
                () -> orderService.createOrder(request, "manager@example.com"));
    }
}
