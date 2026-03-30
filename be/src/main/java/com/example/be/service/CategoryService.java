package com.example.be.service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.CreateCategoryRequest;
import com.example.be.dto.response.CategoryResponse;
import com.example.be.entity.Category;
import com.example.be.exception.BadRequestException;
import com.example.be.repository.CategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String name = request.getName() != null ? request.getName().trim() : "";
        if (name.isEmpty()) {
            throw new BadRequestException("Category name is required");
        }

        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Category name already exists");
        }

        String baseSlug = slugify(name);
        String slug = baseSlug;
        int suffix = 1;
        while (categoryRepository.existsBySlugIgnoreCase(slug)) {
            slug = baseSlug + "-" + suffix;
            suffix += 1;
        }

        Category category = new Category();
        category.setName(name);
        category.setSlug(slug);
        category.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        category.setIcon(request.getIcon() != null ? request.getIcon().trim() : null);
        Integer displayOrder = request.getDisplayOrder();
        if (displayOrder == null) {
            category.setDisplayOrder(0);
        } else {
            category.setDisplayOrder(displayOrder);
        }
        category.setIsActive(true);

        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .icon(category.getIcon())
                .displayOrder(category.getDisplayOrder())
                .isActive(category.getIsActive())
                .build();
    }

    private String slugify(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String slug = normalized.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return slug.isBlank() ? "category" : slug;
    }
}
