package com.example.be.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderTrackingResponse {
    private Long orderId;
    private String orderNumber;
    private String currentStatus;
    private String shipmentProvider;
    private String trackingCode;
    private String shipmentStatus;
    private List<TrackingStep> timeline;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrackingStep {
        private String fromStatus;
        private String toStatus;
        private String reason;
        private String actorType;
        private Long actorId;
        private LocalDateTime createdAt;
    }
}
