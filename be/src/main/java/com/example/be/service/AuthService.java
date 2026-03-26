package com.example.be.service;

import com.example.be.dto.request.LoginRequest;
import com.example.be.dto.request.RegisterCustomerRequest;
import com.example.be.dto.request.RegisterUserRequest;
import com.example.be.dto.response.AuthResponse;
import com.example.be.entity.Customer;
import com.example.be.entity.CustomerTier;
import com.example.be.entity.User;
import com.example.be.exception.BadRequestException;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.UserRepository;
import com.example.be.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

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
            throw new BadRequestException("Email is already registered");
        }
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setIsActive(true);
        
        userRepository.save(user);
        
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        String token = tokenProvider.generateAdminToken(authentication);
        
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
    
    public AuthResponse loginUser(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));
        
        String token = tokenProvider.generateAdminToken(authentication);
        
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
    
    @Transactional
    public AuthResponse registerCustomer(RegisterCustomerRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }
        
        if (customerRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Phone number is already registered");
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
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        String token = tokenProvider.generateCustomerToken(authentication);
        
        return AuthResponse.builder()
                .token(token)
                .id(customer.getId())
                .email(customer.getEmail())
                .fullName(customer.getFullName())
                .role("CUSTOMER")
                .build();
    }
    
    public AuthResponse loginCustomer(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        Customer customer = customerRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Customer not found"));
        
        String token = tokenProvider.generateCustomerToken(authentication);
        
        return AuthResponse.builder()
                .token(token)
                .id(customer.getId())
                .email(customer.getEmail())
                .fullName(customer.getFullName())
                .role("CUSTOMER")
                .build();
    }
}
