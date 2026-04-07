package com.example.be.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.example.be.dto.response.OrderStatusChangedEvent;
import com.example.be.entity.Order;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
@SuppressWarnings("null")
public class OrderRealtimePublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishStatusChanged(Order order) {
        if (order == null || order.getId() == null) {
            return;
        }

        messagingTemplate.convertAndSend("/topic/orders/status-changed", OrderStatusChangedEvent.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus() == null ? null : order.getStatus().name())
                .updatedAt(order.getUpdatedAt())
                .build());
    }
}
