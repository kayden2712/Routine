package com.example.be.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.example.be.dto.response.OrderStatusChangedEvent;
import com.example.be.entity.Order;
import com.example.be.entity.OrderStatus;

@ExtendWith(MockitoExtension.class)
class OrderRealtimePublisherTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private OrderRealtimePublisher orderRealtimePublisher;

    @Test
    void publishStatusChangedSkipsWhenOrderInvalid() {
        orderRealtimePublisher.publishStatusChanged(null);

        Order orderWithoutId = new Order();
        orderRealtimePublisher.publishStatusChanged(orderWithoutId);

        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void publishStatusChangedPublishesEvent() {
        Order order = new Order();
        order.setId(11L);
        order.setOrderNumber("ORD-11");
        order.setStatus(OrderStatus.CONFIRMED);

        orderRealtimePublisher.publishStatusChanged(order);

        ArgumentCaptor<OrderStatusChangedEvent> eventCaptor = ArgumentCaptor.forClass(OrderStatusChangedEvent.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/orders/status-changed"), eventCaptor.capture());
        OrderStatusChangedEvent event = eventCaptor.getValue();
        org.junit.jupiter.api.Assertions.assertEquals(11L, event.getOrderId());
        org.junit.jupiter.api.Assertions.assertEquals("ORD-11", event.getOrderNumber());
        org.junit.jupiter.api.Assertions.assertEquals("CONFIRMED", event.getStatus());
    }
}
