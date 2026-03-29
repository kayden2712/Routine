package com.example.be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String refreshToken;
    @Builder.Default
    private String type = "Bearer";
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String phone;
    private String tier;
    private String branch;
    private String address;
    private String district;
    private String city;
}
