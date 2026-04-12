package com.example.be.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import com.example.be.dto.response.AuthResponse;
import com.example.be.exception.GlobalExceptionHandler;
import com.example.be.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AuthControllerIntegrationTest {

        private MockMvc mockMvc;

        @Mock
        private AuthService authService;

        @InjectMocks
        private AuthController authController;

        private final ObjectMapper objectMapper = new ObjectMapper();

        @BeforeEach
        @SuppressWarnings("unused")
        void setUp() {
                LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
                validator.afterPropertiesSet();

                mockMvc = MockMvcBuilders.standaloneSetup(authController)
                                .setControllerAdvice(new GlobalExceptionHandler())
                                .setValidator(validator)
                                .build();
        }

        @Test
        void loginAdminReturnsSuccessResponseWithToken() throws Exception {
                AuthResponse authResponse = AuthResponse.builder()
                                .token("access-token")
                                .refreshToken("refresh-token")
                                .type("Bearer")
                                .id(1L)
                                .email("manager@routine.vn")
                                .fullName("Routine Manager")
                                .role("MANAGER")
                                .build();

                when(authService.loginUser(any())).thenReturn(authResponse);

                mockMvc.perform(post("/auth/admin/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                                new LoginPayload("manager@routine.vn", "Password@123"))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Login successful"))
                                .andExpect(jsonPath("$.data.token").value("access-token"))
                                .andExpect(jsonPath("$.data.refreshToken").value("refresh-token"))
                                .andExpect(jsonPath("$.data.role").value("MANAGER"));

                verify(authService).loginUser(any());
        }

        @Test
        void loginAdminReturnsBadRequestWhenPayloadInvalid() throws Exception {
                mockMvc.perform(post("/auth/admin/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new LoginPayload("", "123"))))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                                .andExpect(jsonPath("$.message").value("Validation failed"))
                                .andExpect(jsonPath("$.data.email").value("Email is required"))
                                .andExpect(jsonPath("$.data.password").value("Mật khẩu phải có ít nhất 6 ký tự"));

                verifyNoInteractions(authService);
        }

        @Test
        void loginCustomerReturnsSuccessResponseWithToken() throws Exception {
                AuthResponse authResponse = AuthResponse.builder()
                                .token("customer-access-token")
                                .refreshToken("customer-refresh-token")
                                .type("Bearer")
                                .id(10L)
                                .email("customer@routine.vn")
                                .fullName("Routine Customer")
                                .role("CUSTOMER")
                                .build();

                when(authService.loginCustomer(any())).thenReturn(authResponse);

                mockMvc.perform(post("/auth/customer/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                                new LoginPayload("customer@routine.vn", "Password@123"))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Login successful"))
                                .andExpect(jsonPath("$.data.token").value("customer-access-token"))
                                .andExpect(jsonPath("$.data.refreshToken").value("customer-refresh-token"))
                                .andExpect(jsonPath("$.data.role").value("CUSTOMER"));

                verify(authService).loginCustomer(any());
        }

        @Test
        void registerCustomerReturnsSuccessResponse() throws Exception {
                AuthResponse authResponse = AuthResponse.builder()
                                .token("new-customer-token")
                                .refreshToken("new-customer-refresh")
                                .id(20L)
                                .email("newcustomer@routine.vn")
                                .fullName("New Customer")
                                .role("CUSTOMER")
                                .phone("0901234567")
                                .build();

                when(authService.registerCustomer(any())).thenReturn(authResponse);

                mockMvc.perform(post("/auth/customer/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new RegisterCustomerPayload(
                                                "newcustomer@routine.vn",
                                                "Password@123",
                                                "New Customer",
                                                "0901234567"))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Customer registered successfully"))
                                .andExpect(jsonPath("$.data.email").value("newcustomer@routine.vn"))
                                .andExpect(jsonPath("$.data.role").value("CUSTOMER"));

                verify(authService).registerCustomer(any());
        }

        @Test
        void registerCustomerReturnsBadRequestWhenPasswordWeak() throws Exception {
                mockMvc.perform(post("/auth/customer/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new RegisterCustomerPayload(
                                                "newcustomer@routine.vn",
                                                "weakpass",
                                                "New Customer",
                                                "0901234567"))))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                                .andExpect(jsonPath("$.message").value("Validation failed"))
                                .andExpect(jsonPath("$.data.password")
                                                .value("Password must contain at least one uppercase letter"));

                verifyNoInteractions(authService);
        }

        @Test
        void refreshTokenReturnsSuccessResponse() throws Exception {
                AuthResponse authResponse = AuthResponse.builder()
                                .token("refreshed-access-token")
                                .refreshToken("refreshed-refresh-token")
                                .email("manager@routine.vn")
                                .role("MANAGER")
                                .build();

                when(authService.refreshToken(any())).thenReturn(authResponse);

                mockMvc.perform(post("/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper
                                                .writeValueAsString(new RefreshTokenPayload("valid-refresh-token"))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Token refreshed successfully"))
                                .andExpect(jsonPath("$.data.token").value("refreshed-access-token"))
                                .andExpect(jsonPath("$.data.refreshToken").value("refreshed-refresh-token"));

                verify(authService).refreshToken(any());
        }

        @Test
        void refreshTokenReturnsBadRequestWhenPayloadInvalid() throws Exception {
                mockMvc.perform(post("/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new RefreshTokenPayload(""))))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.success").value(false))
                                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                                .andExpect(jsonPath("$.message").value("Validation failed"))
                                .andExpect(jsonPath("$.data.refreshToken").value("Refresh token is required"));

                verifyNoInteractions(authService);
        }

        private record LoginPayload(String email, String password) {
        }

        private record RegisterCustomerPayload(String email, String password, String fullName, String phone) {
        }

        private record RefreshTokenPayload(String refreshToken) {
        }
}
