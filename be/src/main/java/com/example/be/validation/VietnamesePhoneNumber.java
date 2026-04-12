package com.example.be.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Annotation để validate số điện thoại Việt Nam
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = VietnamesePhoneNumberValidator.class)
@Documented
public @interface VietnamesePhoneNumber {
    
    String message() default "Số điện thoại không hợp lệ";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
    
    /**
     * Có bắt buộc phải nhập không
     */
    boolean required() default false;
}
