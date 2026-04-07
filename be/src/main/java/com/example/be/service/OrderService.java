package com.example.be.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.CreateOrderRequest;
import com.example.be.dto.response.OrderResponse;
import com.example.be.dto.response.OrderTrackingResponse;
import com.example.be.entity.Customer;
import com.example.be.entity.CustomerTier;
import com.example.be.entity.Order;
import com.example.be.entity.OrderChannel;
import com.example.be.entity.OrderItem;
import com.example.be.entity.OrderStatus;
import com.example.be.entity.OrderStatusHistory;
import com.example.be.entity.Product;
import com.example.be.entity.ProductStatus;
import com.example.be.entity.ProductVariant;
import com.example.be.entity.Shipment;
import com.example.be.entity.ShipmentStatus;
import com.example.be.entity.User;
import com.example.be.entity.UserRole;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ErrorCode;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.money.MonetaryService;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.OrderRepository;
import com.example.be.repository.OrderStatusHistoryRepository;
import com.example.be.repository.ProductRepository;
import com.example.be.repository.ShipmentRepository;
import com.example.be.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private static final BigDecimal VIP_THRESHOLD = BigDecimal.valueOf(5_000_000);
    private static final int OUT_OF_STOCK_THRESHOLD = 0;

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final ShipmentRepository shipmentRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final OrderRealtimePublisher orderRealtimePublisher;
    private final MonetaryService monetaryService;

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .peek(this::checkAndAutoCompleteDelivery)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        // Auto-complete delivery nếu quá 3 ngày
        checkAndAutoCompleteDelivery(order);

        return mapToResponse(order);
    }

    public List<OrderResponse> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerId(customerId).stream()
                .peek(this::checkAndAutoCompleteDelivery)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getOrdersByCustomerEmail(String customerEmail) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Map<Long, Order> mergedOrders = new HashMap<>();

        orderRepository.findByCustomerId(customer.getId())
                .forEach(order -> mergedOrders.put(order.getId(), order));

        if (customer.getPhone() != null && !customer.getPhone().isBlank()) {
            orderRepository.findByCustomerPhone(customer.getPhone())
                    .forEach(order -> mergedOrders.put(order.getId(), order));
        }

        return mergedOrders.values().stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .peek(this::checkAndAutoCompleteDelivery)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status).stream()
                .peek(this::checkAndAutoCompleteDelivery)
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

        return createOrderInternal(request, customer, createdBy, OrderStatus.PAID, OrderChannel.OFFLINE);
    }

    @Transactional(rollbackFor = Exception.class)
    public OrderResponse createOrderForCustomer(CreateOrderRequest request, String customerEmail) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        User createdBy = resolveCreatedByForCustomer();

        return createOrderInternal(request, customer, createdBy, OrderStatus.PENDING, OrderChannel.ONLINE);
    }

    private User resolveCreatedByForCustomer() {
        List<User> salesUsers = userRepository.findByRole(UserRole.SALES);
        if (!salesUsers.isEmpty()) {
            return salesUsers.get(0);
        }

        List<User> managerUsers = userRepository.findByRole(UserRole.MANAGER);
        if (!managerUsers.isEmpty()) {
            return managerUsers.get(0);
        }

        throw new BadRequestException(ErrorCode.STAFF_FALLBACK_NOT_AVAILABLE,
                "No active staff user available to create order");
    }

    private OrderResponse createOrderInternal(
            CreateOrderRequest request,
            Customer customer,
            User createdBy,
            OrderStatus initialStatus,
            OrderChannel channel) {

        boolean shouldDeductStockNow = channel == OrderChannel.OFFLINE;
        Map<String, Integer> reservedStockMap = buildOnlineReservationSnapshot();
        Map<String, Integer> currentRequestReserved = new HashMap<>();

        // Generate order number
        String orderNumber = generateOrderNumber();

        // Create order
        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setCustomer(customer);
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discount = monetaryService.normalize(request.getDiscount());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setStatus(initialStatus);
        order.setChannel(channel);
        order.setCreatedBy(createdBy);
        order.setNotes(request.getNotes());

        // Create order items
        List<OrderItem> items = new ArrayList<>();
        for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with id: " + itemReq.getProductId()));

            Integer requestedQuantity = itemReq.getQuantity();
            int requiredQty = requestedQuantity != null ? requestedQuantity : 0;
            int reservedProduct = getReservedWithCurrentRequest(
                    reservedStockMap,
                    currentRequestReserved,
                    productReservationKey(product.getId()));
            int availableProduct = product.getStock() - reservedProduct;

            if (availableProduct < requiredQty) {
                throw new BadRequestException(ErrorCode.STOCK_INSUFFICIENT,
                        "Insufficient stock for product: " + product.getName());
            }

            if (!product.getVariants().isEmpty()) {
                String requestedSize = normalizeSize(itemReq.getSize());
                String requestedColor = normalizeColor(itemReq.getColor());

                ProductVariant matchedVariant = product.getVariants().stream()
                        .filter(variant -> normalizeSize(variant.getSize()).equals(requestedSize)
                                && normalizeColor(variant.getColor()).equals(requestedColor))
                        .findFirst()
                        .orElseThrow(() -> new BadRequestException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND,
                                "Product variant not found for " + product.getName() + " (size=" + itemReq.getSize()
                                        + ", color=" + itemReq.getColor() + ")"));

                int reservedVariant = getReservedWithCurrentRequest(
                        reservedStockMap,
                        currentRequestReserved,
                        variantReservationKey(product.getId(), itemReq.getSize(), itemReq.getColor()));
                int availableVariant = matchedVariant.getStock() - reservedVariant;
                if (availableVariant < requiredQty) {
                    throw new BadRequestException(ErrorCode.STOCK_INSUFFICIENT,
                            "Insufficient stock for variant: " + product.getName() + " ("
                                    + matchedVariant.getSize() + "/" + matchedVariant.getColor() + ")");
                }

                if (shouldDeductStockNow) {
                    matchedVariant.setStock(matchedVariant.getStock() - itemReq.getQuantity());
                } else {
                    increaseCurrentRequestReserved(currentRequestReserved,
                            variantReservationKey(product.getId(), itemReq.getSize(), itemReq.getColor()),
                            requiredQty);
                }
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setProductCode(product.getCode());
            item.setProductName(product.getName());
            item.setPrice(product.getPrice());
            item.setQuantity(itemReq.getQuantity());
            item.setSubtotal(monetaryService.computeLineSubtotal(product.getPrice(), itemReq.getQuantity()));
            item.setSize(itemReq.getSize());
            item.setColor(itemReq.getColor());

            items.add(item);
            subtotal = monetaryService.add(subtotal, item.getSubtotal());

            if (shouldDeductStockNow) {
                // Offline/POS orders deduct stock immediately.
                product.setStock(product.getStock() - itemReq.getQuantity());
                if (product.getStock() <= OUT_OF_STOCK_THRESHOLD) {
                    product.setStatus(ProductStatus.OUT_OF_STOCK);
                }
                productRepository.save(product);
            } else {
                increaseCurrentRequestReserved(currentRequestReserved, productReservationKey(product.getId()),
                        requiredQty);
            }
        }
        MonetaryService.OrderAmountSummary amounts = monetaryService.summarizeOrder(subtotal, discount);
        order.setSubtotal(amounts.subtotal());
        order.setDiscount(amounts.discount());
        order.setTotal(amounts.total());
        order.setItems(items);
        order.setStockDeducted(shouldDeductStockNow);
        Order saved = orderRepository.save(order);
        appendStatusHistory(saved, null, saved.getStatus(), "Order created", "SYSTEM", createdBy.getId());

        // Update customer stats if exists
        if (customer != null) {
            customer.setTotalOrders(customer.getTotalOrders() + 1);
            customer.setTotalSpent(customer.getTotalSpent().add(saved.getTotal()));
            customer.setLastOrderAt(LocalDateTime.now());

            // Upgrade to VIP if total spent > 5,000,000
            if (customer.getTotalSpent().compareTo(VIP_THRESHOLD) > 0) {
                customer.setTier(CustomerTier.VIP);
            }
            customerRepository.save(customer);
        }

        return mapToResponse(saved);
    }

    private Map<String, Integer> buildOnlineReservationSnapshot() {
        Map<String, Integer> reserved = new HashMap<>();
        for (Order existingOrder : orderRepository.findAll()) {
            if (!isReservationActive(existingOrder)) {
                continue;
            }
            List<OrderItem> items = existingOrder.getItems() == null ? List.of() : existingOrder.getItems();
            for (OrderItem item : items) {
                if (item.getProduct() == null || item.getProduct().getId() == null || item.getQuantity() == null) {
                    continue;
                }
                increaseCurrentRequestReserved(reserved, productReservationKey(item.getProduct().getId()),
                        item.getQuantity());
                increaseCurrentRequestReserved(reserved,
                        variantReservationKey(item.getProduct().getId(), item.getSize(), item.getColor()),
                        item.getQuantity());
            }
        }
        return reserved;
    }

    private boolean isReservationActive(Order order) {
        if (order == null) {
            return false;
        }
        if (order.getChannel() != OrderChannel.ONLINE) {
            return false;
        }
        if (Boolean.TRUE.equals(order.getStockDeducted())) {
            return false;
        }

        OrderStatus status = normalizeOrderStatus(order.getStatus());
        return status != OrderStatus.CANCELLED
                && status != OrderStatus.COMPLETED
                && status != OrderStatus.REFUNDED
                && status != OrderStatus.RETURN_RECEIVED
                && status != OrderStatus.RETURN_REJECTED
                && status != OrderStatus.FAILED_DELIVERY;
    }

    private int getReservedWithCurrentRequest(Map<String, Integer> reservedMap,
            Map<String, Integer> currentRequestReserved,
            String key) {
        return reservedMap.getOrDefault(key, 0) + currentRequestReserved.getOrDefault(key, 0);
    }

    private void increaseCurrentRequestReserved(Map<String, Integer> map, String key, int quantity) {
        map.put(key, map.getOrDefault(key, 0) + quantity);
    }

    private String productReservationKey(Long productId) {
        return "P|" + productId;
    }

    private String variantReservationKey(Long productId, String size, String color) {
        return "V|" + productId + "|" + normalizeSize(size) + "|" + normalizeColor(color);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus status) {
        return updateOrderStatus(id, status, null, "STAFF", null);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus status, String reason, String actorType,
            String actorEmail) {
        if (status == null) {
            throw new BadRequestException(ErrorCode.ORDER_STATUS_REQUIRED, "Order status is required");
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        OrderStatus currentStatus = normalizeOrderStatus(order.getStatus());
        if (order.getStatus() == null) {
            order.setStatus(currentStatus);
        }
        validateStatusTransition(currentStatus, status);

        if (order.getChannel() == OrderChannel.ONLINE
                && status == OrderStatus.CONFIRMED
                && !Boolean.TRUE.equals(order.getStockDeducted())) {
            try {
                deductStockForOrder(order);
                order.setStockDeducted(true);
            } catch (BadRequestException ex) {
                String lowered = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase(Locale.ROOT);
                if (lowered.contains("insufficient stock")) {
                    String apology = "Xin loi quy khach, don hang khong du ton kho nen da duoc huy boi cua hang.";
                    String existingNotes = order.getNotes() == null ? "" : order.getNotes().trim();
                    order.setStatus(OrderStatus.CANCELLED);
                    order.setNotes(existingNotes.isEmpty() ? apology : existingNotes + " | " + apology);
                    Order cancelled = orderRepository.save(order);

                    Long actorId = null;
                    if (actorEmail != null && !actorEmail.isBlank()) {
                        actorId = userRepository.findByEmail(actorEmail)
                                .map(User::getId)
                                .orElse(null);
                    }
                    appendStatusHistory(cancelled, currentStatus, OrderStatus.CANCELLED,
                            "Cancelled due insufficient stock", actorType, actorId);
                    throw new BadRequestException(ErrorCode.STOCK_INSUFFICIENT,
                            "Insufficient stock. Order has been cancelled and customer notified.");
                }
                throw ex;
            }
        }

        String effectiveReason = reason;
        if (status == OrderStatus.CANCELLED
                && order.getChannel() == OrderChannel.ONLINE
                && "STAFF".equalsIgnoreCase(actorType)
                && (effectiveReason == null || effectiveReason.trim().isEmpty())) {
            effectiveReason = "Xin loi quy khach, don hang da duoc cua hang huy.";
        }

        order.setStatus(status);
        if (status == OrderStatus.CANCELLED && effectiveReason != null && !effectiveReason.trim().isEmpty()) {
            String normalizedReason = effectiveReason.trim();
            String existingNotes = order.getNotes() == null ? "" : order.getNotes().trim();
            if (existingNotes.isEmpty()) {
                order.setNotes(normalizedReason);
            } else if (!existingNotes.contains(normalizedReason)) {
                order.setNotes(existingNotes + " | " + normalizedReason);
            }
        }

        // Track mốc bắt đầu giao hàng để hỗ trợ auto-complete sau 3 ngày.
        if ((status == OrderStatus.IN_TRANSIT || status == OrderStatus.OUT_FOR_DELIVERY)
                && order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        Order updated = orderRepository.save(order);

        // Resolve actor ID from email if provided
        Long actorId = null;
        if (actorEmail != null && !actorEmail.isBlank()) {
            actorId = userRepository.findByEmail(actorEmail)
                    .map(User::getId)
                    .orElse(null);
        }

        appendStatusHistory(updated, currentStatus, status, effectiveReason, actorType, actorId);

        if (status == OrderStatus.IN_TRANSIT || status == OrderStatus.OUT_FOR_DELIVERY
                || status == OrderStatus.DELIVERED) {
            upsertShipment(updated, status);
        }

        return mapToResponse(updated);
    }

    @Transactional
    public OrderResponse requestOrderCancellation(Long id, String customerEmail, String reason) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        if (order.getCustomer() == null || !order.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException(ErrorCode.ORDER_OWNERSHIP_MISMATCH, "You can only cancel your own orders");
        }

        String normalizedReason = reason == null ? "" : reason.trim();
        if (normalizedReason.isEmpty()) {
            throw new BadRequestException(ErrorCode.ORDER_CANCELLATION_REASON_REQUIRED,
                    "Cancellation reason is required");
        }

        OrderStatus previous = normalizeOrderStatus(order.getStatus());
        if (order.getStatus() == null) {
            order.setStatus(previous);
        }

        // Kiểm tra các trạng thái không được phép hủy
        if (previous == OrderStatus.CANCELLED) {
            throw new BadRequestException(ErrorCode.ORDER_ALREADY_CANCELLED, "Order is already cancelled");
        }

        if (previous == OrderStatus.COMPLETED || previous == OrderStatus.REFUNDED) {
            throw new BadRequestException(ErrorCode.ORDER_CANCELLATION_NOT_ALLOWED,
                    "This order cannot be cancelled at this stage");
        }

        // Không được hủy khi đơn đang được giao (IN_TRANSIT)
        if (previous == OrderStatus.IN_TRANSIT || previous == OrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException(ErrorCode.ORDER_CANCELLATION_IN_DELIVERY_NOT_ALLOWED,
                    "Cannot cancel order while it is being delivered");
        }

        validateStatusTransition(previous, OrderStatus.CANCEL_REQUESTED);
        order.setStatus(OrderStatus.CANCEL_REQUESTED);
        order.setNotes("Yeu cau huy: " + normalizedReason);

        Order updated = orderRepository.save(order);
        Long customerActorId = resolveActorUserId(customerEmail);
        appendStatusHistory(updated, previous, OrderStatus.CANCEL_REQUESTED, normalizedReason, "CUSTOMER",
                customerActorId);
        return mapToResponse(updated);
    }

    @Transactional
    public OrderResponse revokeOrderCancellationRequest(Long id, String customerEmail) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        if (order.getCustomer() == null || !order.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException(ErrorCode.ORDER_OWNERSHIP_MISMATCH, "You can only update your own orders");
        }

        OrderStatus previous = normalizeOrderStatus(order.getStatus());
        if (previous != OrderStatus.CANCEL_REQUESTED) {
            throw new BadRequestException(ErrorCode.ORDER_CANCEL_REQUEST_NOT_PENDING,
                    "Order is not waiting for cancellation approval");
        }

        order.setStatus(OrderStatus.CONFIRMED);
        Order updated = orderRepository.save(order);
        Long customerActorId = resolveActorUserId(customerEmail);
        appendStatusHistory(updated, previous, OrderStatus.CONFIRMED, "Customer revoked cancellation request",
                "CUSTOMER", customerActorId);
        return mapToResponse(updated);
    }

    @Transactional
    public OrderResponse requestOrderReturn(Long id, String customerEmail, String reason) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        if (order.getCustomer() == null || !order.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException(ErrorCode.ORDER_OWNERSHIP_MISMATCH, "You can only return your own orders");
        }

        OrderStatus previous = normalizeOrderStatus(order.getStatus());
        if (previous != OrderStatus.IN_TRANSIT && previous != OrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException(ErrorCode.ORDER_RETURN_NOT_ALLOWED,
                    "Refund request is only allowed while order is being delivered");
        }
        validateStatusTransition(previous, OrderStatus.RETURN_REQUESTED);
        order.setStatus(OrderStatus.RETURN_REQUESTED);
        String normalizedReason = reason == null ? "" : reason.trim();
        order.setNotes("Yeu cau hoan don: " + normalizedReason);

        Order updated = orderRepository.save(order);
        Long customerActorId = resolveActorUserId(customerEmail);
        appendStatusHistory(updated, previous, OrderStatus.RETURN_REQUESTED, normalizedReason, "CUSTOMER",
                customerActorId);
        return mapToResponse(updated);
    }

    @Transactional
    public OrderResponse confirmOrderCompletion(Long id, String customerEmail) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        if (order.getCustomer() == null || !order.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException(ErrorCode.ORDER_OWNERSHIP_MISMATCH, "You can only confirm your own orders");
        }

        OrderStatus previous = normalizeOrderStatus(order.getStatus());
        if (previous != OrderStatus.IN_TRANSIT && previous != OrderStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException(ErrorCode.ORDER_CONFIRMATION_NOT_ALLOWED, "Order is not in shipping state");
        }

        order.setStatus(OrderStatus.COMPLETED);
        if (order.getDeliveredAt() == null) {
            order.setDeliveredAt(LocalDateTime.now());
        }

        Order updated = orderRepository.save(order);
        Long customerActorId = resolveActorUserId(customerEmail);
        appendStatusHistory(updated, previous, OrderStatus.COMPLETED, "Customer confirmed delivery", "CUSTOMER",
                customerActorId);
        return mapToResponse(updated);
    }

    private Long resolveActorUserId(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public OrderTrackingResponse getOrderTracking(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        return buildTrackingResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderTrackingResponse getOrderTrackingForCustomer(Long id, String customerEmail) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        if (order.getCustomer() == null || !order.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException(ErrorCode.ORDER_OWNERSHIP_MISMATCH, "You can only track your own orders");
        }

        return buildTrackingResponse(order);
    }

    private String generateOrderNumber() {
        return "ORD" + System.currentTimeMillis();
    }

    private String generateTrackingCode(Order order) {
        return "TRK" + order.getOrderNumber();
    }

    private void appendStatusHistory(Order order, OrderStatus fromStatus, OrderStatus toStatus, String reason,
            String actorType, Long actorId) {
        try {
            OrderStatusHistory history = new OrderStatusHistory();
            history.setOrder(order);
            history.setFromStatus(fromStatus);
            history.setToStatus(toStatus);
            history.setReason(reason == null || reason.isBlank() ? "Status updated" : reason.trim());
            history.setActorType(actorType == null || actorType.isBlank() ? "SYSTEM" : actorType);
            history.setActorId(actorId);
            orderStatusHistoryRepository.save(history);
        } catch (RuntimeException ex) {
            logger.warn("Unable to persist order status history for order {}", order.getId(), ex);
        }

        try {
            orderRealtimePublisher.publishStatusChanged(order);
        } catch (RuntimeException ex) {
            logger.warn("Unable to publish order realtime update for order {}", order.getId(), ex);
        }
    }

    private void upsertShipment(Order order, OrderStatus status) {
        try {
            Shipment shipment = shipmentRepository.findByOrderId(order.getId()).orElseGet(() -> {
                Shipment created = new Shipment();
                created.setOrder(order);
                created.setProvider("INTERNAL");
                created.setTrackingCode(generateTrackingCode(order));
                return created;
            });

            shipment.setShipmentStatus(toShipmentStatus(status));
            shipmentRepository.save(shipment);
        } catch (RuntimeException ex) {
            logger.warn("Unable to upsert shipment for order {}", order.getId(), ex);
        }
    }

    private ShipmentStatus toShipmentStatus(OrderStatus status) {
        if (status == OrderStatus.OUT_FOR_DELIVERY) {
            return ShipmentStatus.OUT_FOR_DELIVERY;
        }
        if (status == OrderStatus.DELIVERED || status == OrderStatus.COMPLETED || status == OrderStatus.PAID) {
            return ShipmentStatus.DELIVERED;
        }
        if (status == OrderStatus.FAILED_DELIVERY) {
            return ShipmentStatus.RETURNING;
        }
        return ShipmentStatus.IN_TRANSIT;
    }

    private OrderTrackingResponse buildTrackingResponse(Order order) {
        Shipment shipment = null;
        try {
            shipment = shipmentRepository.findByOrderId(order.getId()).orElse(null);
        } catch (RuntimeException ex) {
            logger.warn("Unable to load shipment for order {}", order.getId(), ex);
        }

        List<OrderTrackingResponse.TrackingStep> timeline = List.of();
        try {
            timeline = orderStatusHistoryRepository
                    .findByOrderIdOrderByCreatedAtAsc(order.getId())
                    .stream()
                    .map(item -> OrderTrackingResponse.TrackingStep.builder()
                            .fromStatus(item.getFromStatus() == null ? null : item.getFromStatus().name())
                            .toStatus(item.getToStatus().name())
                            .reason(item.getReason())
                            .actorType(item.getActorType())
                            .actorId(item.getActorId())
                            .createdAt(item.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());
        } catch (RuntimeException ex) {
            logger.warn("Unable to load order status timeline for order {}", order.getId(), ex);
        }

        return OrderTrackingResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .currentStatus(order.getStatus().name())
                .shipmentProvider(shipment == null ? null : shipment.getProvider())
                .trackingCode(shipment == null ? null : shipment.getTrackingCode())
                .shipmentStatus(shipment == null ? null : shipment.getShipmentStatus().name())
                .timeline(timeline)
                .build();
    }

    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus nextStatus) {
        currentStatus = normalizeOrderStatus(currentStatus);

        if (currentStatus == nextStatus) {
            return;
        }

        Set<OrderStatus> allowed = switch (currentStatus) {
            case PENDING -> EnumSet.of(OrderStatus.CONFIRMED, OrderStatus.CANCEL_REQUESTED, OrderStatus.CANCELLED,
                    OrderStatus.PAID);
            case CONFIRMED -> EnumSet.of(OrderStatus.PACKING, OrderStatus.CANCEL_REQUESTED, OrderStatus.CANCELLED);
            case PACKING -> EnumSet.of(OrderStatus.READY_TO_SHIP, OrderStatus.CANCEL_REQUESTED, OrderStatus.CANCELLED);
            case READY_TO_SHIP -> EnumSet.of(OrderStatus.IN_TRANSIT, OrderStatus.CANCEL_REQUESTED);
            // IN_TRANSIT: Không cho phép hủy đơn hàng ở trạng thái này
            case IN_TRANSIT -> EnumSet.of(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED_DELIVERY,
                    OrderStatus.COMPLETED, OrderStatus.RETURN_REQUESTED);
            case OUT_FOR_DELIVERY -> EnumSet.of(OrderStatus.DELIVERED, OrderStatus.FAILED_DELIVERY,
                    OrderStatus.COMPLETED, OrderStatus.RETURN_REQUESTED);
            case DELIVERED -> EnumSet.of(OrderStatus.COMPLETED);
            case COMPLETED -> EnumSet.noneOf(OrderStatus.class);
            case CANCEL_REQUESTED -> EnumSet.of(OrderStatus.CANCELLED, OrderStatus.CONFIRMED);
            // Return flow: RETURN_REQUESTED -> RETURN_APPROVED -> CANCELLED (hoàn tiền cho
            // khách)
            case RETURN_REQUESTED -> EnumSet.of(OrderStatus.RETURN_APPROVED, OrderStatus.RETURN_REJECTED);
            case RETURN_APPROVED -> EnumSet.of(OrderStatus.CANCELLED);
            case RETURN_REJECTED -> EnumSet.noneOf(OrderStatus.class);
            case PAID -> EnumSet.of(OrderStatus.COMPLETED, OrderStatus.RETURN_REQUESTED, OrderStatus.CANCELLED,
                    OrderStatus.IN_TRANSIT, OrderStatus.CANCEL_REQUESTED);
            // Legacy states (no transitions allowed)
            case CANCELLED, REFUNDED, FAILED_DELIVERY, RETURN_RECEIVED, REFUND_PENDING ->
                EnumSet.noneOf(OrderStatus.class);
        };

        if (!allowed.contains(nextStatus)) {
            throw new BadRequestException(ErrorCode.ORDER_STATUS_TRANSITION_INVALID,
                    "Invalid order status transition: " + currentStatus.name() + " -> " + nextStatus.name());
        }
    }

    private OrderStatus normalizeOrderStatus(OrderStatus status) {
        return status == null ? OrderStatus.PENDING : status;
    }

    private void deductStockForOrder(Order order) {
        List<OrderItem> items = order.getItems() == null ? List.of() : order.getItems();
        for (OrderItem item : items) {
            if (item.getProduct() == null || item.getProduct().getId() == null) {
                throw new BadRequestException(ErrorCode.ORDER_ITEM_PRODUCT_MISSING, "Order item product is missing");
            }

            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with id: " + item.getProduct().getId()));

            Integer quantityValue = item.getQuantity();
            int quantity = quantityValue != null ? quantityValue : 0;
            if (quantity <= 0) {
                throw new BadRequestException(ErrorCode.ORDER_ITEM_QUANTITY_INVALID,
                        "Order item quantity must be greater than 0");
            }

            if (product.getStock() < quantity) {
                throw new BadRequestException(ErrorCode.STOCK_INSUFFICIENT,
                        "Insufficient stock for product: " + product.getName());
            }

            if (!product.getVariants().isEmpty()) {
                String requestedSize = normalizeSize(item.getSize());
                String requestedColor = normalizeColor(item.getColor());

                ProductVariant matchedVariant = product.getVariants().stream()
                        .filter(variant -> normalizeSize(variant.getSize()).equals(requestedSize)
                                && normalizeColor(variant.getColor()).equals(requestedColor))
                        .findFirst()
                        .orElseThrow(() -> new BadRequestException(ErrorCode.PRODUCT_VARIANT_NOT_FOUND,
                                "Product variant not found for " + product.getName() + " (size=" + item.getSize()
                                        + ", color=" + item.getColor() + ")"));

                if (matchedVariant.getStock() < quantity) {
                    throw new BadRequestException(ErrorCode.STOCK_INSUFFICIENT,
                            "Insufficient stock for variant: " + product.getName() + " ("
                                    + matchedVariant.getSize() + "/" + matchedVariant.getColor() + ")");
                }

                matchedVariant.setStock(matchedVariant.getStock() - quantity);
            }

            product.setStock(product.getStock() - quantity);
            if (product.getStock() <= OUT_OF_STOCK_THRESHOLD) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            }
            productRepository.save(product);
        }
    }

    private String normalizeSize(String size) {
        return size == null ? "" : size.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeColor(String color) {
        return color == null ? "" : color.trim().toLowerCase(Locale.ROOT);
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

        List<OrderResponse.OrderItemResponse> items = (order.getItems() == null ? List.<OrderItem>of()
                : order.getItems())
                .stream()
                .map(item -> OrderResponse.OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() == null ? null : item.getProduct().getId())
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
                .paymentMethod(order.getPaymentMethod() == null ? null : order.getPaymentMethod().name())
                .status(normalizeOrderStatus(order.getStatus()).name())
                .channel(order.getChannel() == null ? OrderChannel.OFFLINE.name() : order.getChannel().name())
                .createdByName(order.getCreatedBy() == null ? "SYSTEM" : order.getCreatedBy().getFullName())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .deliveredAt(order.getDeliveredAt())
                .build();
    }

    /**
     * Auto-complete đơn hàng nếu ở trạng thái đang giao quá 3 ngày và
     * customer chưa xác nhận hoàn tất.
     */
    @Transactional
    private void checkAndAutoCompleteDelivery(Order order) {
        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY && order.getStatus() != OrderStatus.IN_TRANSIT) {
            return;
        }

        if (order.getDeliveredAt() == null) {
            return;
        }

        // Kiểm tra nếu đã quá 3 ngày
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thresholdTime = order.getDeliveredAt().plusDays(3);

        if (now.isAfter(thresholdTime)) {
            OrderStatus previous = normalizeOrderStatus(order.getStatus());
            // Tự động chuyển sang COMPLETED nếu quá hạn.
            order.setStatus(OrderStatus.COMPLETED);
            orderRepository.save(order);
            appendStatusHistory(order, previous, OrderStatus.COMPLETED,
                    "Auto-completed after 3 days without customer confirmation", "SYSTEM", null);
        }
    }
}
