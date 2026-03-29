package com.example.be.service;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.be.dto.request.AdminCustomerRequest;
import com.example.be.dto.response.AdminCustomerResponse;
import com.example.be.entity.Customer;
import com.example.be.entity.CustomerTier;
import com.example.be.exception.BadRequestException;
import com.example.be.repository.CustomerRepository;

@ExtendWith(MockitoExtension.class)
class AdminCustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private AdminCustomerService adminCustomerService;

    @Test
    void getCustomersUsesSearchWhenProvided() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setFullName("Nguyen Van A");
        customer.setPhone("0901111222");
        customer.setTier(CustomerTier.REGULAR);

        when(customerRepository.searchCustomers("nguyen")).thenReturn(List.of(customer));

        List<AdminCustomerResponse> responses = adminCustomerService.getCustomers("nguyen", null);

        assertEquals(1, responses.size());
        assertEquals("Nguyen Van A", responses.get(0).getFullName());
    }

    @Test
    void createCustomerRejectsDuplicatePhone() {
        AdminCustomerRequest request = new AdminCustomerRequest("A", "0909999999", "a@mail.vn", "Q1",
                CustomerTier.REGULAR);
        when(customerRepository.existsByEmail("a@mail.vn")).thenReturn(false);
        when(customerRepository.existsByPhone("0909999999")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> adminCustomerService.createCustomer(request));
    }

    @Test
    void updateCustomerUpdatesFields() {
        Customer existing = new Customer();
        existing.setId(10L);
        existing.setFullName("Old");
        existing.setPhone("0901234567");
        existing.setEmail("old@mail.vn");
        existing.setTier(CustomerTier.REGULAR);

        AdminCustomerRequest request = new AdminCustomerRequest(
                "New Name", "0901234568", "new@mail.vn", "Q3", CustomerTier.VIP);

        when(customerRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(customerRepository.existsByEmail("new@mail.vn")).thenReturn(false);
        when(customerRepository.existsByPhone("0901234568")).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminCustomerResponse response = adminCustomerService.updateCustomer(10L, request);

        assertEquals("New Name", response.getFullName());
        assertEquals("VIP", response.getTier());
        assertEquals("Q3", response.getAddress());
    }
}
