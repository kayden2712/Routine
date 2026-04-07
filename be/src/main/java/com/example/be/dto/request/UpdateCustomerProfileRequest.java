package com.example.be.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
    @Pattern(regexp = "^0\\d{9}$", message = "Phone must be exactly 10 digits and start with 0")
    private String phone;

    @Size(max = 500, message = "Address is too long")
    private String address;

    @Size(max = 100, message = "District is too long")
    private String district;

    @Size(max = 100, message = "City is too long")
    private String city;
}
