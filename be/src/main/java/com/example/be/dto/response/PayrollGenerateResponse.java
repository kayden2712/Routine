package com.example.be.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollGenerateResponse {
    @JsonProperty("payroll_id")
    private Long payrollId;
    private String status;
    @JsonProperty("total_net")
    private Long totalNet;
}
