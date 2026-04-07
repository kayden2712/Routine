package com.example.be.dto.response;

import java.util.List;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckPromotionResponse {
    private Boolean hasApplicablePromotions;
    private List<PromotionResponse> applicablePromotions;
    private String message;
}
