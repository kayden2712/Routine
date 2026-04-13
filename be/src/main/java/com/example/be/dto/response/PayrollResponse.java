package com.example.be.dto.response;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollResponse {
    @JsonProperty("payroll_id")
    private Long payrollId;
    private Integer month;
    private Integer year;
    private String status;
    @JsonProperty("total_net")
    private Long totalNet;
    private List<PayrollEntryResponse> entries = new ArrayList<>();
}
