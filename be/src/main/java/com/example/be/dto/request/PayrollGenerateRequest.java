package com.example.be.dto.request;

import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayrollGenerateRequest {

    @NotNull(message = "month is required")
    @Min(value = 1, message = "month must be from 1 to 12")
    @Max(value = 12, message = "month must be from 1 to 12")
    private Integer month;

    @NotNull(message = "year is required")
    @Min(value = 2000, message = "year is invalid")
    private Integer year;

    private Boolean overwrite;

    @Valid
    private List<PayrollEntryRequest> entries = new ArrayList<>();
}
