package com.example.be.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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
import com.example.be.entity.UserRole;
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
        user.setRoles(buildSingleRoleList(request.getRole()));
        user.setIsActive(true);

        userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String selectedRole = resolvePrimaryRoleName(user);
        return buildUserAuthResponse(
            user,
            selectedRole,
            tokenProvider.generateAdminToken(authentication, selectedRole),
            tokenProvider.generateRefreshToken(authentication, selectedRole));
    }

    public AuthResponse loginUser(LoginRequest request) {
        if (request.getSelectedRole() == null) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Vui lòng chọn vai trò để đăng nhập");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new BadRequestException(ErrorCode.CURRENT_USER_NOT_FOUND, "User not found"));

            String selectedRole = normalizeStaffRole(request.getSelectedRole()).name();
            if (!hasRole(user, request.getSelectedRole())) {
            throw new UnauthorizedException(
                ErrorCode.INVALID_CREDENTIALS,
                "Vai tro khong khop voi tai khoan dang nhap");
            }

            Authentication scopedAuthentication = new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + selectedRole)));
            SecurityContextHolder.getContext().setAuthentication(scopedAuthentication);

            return buildUserAuthResponse(
                user,
                selectedRole,
                tokenProvider.generateAdminToken(authentication, selectedRole),
                tokenProvider.generateRefreshToken(authentication, selectedRole));
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
            String selectedRole = tokenProvider.getSelectedRoleFromToken(request.getRefreshToken());
            if (!StringUtils.hasText(selectedRole)) {
            selectedRole = resolvePrimaryRoleName(user);
            }

            UserRole selectedUserRole;
            try {
                selectedUserRole = UserRole.valueOf(selectedRole);
            } catch (IllegalArgumentException ex) {
                throw new UnauthorizedException(
                        ErrorCode.INVALID_CREDENTIALS,
                        "Vai trò trong phiên đăng nhập không hợp lệ");
            }
            if (!hasRole(user, selectedUserRole)) {
            throw new UnauthorizedException(
                ErrorCode.INVALID_CREDENTIALS,
                "Vai trò trong phiên đăng nhập không còn hiệu lực");
            }

            Authentication authentication = new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + selectedRole)));
            return buildUserAuthResponse(
                user,
                selectedRole,
                tokenProvider.generateAdminToken(authentication, selectedRole),
                tokenProvider.generateRefreshTokenByEmail(email, selectedRole));
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
            return buildUserAuthResponse(user, resolvePrimaryRoleName(user), null, null);
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
                        "Mật khẩu cũ không đúng");
            }
            if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
                throw new BadRequestException(ErrorCode.NEW_PASSWORD_MUST_DIFFERENT,
                        "Mật khẩu mới không được giống mật khẩu cũ");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);
            return;
        }

        Customer customer = customerRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(ErrorCode.CURRENT_USER_NOT_FOUND, "Current user not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), customer.getPasswordHash())) {
            throw new BadRequestException(ErrorCode.CURRENT_PASSWORD_INCORRECT, "Mật khẩu cũ không đúng");
        }
        if (passwordEncoder.matches(request.getNewPassword(), customer.getPasswordHash())) {
            throw new BadRequestException(ErrorCode.NEW_PASSWORD_MUST_DIFFERENT,
                    "Mật khẩu mới không được giống mật khẩu cũ");
        }
        customer.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        customerRepository.save(customer);
    }

    private AuthResponse buildUserAuthResponse(User user, String selectedRole, String token, String refreshToken) {
        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(selectedRole)
                .roles(user.getRoles() == null
                        ? List.of()
                        : user.getRoles().stream().map(UserRole::name).toList())
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

    private com.example.be.entity.UserRole normalizeStaffRole(com.example.be.entity.UserRole role) {
        if (role == null) {
            return null;
        }
        return role == com.example.be.entity.UserRole.MANAGER ? com.example.be.entity.UserRole.MANAGER : role;
    }

    private List<UserRole> buildSingleRoleList(UserRole role) {
        UserRole normalized = normalizeStaffRole(role);
        if (normalized == null) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Role is required");
        }
        return new ArrayList<>(List.of(normalized));
    }

    private boolean hasRole(User user, UserRole role) {
        return user != null && role != null && user.getRoles() != null && user.getRoles().contains(role);
    }

    private String resolvePrimaryRoleName(User user) {
        if (user == null || user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "User has no role configured");
        }
        return normalizeStaffRole(user.getRoles().get(0)).name();
    }
}
