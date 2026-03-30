package com.example.be.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name is too long")
    private String name;

    @Size(max = 1000, message = "Description is too long")
    private String description;

    @Size(max = 100, message = "Icon is too long")
    private String icon;

    private Integer displayOrder;
}
