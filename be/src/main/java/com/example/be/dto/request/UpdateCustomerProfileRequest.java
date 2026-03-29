package com.example.be.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCustomerProfileRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone is required")
    private String phone;

    @Size(max = 500, message = "Address is too long")
    private String address;

    @Size(max = 100, message = "District is too long")
    private String district;

    @Size(max = 100, message = "City is too long")
    private String city;
}
