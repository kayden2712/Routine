package com.example.be.service;

import com.example.be.dto.response.AdminDashboardSummaryResponse;
import com.example.be.dto.response.AdminReportSummaryResponse;
import com.example.be.entity.Order;
import com.example.be.entity.OrderItem;
import com.example.be.entity.OrderStatus;
import com.example.be.entity.Product;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.OrderRepository;
import com.example.be.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public AdminDashboardSummaryResponse getDashboardSummary(String range) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = resolveRangeStart(range, end);

        Double revenueValue = orderRepository.getTotalRevenue(start, end);
        Long totalOrders = orderRepository.getTotalOrders(start, end);
        Long totalCustomers = customerRepository.count();

        List<Product> lowStockProducts = productRepository.findLowStockProducts();
        List<AdminDashboardSummaryResponse.StockAlert> stockAlerts = lowStockProducts.stream()
                .sorted(Comparator.comparing(Product::getStock))
                .limit(10)
                .map(p -> AdminDashboardSummaryResponse.StockAlert.builder()
                        .productId(p.getId())
                        .productCode(p.getCode())
                        .productName(p.getName())
                        .stock(p.getStock())
                        .minStock(p.getMinStock())
                        .build())
                .collect(Collectors.toList());

        List<AdminDashboardSummaryResponse.RecentOrder> recentOrders = orderRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(o -> AdminDashboardSummaryResponse.RecentOrder.builder()
                        .id(o.getId())
                        .orderNumber(o.getOrderNumber())
                        .status(o.getStatus().name())
                        .total(o.getTotal())
                        .createdAt(o.getCreatedAt())
                        .customerName(o.getCustomer() != null ? o.getCustomer().getFullName() : null)
                        .build())
                .collect(Collectors.toList());

        return AdminDashboardSummaryResponse.builder()
                .totalRevenue(toBigDecimal(revenueValue))
                .totalOrders(totalOrders != null ? totalOrders : 0L)
                .totalCustomers(totalCustomers)
                .lowStockCount((long) lowStockProducts.size())
                .recentOrders(recentOrders)
                .stockAlerts(stockAlerts)
                .build();
    }

    @Transactional(readOnly = true)
    public AdminReportSummaryResponse getReportSummary(LocalDate fromDate, LocalDate toDate) {
        LocalDate resolvedToDate = toDate != null ? toDate : LocalDate.now();
        LocalDate resolvedFromDate = fromDate != null ? fromDate : resolvedToDate.minusDays(29);
        LocalDateTime from = resolvedFromDate.atStartOfDay();
        LocalDateTime to = resolvedToDate.plusDays(1).atStartOfDay().minusNanos(1);

        List<Order> orders = orderRepository.findByCreatedAtBetween(from, to);
        BigDecimal totalRevenue = orders.stream()
                .filter(order -> order.getStatus() == OrderStatus.PAID)
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrders = orders.stream().filter(order -> order.getStatus() == OrderStatus.PAID).count();
        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<Long, TopProductAccumulator> productMap = new HashMap<>();
        for (Order order : orders) {
            if (order.getStatus() != OrderStatus.PAID) {
                continue;
            }
            for (OrderItem item : order.getItems()) {
                TopProductAccumulator acc = productMap.computeIfAbsent(item.getProduct().getId(), key -> new TopProductAccumulator(
                        item.getProduct().getId(),
                        item.getProductCode(),
                        item.getProductName(),
                        0,
                        BigDecimal.ZERO
                ));
                acc.quantitySold += item.getQuantity();
                acc.revenue = acc.revenue.add(item.getSubtotal());
            }
        }

        List<AdminReportSummaryResponse.TopProduct> topProducts = new ArrayList<>(productMap.values()).stream()
                .sorted((a, b) -> Integer.compare(b.quantitySold, a.quantitySold))
                .limit(10)
                .map(acc -> AdminReportSummaryResponse.TopProduct.builder()
                        .productId(acc.productId)
                        .productCode(acc.productCode)
                        .productName(acc.productName)
                        .quantitySold(acc.quantitySold)
                        .revenue(acc.revenue)
                        .build())
                .collect(Collectors.toList());

        return AdminReportSummaryResponse.builder()
                .fromDate(resolvedFromDate)
                .toDate(resolvedToDate)
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalCustomers(customerRepository.count())
                .averageOrderValue(avgOrderValue)
                .topProducts(topProducts)
                .build();
    }

    private LocalDateTime resolveRangeStart(String range, LocalDateTime end) {
        if ("today".equalsIgnoreCase(range)) {
            return end.toLocalDate().atStartOfDay();
        }
        if ("month".equalsIgnoreCase(range)) {
            return end.toLocalDate().withDayOfMonth(1).atStartOfDay();
        }
        return end.minusDays(6).toLocalDate().atStartOfDay();
    }

    private BigDecimal toBigDecimal(Double value) {
        return value != null ? BigDecimal.valueOf(value) : BigDecimal.ZERO;
    }

    private static class TopProductAccumulator {
        private final Long productId;
        private final String productCode;
        private final String productName;
        private int quantitySold;
        private BigDecimal revenue;

        private TopProductAccumulator(Long productId, String productCode, String productName, int quantitySold, BigDecimal revenue) {
            this.productId = productId;
            this.productCode = productCode;
            this.productName = productName;
            this.quantitySold = quantitySold;
            this.revenue = revenue;
        }
    }
}
