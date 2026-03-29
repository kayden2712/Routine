package com.example.be.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.be.dto.response.AdminDashboardSummaryResponse;
import com.example.be.dto.response.AdminReportSummaryResponse;
import com.example.be.entity.Order;
import com.example.be.entity.OrderItem;
import com.example.be.entity.OrderStatus;
import com.example.be.entity.Product;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.OrderRepository;
import com.example.be.repository.ProductRepository;

@ExtendWith(MockitoExtension.class)
class AdminAnalyticsServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private AdminAnalyticsService adminAnalyticsService;

    @Test
    void getDashboardSummaryBuildsCoreMetrics() {
        Product product = new Product();
        product.setId(1L);
        product.setCode("P001");
        product.setName("Shirt");
        product.setStock(2);
        product.setMinStock(10);

        Order order = new Order();
        order.setId(99L);
        order.setOrderNumber("ORD-99");
        order.setStatus(OrderStatus.PAID);
        order.setTotal(BigDecimal.valueOf(500_000));
        order.setCreatedAt(LocalDateTime.now());

        when(orderRepository.getTotalRevenue(any(), any())).thenReturn(500_000d);
        when(orderRepository.getTotalOrders(any(), any())).thenReturn(3L);
        when(customerRepository.count()).thenReturn(20L);
        when(productRepository.findLowStockProducts()).thenReturn(List.of(product));
        when(orderRepository.findTop10ByOrderByCreatedAtDesc()).thenReturn(List.of(order));

        AdminDashboardSummaryResponse response = adminAnalyticsService.getDashboardSummary("7days");

        assertEquals(BigDecimal.valueOf(500_000d), response.getTotalRevenue());
        assertEquals(3L, response.getTotalOrders());
        assertEquals(20L, response.getTotalCustomers());
        assertEquals(1L, response.getLowStockCount());
    }

    @Test
    void getReportSummaryCalculatesAverageAndTopProducts() {
        Product product = new Product();
        product.setId(5L);

        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setProductCode("P005");
        item.setProductName("Denim");
        item.setQuantity(2);
        item.setSubtotal(BigDecimal.valueOf(600_000));

        Order paid = new Order();
        paid.setStatus(OrderStatus.PAID);
        paid.setTotal(BigDecimal.valueOf(600_000));
        paid.setItems(List.of(item));

        when(orderRepository.findByCreatedAtBetween(any(), any())).thenReturn(List.of(paid));
        when(customerRepository.count()).thenReturn(15L);

        AdminReportSummaryResponse response = adminAnalyticsService.getReportSummary(
                LocalDate.now().minusDays(7), LocalDate.now());

        assertEquals(BigDecimal.valueOf(600_000), response.getTotalRevenue());
        assertEquals(1L, response.getTotalOrders());
        assertEquals(BigDecimal.valueOf(600_000).setScale(2), response.getAverageOrderValue());
        assertEquals(1, response.getTopProducts().size());
        assertEquals(2, response.getTopProducts().get(0).getQuantitySold());
    }
}
