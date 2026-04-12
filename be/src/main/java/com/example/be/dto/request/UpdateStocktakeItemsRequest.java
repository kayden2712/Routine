package com.example.be.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Request cập nhật số lượng thực tế kiểm kê
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStocktakeItemsRequest {

    @NotEmpty(message = "Danh sách chi tiết không được để trống")
    @Valid
    private List<StocktakeItemUpdate> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StocktakeItemUpdate {

        @NotNull(message = "Product ID không được để trống")
        private Long productId;

        @NotNull(message = "Số lượng thực tế không được để trống")
        @Min(value = 0, message = "Số lượng thực tế phải >= 0")
        private Integer actualQuantity;

        private String note;
    }
}
