package com.example.be.dto.request;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.example.be.entity.enums.PromotionType;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePromotionRequest {

    @NotBlank(message = "Tên chương trình không được để trống")
    @Size(max = 255, message = "Tên chương trình không quá 255 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Loại khuyến mãi không được để trống")
    private PromotionType type;

    @NotNull(message = "Giá trị ưu đãi không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá trị ưu đãi phải > 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.0", message = "Số tiền giảm tối đa phải >= 0")
    private BigDecimal maxDiscountAmount;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endDate;

    @DecimalMin(value = "0.0", message = "Giá trị đơn hàng tối thiểu phải >= 0")
    private BigDecimal minOrderAmount;

    private Boolean applyToAllProducts;

    @Min(value = 1, message = "Số lần sử dụng tối đa phải >= 1")
    private Integer usageLimit;

    private List<Long> productIds;

    @SuppressWarnings("unused")
    @AssertTrue(message = "Thời gian kết thúc phải sau thời gian bắt đầu")
    private boolean isValidDateRange() {
        if (startDate == null || endDate == null) {
            return true;
        }
        return endDate.isAfter(startDate);
    }
}
