package com.example.be.service;

import java.math.BigDecimal;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.ChangePasswordRequest;
import com.example.be.dto.request.LoginRequest;
import com.example.be.dto.request.RefreshTokenRequest;
import com.example.be.dto.request.RegisterCustomerRequest;
import com.example.be.dto.request.RegisterUserRequest;
import com.example.be.dto.request.UpdateCustomerProfileRequest;
import com.example.be.dto.response.AuthResponse;
import com.example.be.entity.Customer;
import com.example.be.entity.CustomerTier;
import com.example.be.entity.User;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ErrorCode;
import com.example.be.exception.UnauthorizedException;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.UserRepository;
import com.example.be.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse registerUser(RegisterUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(ErrorCode.USER_EMAIL_ALREADY_REGISTERED, "Email is already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setIsActive(true);

        userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        return buildUserAuthResponse(user, tokenProvider.generateAdminToken(authentication),
                tokenProvider.generateRefreshToken(authentication));
    }

    public AuthResponse loginUser(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new BadRequestException(ErrorCode.CURRENT_USER_NOT_FOUND, "User not found"));

            return buildUserAuthResponse(user, tokenProvider.generateAdminToken(authentication),
                    tokenProvider.generateRefreshToken(authentication));
        } catch (BadCredentialsException e) {
            // Check if user exists to provide appropriate error message
            boolean userExists = userRepository.existsByEmail(request.getEmail());
            if (!userExists) {
                throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, "Tài khoản không tồn tại");
            } else {
                throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS, "Mật khẩu không chính xác");
            }
        }
    }

    @Transactional
    public AuthResponse registerCustomer(RegisterCustomerRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(ErrorCode.USER_EMAIL_ALREADY_REGISTERED, "Email is already registered");
        }

        if (customerRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException(ErrorCode.USER_PHONE_ALREADY_REGISTERED,
                    "Phone number is already registered");
        }

        Customer customer = new Customer();
        customer.setEmail(request.getEmail());
        customer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        customer.setFullName(request.getFullName());
        customer.setPhone(request.getPhone());
        customer.setTier(CustomerTier.REGULAR);
        customer.setTotalOrders(0);
        customer.setTotalSpent(BigDecimal.ZERO);

        customerRepository.save(customer);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        return buildCustomerAuthResponse(customer, tokenProvider.generateCustomerToken(authentication),
                tokenProvider.generateRefreshToken(authentication));
    }

    public AuthResponse loginCustomer(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        Customer customer = customerRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException(ErrorCode.CURRENT_USER_NOT_FOUND, "Customer not found"));

        return buildCustomerAuthResponse(customer, tokenProvider.generateCustomerToken(authentication),
                tokenProvider.generateRefreshToken(authentication));
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (!tokenProvider.validateRefreshToken(request.getRefreshToken())) {
            throw new BadRequestException(ErrorCode.REFRESH_TOKEN_INVALID, "Invalid refresh token");
        }

        String email = tokenProvider.getEmailFromToken(request.getRefreshToken());
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            Authentication authentication = new UsernamePasswordAuthenticationToken(email, null);
            return buildUserAuthResponse(user, tokenProvider.generateAdminToken(authentication),
                    tokenProvider.generateRefreshTokenByEmail(email));
        }

        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(ErrorCode.REFRESH_TOKEN_SUBJECT_NOT_FOUND,
                        "User not found for refresh token"));
        Authentication authentication = new UsernamePasswordAuthenticationToken(email, null);
        return buildCustomerAuthResponse(customer, tokenProvider.generateCustomerToken(authentication),
                tokenProvider.generateRefreshTokenByEmail(email));
    }

    public AuthResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            return buildUserAuthResponse(user, null, null);
        }

        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(ErrorCode.CURRENT_USER_NOT_FOUND, "Current user not found"));
        return buildCustomerAuthResponse(customer, null, null);
    }

    @Transactional
    public AuthResponse updateCustomerProfile(String customerEmail, UpdateCustomerProfileRequest request) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new BadRequestException(ErrorCode.CURRENT_USER_NOT_FOUND, "Customer not found"));

        String normalizedPhone = request.getPhone() != null ? request.getPhone().trim() : "";
        if (!normalizedPhone.equals(customer.getPhone()) && customerRepository.existsByPhone(normalizedPhone)) {
            throw new BadRequestException(ErrorCode.USER_PHONE_ALREADY_REGISTERED,
                    "Phone number is already registered");
        }

        customer.setFullName(request.getFullName().trim());
        customer.setPhone(normalizedPhone);
        customer.setAddress(request.getAddress() != null ? request.getAddress().trim() : null);
        customer.setDistrict(request.getDistrict() != null ? request.getDistrict().trim() : null);
        customer.setCity(request.getCity() != null ? request.getCity().trim() : null);

        customerRepository.save(customer);
        return buildCustomerAuthResponse(customer, null, null);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new BadRequestException(ErrorCode.CURRENT_PASSWORD_INCORRECT,
                        "Current password is incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);
            return;
        }

        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(ErrorCode.CURRENT_USER_NOT_FOUND, "Current user not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), customer.getPasswordHash())) {
            throw new BadRequestException(ErrorCode.CURRENT_PASSWORD_INCORRECT, "Current password is incorrect");
        }
        customer.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        customerRepository.save(customer);
    }

    private AuthResponse buildUserAuthResponse(User user, String token, String refreshToken) {
        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .phone(user.getPhone())
                .branch(user.getBranch())
                .build();
    }

    private AuthResponse buildCustomerAuthResponse(Customer customer, String token, String refreshToken) {
        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .id(customer.getId())
                .email(customer.getEmail())
                .fullName(customer.getFullName())
                .role("CUSTOMER")
                .phone(customer.getPhone())
                .tier(customer.getTier() != null ? customer.getTier().name() : null)
                .address(customer.getAddress())
                .district(customer.getDistrict())
                .city(customer.getCity())
                .build();
    }
}
