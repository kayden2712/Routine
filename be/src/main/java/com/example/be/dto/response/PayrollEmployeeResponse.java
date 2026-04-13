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
public class PayrollEmployeeResponse {
    private Long id;
    private String name;
    private String type;
    @JsonProperty("base_salary")
    private Long baseSalary;
    private String dept;
    private String status;
}
