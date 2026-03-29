package com.example.be.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import com.example.be.dto.request.LoginRequest;
import com.example.be.dto.request.RefreshTokenRequest;
import com.example.be.dto.response.AuthResponse;
import com.example.be.entity.Customer;
import com.example.be.entity.CustomerTier;
import com.example.be.entity.User;
import com.example.be.entity.UserRole;
import com.example.be.exception.BadRequestException;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.UserRepository;
import com.example.be.security.JwtTokenProvider;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginUserReturnsAccessAndRefreshToken() {
        LoginRequest request = new LoginRequest("manager@routine.vn", "Password@123");
        Authentication authentication = new UsernamePasswordAuthenticationToken(request.getEmail(), null);

        User user = new User();
        user.setId(1L);
        user.setEmail(request.getEmail());
        user.setFullName("Manager");
        user.setRole(UserRole.MANAGER);
        user.setPhone("0901111222");
        user.setBranch("Routine Q1");

        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(tokenProvider.generateAdminToken(authentication)).thenReturn("access-token");
        when(tokenProvider.generateRefreshToken(authentication)).thenReturn("refresh-token");

        AuthResponse response = authService.loginUser(request);

        assertEquals("access-token", response.getToken());
        assertEquals("refresh-token", response.getRefreshToken());
        assertEquals("MANAGER", response.getRole());
        assertEquals("Routine Q1", response.getBranch());
    }

    @Test
    void refreshTokenReturnsAdminTokensWhenAdminEmail() {
        RefreshTokenRequest request = new RefreshTokenRequest("refresh-token");
        User user = new User();
        user.setId(11L);
        user.setEmail("manager@routine.vn");
        user.setFullName("Manager");
        user.setRole(UserRole.MANAGER);

        when(tokenProvider.validateRefreshToken("refresh-token")).thenReturn(true);
        when(tokenProvider.getEmailFromToken("refresh-token")).thenReturn("manager@routine.vn");
        when(userRepository.findByEmail("manager@routine.vn")).thenReturn(Optional.of(user));
        when(tokenProvider.generateAdminToken(any(Authentication.class))).thenReturn("new-access");
        when(tokenProvider.generateRefreshTokenByEmail("manager@routine.vn")).thenReturn("new-refresh");

        AuthResponse response = authService.refreshToken(request);

        assertEquals("new-access", response.getToken());
        assertEquals("new-refresh", response.getRefreshToken());
        assertEquals("MANAGER", response.getRole());
    }

    @Test
    void refreshTokenReturnsCustomerTokensWhenCustomerEmail() {
        RefreshTokenRequest request = new RefreshTokenRequest("refresh-token");
        Customer customer = new Customer();
        customer.setId(22L);
        customer.setEmail("customer@mail.vn");
        customer.setFullName("Customer");
        customer.setPhone("0903333444");
        customer.setTier(CustomerTier.VIP);

        when(tokenProvider.validateRefreshToken("refresh-token")).thenReturn(true);
        when(tokenProvider.getEmailFromToken("refresh-token")).thenReturn("customer@mail.vn");
        when(userRepository.findByEmail("customer@mail.vn")).thenReturn(Optional.empty());
        when(customerRepository.findByEmail("customer@mail.vn")).thenReturn(Optional.of(customer));
        when(tokenProvider.generateCustomerToken(any(Authentication.class))).thenReturn("customer-access");
        when(tokenProvider.generateRefreshTokenByEmail("customer@mail.vn")).thenReturn("customer-refresh");

        AuthResponse response = authService.refreshToken(request);

        assertEquals("customer-access", response.getToken());
        assertEquals("customer-refresh", response.getRefreshToken());
        assertEquals("CUSTOMER", response.getRole());
        assertEquals("VIP", response.getTier());
    }

    @Test
    void refreshTokenRejectsInvalidToken() {
        when(tokenProvider.validateRefreshToken("bad-token")).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> authService.refreshToken(new RefreshTokenRequest("bad-token")));

        assertTrue(ex.getMessage().contains("Invalid refresh token"));
    }
}
