package com.example.be.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayrollEntryRequest {

    @JsonProperty("employee_id")
    @JsonAlias({ "employeeId" })
    @NotNull(message = "employee_id is required")
    private Long employeeId;

    @NotBlank(message = "type is required")
    private String type;

    @JsonProperty("hours_worked")
    @JsonAlias({ "hoursWorked" })
    @Min(value = 0, message = "hours_worked must be >= 0")
    private Integer hoursWorked;

    @JsonProperty("hourly_rate")
    @JsonAlias({ "hourlyRate" })
    @Min(value = 0, message = "hourly_rate must be >= 0")
    private Long hourlyRate;

    @Min(value = 0, message = "bonus must be >= 0")
    private Long bonus;

    @Min(value = 0, message = "penalty must be >= 0")
    private Long penalty;
}
