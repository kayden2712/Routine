package com.example.be.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.be.entity.Category;
import com.example.be.entity.EmployeeType;
import com.example.be.entity.User;
import com.example.be.entity.UserRole;
import com.example.be.repository.CategoryRepository;
import com.example.be.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DefaultDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(org.springframework.boot.ApplicationArguments args) {
        seedDefaultManager();
        seedDefaultCategories();
    }

    private void seedDefaultManager() {
        final String adminEmail = "admin@routine.com";
        var existing = userRepository.findByEmail(adminEmail);
        if (existing.isPresent()) {
            User admin = existing.get();
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(UserRole.MANAGER);
            admin.setEmployeeType(EmployeeType.FULLTIME);
            admin.setBaseSalary(java.math.BigDecimal.valueOf(15000000));
            admin.setIsActive(true);
            if (admin.getFullName() == null || admin.getFullName().isBlank()) {
                admin.setFullName("System Admin");
            }
            if (admin.getBranch() == null || admin.getBranch().isBlank()) {
                admin.setBranch("HCM");
            }
            userRepository.save(admin);
            return;
        }

        User admin = new User();
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setFullName("System Admin");
        admin.setRole(UserRole.MANAGER);
        admin.setEmployeeType(EmployeeType.FULLTIME);
        admin.setBaseSalary(java.math.BigDecimal.valueOf(15000000));
        admin.setIsActive(true);
        admin.setBranch("HCM");
        userRepository.save(admin);
    }

    private void seedDefaultCategories() {
        ensureCategory("Ao so mi", "ao-so-mi", "Nhom ao so mi, ao phong, polo", "shirt", 1);
        ensureCategory("Ao khoac", "ao-khoac", "Nhom ao khoac ngoai", "jacket", 2);
        ensureCategory("Quan jeans", "quan-jeans", "Nhom quan jeans", "jeans", 3);
        ensureCategory("Quan kaki", "quan-kaki", "Nhom quan kaki", "khaki", 4);
        ensureCategory("Vay", "vay", "Nhom vay dam nu", "dress", 5);
        ensureCategory("Phu kien", "phu-kien", "Nhom phu kien", "accessory", 6);
    }

    private void ensureCategory(String name, String slug, String description, String icon, int displayOrder) {
        boolean exists = categoryRepository.existsByNameIgnoreCase(name)
                || categoryRepository.existsBySlugIgnoreCase(slug);
        if (exists) {
            return;
        }

        Category category = new Category();
        category.setName(name);
        category.setSlug(slug);
        category.setDescription(description);
        category.setIcon(icon);
        category.setDisplayOrder(displayOrder);
        category.setIsActive(true);
        categoryRepository.save(category);
    }
}
