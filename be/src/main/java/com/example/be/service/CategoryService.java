package com.example.be.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.be.dto.response.CategoryResponse;
import com.example.be.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(category -> CategoryResponse.builder()
                        .id(category.getId())
                        .name(category.getName())
                        .slug(category.getSlug())
                        .description(category.getDescription())
                        .icon(category.getIcon())
                        .displayOrder(category.getDisplayOrder())
                        .isActive(category.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }
}
