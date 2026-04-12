package com.example.be.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.be.dto.request.ApplyPromotionRequest;
import com.example.be.dto.request.CreatePromotionRequest;
import com.example.be.dto.request.UpdatePromotionRequest;
import com.example.be.dto.response.ApplyPromotionResponse;
import com.example.be.dto.response.PromotionResponse;
import com.example.be.entity.Promotion;
import com.example.be.entity.enums.PromotionStatus;
import com.example.be.entity.enums.PromotionType;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.PromotionProductRepository;
import com.example.be.repository.PromotionRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings({ "null", "unused" })
class PromotionServiceTest {

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private PromotionProductRepository promotionProductRepository;

    @InjectMocks
    private PromotionService promotionService;

    private Promotion samplePromotion;

    @BeforeEach
    void setUp() {
        samplePromotion = new Promotion();
        samplePromotion.setId(1L);
        samplePromotion.setCode("TEST2026");
        samplePromotion.setName("Test Promotion");
        samplePromotion.setType(PromotionType.GIAM_PHAN_TRAM);
        samplePromotion.setDiscountValue(BigDecimal.valueOf(10));
        samplePromotion.setStartDate(LocalDateTime.now().minusDays(1));
        samplePromotion.setEndDate(LocalDateTime.now().plusDays(7));
        samplePromotion.setStatus(PromotionStatus.ACTIVE);
        samplePromotion.setMinOrderAmount(BigDecimal.ZERO);
        samplePromotion.setApplyToAllProducts(true);
        samplePromotion.setUsageCount(0);
    }

