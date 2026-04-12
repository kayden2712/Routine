package com.example.be.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.be.dto.request.AdminStaffRequest;
import com.example.be.dto.response.AdminStaffResponse;
import com.example.be.entity.User;
import com.example.be.entity.UserRole;
import com.example.be.exception.BadRequestException;
import com.example.be.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AdminStaffServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminStaffService adminStaffService;

    @Test
    void createStaffRejectsDuplicateEmail() {
        AdminStaffRequest request = new AdminStaffRequest("Staff", "staff@routine.vn", "0901111222", "Q1",
                UserRole.SALES, true, null);
        when(userRepository.existsByEmail("staff@routine.vn")).thenReturn(true);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> adminStaffService.createStaff(request));
        assertNotNull(exception.getMessage());
    }

    @Test
    void createStaffRejectsWhenPasswordBlank() {
        AdminStaffRequest request = new AdminStaffRequest("Staff", "staff@routine.vn", "0901111222", "Q1",
                UserRole.SALES, true, null);
        when(userRepository.existsByEmail("staff@routine.vn")).thenReturn(false);
        when(userRepository.existsByPhone("0901111222")).thenReturn(false);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> adminStaffService.createStaff(request));
        assertNotNull(exception.getMessage());
    }

    @Test
    void createStaffWithPasswordSuccess() {
        AdminStaffRequest request = new AdminStaffRequest("Staff", "staff@routine.vn", "0901111222", "Q1",
                UserRole.SALES, true, "Staff@123");
        when(userRepository.existsByEmail("staff@routine.vn")).thenReturn(false);
        when(userRepository.existsByPhone("0901111222")).thenReturn(false);
        when(passwordEncoder.encode("Staff@123")).thenReturn("encoded-default");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(7L);
            return user;
        });

        AdminStaffResponse response = adminStaffService.createStaff(request);

        assertEquals(7L, response.getId());
        assertEquals("SALES", response.getRole());
        assertEquals(true, response.getIsActive());
    }

    @Test
    void updateStatusChangesActiveFlag() {
        User user = new User();
        user.setId(5L);
        user.setEmail("staff@routine.vn");
        user.setFullName("Staff");
        user.setRole(UserRole.WAREHOUSE);
        user.setIsActive(true);

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        AdminStaffResponse response = adminStaffService.updateStatus(5L, false);

        assertEquals(false, response.getIsActive());
    }
}
