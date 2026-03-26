package com.example.be.service;

import com.example.be.dto.request.CreateOrderRequest;
import com.example.be.dto.response.OrderResponse;
import com.example.be.entity.*;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    
    private static final BigDecimal VIP_THRESHOLD = BigDecimal.valueOf(5_000_000);
    private static final int OUT_OF_STOCK_THRESHOLD = 0;
    
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        return mapToResponse(order);
    }
    
    public List<OrderResponse> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerId(customerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public List<OrderResponse> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse createOrder(CreateOrderRequest request, String createdByEmail) {
        User createdBy = userRepository.findByEmail(createdByEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        }
        
        // Generate order number
        String orderNumber = generateOrderNumber();
        
        // Create order
        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setCustomer(customer);
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        order.setPaymentMethod(request.getPaymentMethod());
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedBy(createdBy);
        order.setNotes(request.getNotes());
        
        // Create order items
        List<OrderItem> items = new ArrayList<>();
        for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));
            
            if (product.getStock() < itemReq.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product: " + product.getName());
            }
            
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setProductCode(product.getCode());
            item.setProductName(product.getName());
            item.setPrice(product.getPrice());
            item.setQuantity(itemReq.getQuantity());
            item.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())));
            item.setSize(itemReq.getSize());
            item.setColor(itemReq.getColor());
            
            items.add(item);
            subtotal = subtotal.add(item.getSubtotal());
            
            // Update product stock
            product.setStock(product.getStock() - itemReq.getQuantity());
            if (product.getStock() <= 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            }
            productRepository.save(product);
        }
        if (discount.compareTo(subtotal) > 0) {
            throw new BadRequestException("Discount cannot exceed subtotal");
        }

        order.setSubtotal(subtotal);
        order.setDiscount(discount);
        order.setTotal(subtotal.subtract(discount));
        order.setItems(items);
        Order saved = orderRepository.save(order);
        
        // Update customer stats if exists
        if (customer != null) {
            customer.setTotalOrders(customer.getTotalOrders() + 1);
            customer.setTotalSpent(customer.getTotalSpent().add(saved.getTotal()));
            customer.setLastOrderAt(LocalDateTime.now());
            
            // Upgrade to VIP if total spent > 5,000,000
            if (customer.getTotalSpent().compareTo(BigDecimal.valueOf(5000000)) > 0) {
                customer.setTier(CustomerTier.VIP);
            }
            customerRepository.save(customer);
        }
        
        return mapToResponse(saved);
    }
    
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        
        order.setStatus(status);
        Order updated = orderRepository.save(order);
        return mapToResponse(updated);
    }
    
    private String generateOrderNumber() {
        return "ORD" + System.currentTimeMillis();
    }
    
    private OrderResponse mapToResponse(Order order) {
        OrderResponse.CustomerSummary customerSummary = null;
        if (order.getCustomer() != null) {
            Customer c = order.getCustomer();
            customerSummary = OrderResponse.CustomerSummary.builder()
                    .id(c.getId())
                    .fullName(c.getFullName())
                    .phone(c.getPhone())
                    .email(c.getEmail())
                    .build();
        }
        
        List<OrderResponse.OrderItemResponse> items = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productCode(item.getProductCode())
                        .productName(item.getProductName())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .size(item.getSize())
                        .color(item.getColor())
                        .build())
                .collect(Collectors.toList());
        
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customer(customerSummary)
                .items(items)
                .subtotal(order.getSubtotal())
                .discount(order.getDiscount())
                .total(order.getTotal())
                .paymentMethod(order.getPaymentMethod().name())
                .status(order.getStatus().name())
                .createdByName(order.getCreatedBy().getFullName())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
