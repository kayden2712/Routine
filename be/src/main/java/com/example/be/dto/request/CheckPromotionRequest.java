package com.example.be.dto.request;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckPromotionRequest {

    @NotNull(message = "Tổng giá trị đơn hàng không được để trống")
    @DecimalMin(value = "0.0", message = "Tổng giá trị đơn hàng phải >= 0")
    private BigDecimal orderAmount;

    @NotEmpty(message = "Danh sách sản phẩm không được rỗng")
    private List<Long> productIds;

    private Long customerId;
}
