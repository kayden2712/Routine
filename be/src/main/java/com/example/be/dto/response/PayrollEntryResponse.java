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
public class PayrollEntryResponse {
    @JsonProperty("employee_id")
    private Long employeeId;
    @JsonProperty("employee_name")
    private String employeeName;
    private String type;
    @JsonProperty("base_salary")
    private Long baseSalary;
    @JsonProperty("hours_worked")
    private Integer hoursWorked;
    @JsonProperty("hourly_rate")
    private Long hourlyRate;
    @JsonProperty("gross_salary")
    private Long grossSalary;
    private Long bonus;
    private Long penalty;
    @JsonProperty("net_salary")
    private Long netSalary;
}
