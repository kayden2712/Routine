package com.example.be.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator cho số điện thoại Việt Nam
 * Hỗ trợ các định dạng:
 * - 10 số: 0xxxxxxxxx
 * - 11 số: 84xxxxxxxxx hoặc +84xxxxxxxxx
 * Đầu số hợp lệ: 03, 05, 07, 08, 09
 */
public class VietnamesePhoneNumberValidator implements ConstraintValidator<VietnamesePhoneNumber, String> {
    
    private boolean required;
    
    // Pattern cho số điện thoại VN: 
    // - Bắt đầu với 0 + đầu số (3,5,7,8,9) + 8 số
    // - Hoặc 84 + đầu số (3,5,7,8,9) + 8 số
    // - Hoặc +84 + đầu số (3,5,7,8,9) + 8 số
    private static final String PHONE_PATTERN = "^(0|84|\\+84)(3|5|7|8|9)[0-9]{8}$";
    
    @Override
    public void initialize(VietnamesePhoneNumber constraintAnnotation) {
        this.required = constraintAnnotation.required();
    }
    
    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
        // Nếu không bắt buộc và null hoặc rỗng thì hợp lệ
        if (!required && (phoneNumber == null || phoneNumber.trim().isEmpty())) {
            return true;
        }
        
        // Nếu bắt buộc và null hoặc rỗng thì không hợp lệ
        if (required && (phoneNumber == null || phoneNumber.trim().isEmpty())) {
            return false;
        }
        
        // Loại bỏ khoảng trắng và dấu gạch ngang
        String cleanPhone = phoneNumber.replaceAll("[\\s\\-]", "");
        
        // Validate pattern
        return cleanPhone.matches(PHONE_PATTERN);
    }
}
