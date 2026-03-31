package com.example.be.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.example.be.dto.request.AdminCustomerRequest;
import com.example.be.dto.response.AdminCustomerResponse;
import com.example.be.entity.Customer;
import com.example.be.entity.CustomerTier;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ErrorCode;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.CustomerRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminCustomerService {

    private final CustomerRepository customerRepository;

    public List<AdminCustomerResponse> getCustomers(String search, CustomerTier tier) {
        List<Customer> customers;
        if (StringUtils.hasText(search)) {
            customers = customerRepository.searchCustomers(search.trim());
        } else if (tier != null) {
            customers = customerRepository.findByTier(tier);
        } else {
            customers = customerRepository.findAll();
        }
        return customers.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public AdminCustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return mapToResponse(customer);
    }

    @Transactional
    public AdminCustomerResponse createCustomer(AdminCustomerRequest request) {
        if (StringUtils.hasText(request.getEmail()) && customerRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(ErrorCode.USER_EMAIL_ALREADY_REGISTERED, "Email is already registered");
        }
        if (customerRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException(ErrorCode.USER_PHONE_ALREADY_REGISTERED,
                    "Phone number is already registered");
        }

        Customer customer = new Customer();
        applyRequest(customer, request);
        Customer saved = customerRepository.save(customer);
        return mapToResponse(saved);
    }

    @Transactional
    public AdminCustomerResponse updateCustomer(Long id, AdminCustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        if (StringUtils.hasText(request.getEmail())
                && !request.getEmail().equalsIgnoreCase(customer.getEmail())
                && customerRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(ErrorCode.USER_EMAIL_ALREADY_REGISTERED, "Email is already registered");
        }

        if (!request.getPhone().equals(customer.getPhone()) && customerRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException(ErrorCode.USER_PHONE_ALREADY_REGISTERED,
                    "Phone number is already registered");
        }

        applyRequest(customer, request);
        Customer updated = customerRepository.save(customer);
        return mapToResponse(updated);
    }

    private void applyRequest(Customer customer, AdminCustomerRequest request) {
        customer.setFullName(request.getFullName());
        customer.setPhone(request.getPhone());
        customer.setEmail(StringUtils.hasText(request.getEmail()) ? request.getEmail().trim() : null);
        customer.setAddress(request.getAddress());
        if (request.getTier() != null) {
            customer.setTier(request.getTier());
        } else if (customer.getTier() == null) {
            customer.setTier(CustomerTier.REGULAR);
        }
    }

    private AdminCustomerResponse mapToResponse(Customer customer) {
        return AdminCustomerResponse.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .address(customer.getAddress())
                .tier(customer.getTier() != null ? customer.getTier().name() : null)
                .totalOrders(customer.getTotalOrders())
                .totalSpent(customer.getTotalSpent())
                .lastOrderAt(customer.getLastOrderAt())
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
