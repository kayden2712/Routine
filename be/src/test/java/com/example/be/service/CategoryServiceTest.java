package com.example.be.service;

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

import com.example.be.dto.request.CreateCategoryRequest;
import com.example.be.dto.response.CategoryResponse;
import com.example.be.entity.Category;
import com.example.be.exception.BadRequestException;
import com.example.be.repository.CategoryRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void createCategoryRejectsBlankName() {
        CreateCategoryRequest request = new CreateCategoryRequest("   ", "desc", "icon", 1);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> categoryService.createCategory(request));
        assertNotNull(exception.getMessage());
    }

    @Test
    void createCategoryGeneratesUniqueSlugWithSuffix() {
        CreateCategoryRequest request = new CreateCategoryRequest("Áo Sơ Mi", "  desc  ", " icon ", null);
        when(categoryRepository.existsByNameIgnoreCase("Áo Sơ Mi")).thenReturn(false);
        when(categoryRepository.existsBySlugIgnoreCase("ao-so-mi")).thenReturn(true);
        when(categoryRepository.existsBySlugIgnoreCase("ao-so-mi-1")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category c = invocation.getArgument(0);
            c.setId(10L);
            return c;
        });

        CategoryResponse response = categoryService.createCategory(request);

        assertEquals(10L, response.getId());
        assertEquals("Áo Sơ Mi", response.getName());
        assertEquals("ao-so-mi-1", response.getSlug());
        assertEquals("desc", response.getDescription());
        assertEquals("icon", response.getIcon());
        assertEquals(0, response.getDisplayOrder());
        assertEquals(true, response.getIsActive());
    }
}
