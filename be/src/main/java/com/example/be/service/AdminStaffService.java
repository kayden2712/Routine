package com.example.be.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.be.dto.request.AdminStaffRequest;
import com.example.be.dto.response.AdminStaffResponse;
import com.example.be.entity.EmployeeType;
import com.example.be.entity.User;
import com.example.be.entity.UserRole;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ErrorCode;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AdminStaffService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<AdminStaffResponse> getStaff() {
        return userRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public AdminStaffResponse getStaffById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + id));
        return mapToResponse(user);
    }

    @Transactional
    public AdminStaffResponse createStaff(AdminStaffRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(ErrorCode.USER_EMAIL_ALREADY_REGISTERED, "Email is already registered");
        }
        if (StringUtils.hasText(request.getPhone()) && userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException(ErrorCode.USER_PHONE_ALREADY_REGISTERED,
                    "Phone number is already registered");
        }
        if (!StringUtils.hasText(request.getPassword())) {
            throw new BadRequestException(ErrorCode.STAFF_PASSWORD_REQUIRED,
                    "Password is required when creating staff");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        applyRequest(user, request);
        if (user.getIsActive() == null) {
            user.setIsActive(true);
        }

        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }

    @Transactional
    public AdminStaffResponse updateStaff(Long id, AdminStaffRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + id));

        if (!request.getEmail().equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(ErrorCode.USER_EMAIL_ALREADY_REGISTERED, "Email is already registered");
        }

        if (StringUtils.hasText(request.getPhone())
                && !request.getPhone().equals(user.getPhone())
                && userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException(ErrorCode.USER_PHONE_ALREADY_REGISTERED,
                    "Phone number is already registered");
        }

        user.setEmail(request.getEmail());
        applyRequest(user, request);
        if (StringUtils.hasText(request.getPassword())) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        User updated = userRepository.save(user);
        return mapToResponse(updated);
    }

    @Transactional
    public AdminStaffResponse updateStatus(Long id, boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + id));
        user.setIsActive(isActive);
        return mapToResponse(userRepository.save(user));
    }

    private void applyRequest(User user, AdminStaffRequest request) {
        user.setFullName(request.getFullName());
        user.setRoles(normalizeStaffRoles(request.getRoles(), request.getRole()));
        if (request.getEmployeeType() != null) {
            user.setEmployeeType(request.getEmployeeType());
        } else if (user.getEmployeeType() == null) {
            user.setEmployeeType(EmployeeType.FULLTIME);
        }
        if (request.getBaseSalary() != null) {
            user.setBaseSalary(BigDecimal.valueOf(Math.max(0L, request.getBaseSalary())));
        } else if (user.getBaseSalary() == null) {
            user.setBaseSalary(BigDecimal.ZERO);
        }
        user.setPhone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null);
        user.setBranch(request.getBranch());
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
    }

    private AdminStaffResponse mapToResponse(User user) {
        return AdminStaffResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .branch(user.getBranch())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .roles(user.getRoles() == null
                        ? List.of()
                        : user.getRoles().stream().map(UserRole::name).collect(Collectors.toList()))
                .employeeType(user.getEmployeeType() != null ? user.getEmployeeType().name() : null)
                .baseSalary(user.getBaseSalary() != null ? user.getBaseSalary().longValue() : 0L)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private UserRole normalizeStaffRole(UserRole role) {
        if (role == null) {
            return null;
        }
        return role == UserRole.MANAGER ? UserRole.MANAGER : role;
    }

    private List<UserRole> normalizeStaffRoles(List<UserRole> roles, UserRole fallbackRole) {
        List<UserRole> source = roles;
        if ((source == null || source.isEmpty()) && fallbackRole != null) {
            source = List.of(fallbackRole);
        }
        if (source == null || source.isEmpty()) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "At least one role is required");
        }

        LinkedHashSet<UserRole> uniqueRoles = source.stream()
                .map(this::normalizeStaffRole)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (uniqueRoles.isEmpty() || uniqueRoles.contains(null)) {
            throw new BadRequestException(ErrorCode.BAD_REQUEST, "Invalid role list");
        }

        if (uniqueRoles.contains(UserRole.MANAGER)) {
            throw new BadRequestException(
                    ErrorCode.BAD_REQUEST,
                    "Không được gán vai trò MANAGER khi thêm hoặc cập nhật nhân viên");
        }

        return new ArrayList<>(uniqueRoles);
    }
}