    @Test
    @DisplayName("Should get all promotions successfully")
    void testGetAllPromotions() {
        List<Promotion> promotions = List.of(samplePromotion);
        when(promotionRepository.findAll()).thenReturn(promotions);
        when(promotionProductRepository.findByPromotionId(anyLong())).thenReturn(new ArrayList<>());

        List<PromotionResponse> result = promotionService.getAllPromotions();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("TEST2026", result.get(0).getCode());
        verify(promotionRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should create promotion successfully")
    void testCreatePromotion() {
        CreatePromotionRequest request = CreatePromotionRequest.builder()
                .code("NEWPROMO")
                .name("New Promotion")
                .type(PromotionType.GIAM_TIEN)
                .discountValue(BigDecimal.valueOf(50000))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(7))
                .build();

        when(promotionRepository.existsByCode(anyString())).thenReturn(false);
        when(promotionRepository.save(any(Promotion.class))).thenReturn(samplePromotion);
        when(promotionProductRepository.findByPromotionId(anyLong())).thenReturn(new ArrayList<>());

        PromotionResponse result = promotionService.createPromotion(request, 1L);

        assertNotNull(result);
        verify(promotionRepository, times(1)).save(any(Promotion.class));
    }

    @Test
    @DisplayName("Should throw exception when creating promotion with existing code")
    void testCreatePromotionWithExistingCode() {
        CreatePromotionRequest request = CreatePromotionRequest.builder()
                .code("EXISTING")
                .name("Test")
                .type(PromotionType.GIAM_TIEN)
                .discountValue(BigDecimal.valueOf(10000))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(7))
                .build();

        when(promotionRepository.existsByCode("EXISTING")).thenReturn(true);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            promotionService.createPromotion(request, 1L);
        });
        assertNotNull(exception.getMessage());

        verify(promotionRepository, never()).save(any(Promotion.class));
    }

    @Test
    @DisplayName("Should apply promotion successfully with percentage discount")
    void testApplyPromotionPercentage() {
        ApplyPromotionRequest request = ApplyPromotionRequest.builder()
                .promotionCode("TEST2026")
                .orderAmount(BigDecimal.valueOf(1000000))
                .build();

        when(promotionRepository.findByCode("TEST2026")).thenReturn(Optional.of(samplePromotion));
        when(promotionRepository.save(any(Promotion.class))).thenReturn(samplePromotion);

        ApplyPromotionResponse result = promotionService.applyPromotion(request, null, null);

        assertNotNull(result);
        assertTrue(result.getApplicable());
        assertEquals(BigDecimal.valueOf(100000), result.getDiscountAmount().setScale(0));
        assertEquals(BigDecimal.valueOf(900000), result.getFinalAmount().setScale(0));
    }

    @Test
    @DisplayName("Should not apply promotion when order amount is below minimum")
    void testApplyPromotionBelowMinimum() {
        samplePromotion.setMinOrderAmount(BigDecimal.valueOf(500000));

        ApplyPromotionRequest request = ApplyPromotionRequest.builder()
                .promotionCode("TEST2026")
                .orderAmount(BigDecimal.valueOf(300000))
                .build();

        when(promotionRepository.findByCode("TEST2026")).thenReturn(Optional.of(samplePromotion));

        ApplyPromotionResponse result = promotionService.applyPromotion(request, null, null);

        assertNotNull(result);
        assertFalse(result.getApplicable());
        assertTrue(result.getMessage().contains("chưa đạt giá trị tối thiểu"));
    }

    @Test
    @DisplayName("Should not apply expired promotion")
    void testApplyExpiredPromotion() {
        samplePromotion.setStatus(PromotionStatus.EXPIRED);

        ApplyPromotionRequest request = ApplyPromotionRequest.builder()
                .promotionCode("TEST2026")
                .orderAmount(BigDecimal.valueOf(1000000))
                .build();

        when(promotionRepository.findByCode("TEST2026")).thenReturn(Optional.of(samplePromotion));

        ApplyPromotionResponse result = promotionService.applyPromotion(request, null, null);

        assertNotNull(result);
        assertFalse(result.getApplicable());
        assertEquals("Khuyến mãi không còn hoạt động", result.getMessage());
    }

    @Test
    @DisplayName("Should activate promotion from DRAFT status")
    void testActivatePromotion() {
        samplePromotion.setStatus(PromotionStatus.DRAFT);

        when(promotionRepository.findById(1L)).thenReturn(Optional.of(samplePromotion));
        when(promotionRepository.save(any(Promotion.class))).thenReturn(samplePromotion);
        when(promotionProductRepository.findByPromotionId(anyLong())).thenReturn(new ArrayList<>());

        PromotionResponse result = promotionService.activatePromotion(1L);

        assertNotNull(result);
        verify(promotionRepository, times(1)).save(any(Promotion.class));
    }

    @Test
    @DisplayName("Should cancel promotion successfully")
    void testCancelPromotion() {
        when(promotionRepository.findById(1L)).thenReturn(Optional.of(samplePromotion));
        when(promotionRepository.save(any(Promotion.class))).thenReturn(samplePromotion);
        when(promotionProductRepository.findByPromotionId(anyLong())).thenReturn(new ArrayList<>());

        PromotionResponse result = promotionService.cancelPromotion(1L);

        assertNotNull(result);
        verify(promotionRepository, times(1)).save(any(Promotion.class));
    }

    @Test
    @DisplayName("Should throw exception when promotion not found")
    void testGetPromotionByIdNotFound() {
        when(promotionRepository.findById(999L)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            promotionService.getPromotionById(999L);
        });
        assertNotNull(exception.getMessage());
    }

    @Test
    @DisplayName("Should update promotion successfully")
    void testUpdatePromotion() {
        UpdatePromotionRequest request = UpdatePromotionRequest.builder()
                .name("Updated Name")
                .type(PromotionType.GIAM_PHAN_TRAM)
                .discountValue(BigDecimal.valueOf(15))
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(10))
                .build();

        when(promotionRepository.findById(1L)).thenReturn(Optional.of(samplePromotion));
        when(promotionRepository.save(any(Promotion.class))).thenReturn(samplePromotion);
        when(promotionProductRepository.findByPromotionId(anyLong())).thenReturn(new ArrayList<>());

        PromotionResponse result = promotionService.updatePromotion(1L, request);

        assertNotNull(result);
        verify(promotionRepository, times(1)).save(any(Promotion.class));
    }

    @Test
    @DisplayName("Should delete promotion successfully")
    void testDeletePromotion() {
        samplePromotion.setStatus(PromotionStatus.DRAFT);
        when(promotionRepository.findById(1L)).thenReturn(Optional.of(samplePromotion));

        promotionService.deletePromotion(1L);

        verify(promotionRepository, times(1)).delete(samplePromotion);
    }

    @Test
    @DisplayName("Should not delete active promotion")
    void testDeleteActivePromotion() {
        when(promotionRepository.findById(1L)).thenReturn(Optional.of(samplePromotion));

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            promotionService.deletePromotion(1L);
        });
        assertNotNull(exception.getMessage());

        verify(promotionRepository, never()).delete(any(Promotion.class));
    }

    @Test
    @DisplayName("Should expire promotions automatically")
    void testExpirePromotions() {
        samplePromotion.setEndDate(LocalDateTime.now().minusDays(1));
        List<Promotion> expiredPromotions = List.of(samplePromotion);

        when(promotionRepository.findExpiredPromotions(any(LocalDateTime.class))).thenReturn(expiredPromotions);
        when(promotionRepository.save(any(Promotion.class))).thenReturn(samplePromotion);

        promotionService.expirePromotions();

        verify(promotionRepository, times(1)).save(any(Promotion.class));
    }
}
