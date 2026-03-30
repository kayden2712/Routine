package com.example.be.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.ProductRequest;
import com.example.be.dto.response.ProductResponse;
import com.example.be.dto.response.ProductVariantResponse;
import com.example.be.entity.Category;
import com.example.be.entity.Product;
import com.example.be.entity.ProductGender;
import com.example.be.entity.ProductImage;
import com.example.be.entity.ProductStatus;
import com.example.be.entity.ProductVariant;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.CategoryRepository;
import com.example.be.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToResponse(product);
    }

    public List<ProductResponse> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryIdAndStatus(categoryId, ProductStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProductResponse> searchProducts(String search) {
        return productRepository.searchProducts(search).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        String normalizedCode = normalizeProductCode(request.getCode());

        if (productRepository.existsByNormalizedCode(normalizedCode)) {
            throw new BadRequestException("Product code already exists: " + normalizedCode);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        Product product = new Product();
        product.setCode(normalizedCode);
        product.setName(request.getName());
        product.setCategory(category);
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCostPrice(request.getCostPrice());
        product.setOldPrice(request.getOldPrice());
        Integer defaultStock = request.getStock();
        Integer defaultMinStock = request.getMinStock();
        product.setStock(defaultStock != null ? defaultStock.intValue() : 0);
        product.setMinStock(defaultMinStock != null ? defaultMinStock.intValue() : 10);
        product.setStatus(ProductStatus.ACTIVE);
        product.setSku(request.getSku());
        product.setMaterial(request.getMaterial());
        product.setFit(request.getFit());
        product.setSeason(request.getSeason());
        product.setCareInstructions(request.getCareInstructions());
        product.setTargetGender(parseGender(request.getGender()));
        syncVariants(product, request);
        syncImages(product, request);

        Product saved = productRepository.save(product);
        return mapToResponse(saved);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        String normalizedCode = normalizeProductCode(request.getCode());

        if (!product.getCode().equalsIgnoreCase(normalizedCode)
                && productRepository.existsByNormalizedCodeAndIdNot(normalizedCode, id)) {
            throw new BadRequestException("Product code already exists: " + normalizedCode);
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        product.setCode(normalizedCode);
        product.setName(request.getName());
        product.setCategory(category);
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCostPrice(request.getCostPrice());
        product.setOldPrice(request.getOldPrice());
        Integer updateStock = request.getStock();
        Integer updateMinStock = request.getMinStock();
        product.setStock(updateStock != null ? updateStock.intValue() : 0);
        product.setMinStock(updateMinStock != null ? updateMinStock.intValue() : 10);
        product.setSku(request.getSku());
        product.setMaterial(request.getMaterial());
        product.setFit(request.getFit());
        product.setSeason(request.getSeason());
        product.setCareInstructions(request.getCareInstructions());
        product.setTargetGender(parseGender(request.getGender()));
        syncVariants(product, request);
        syncImages(product, request);

        Product updated = productRepository.save(product);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        productRepository.delete(product);
    }

    @Transactional
    public ProductResponse updateStock(Long id, Integer stock) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setStock(stock);
        if (stock <= 0) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else {
            product.setStatus(ProductStatus.ACTIVE);
        }

        Product updated = productRepository.save(product);
        return mapToResponse(updated);
    }

    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .code(product.getCode())
                .name(product.getName())
                .categoryName(product.getCategory().getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .costPrice(product.getCostPrice())
                .oldPrice(product.getOldPrice())
                .stock(product.getStock())
                .minStock(product.getMinStock())
                .status(product.getStatus().name())
                .imageUrl(product.getImageUrl())
                .imageUrls(resolveImageUrls(product))
                .sku(product.getSku())
                .material(product.getMaterial())
                .fit(product.getFit())
                .season(product.getSeason())
                .careInstructions(product.getCareInstructions())
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .badge(product.getBadge() != null ? product.getBadge().name() : null)
                .gender(product.getTargetGender() != null ? product.getTargetGender().name() : null)
                .colors(product.getVariants().stream()
                        .map(ProductVariant::getColor)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList()))
                .sizes(product.getVariants().stream()
                        .map(ProductVariant::getSize)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList()))
                .variants(product.getVariants().stream()
                        .map(variant -> ProductVariantResponse.builder()
                                .size(variant.getSize())
                                .color(variant.getColor())
                                .stock(variant.getStock())
                                .build())
                        .collect(Collectors.toList()))
                .createdAt(product.getCreatedAt())
                .build();
    }

    private List<String> resolveImageUrls(Product product) {
        List<String> urls = product.getImages().stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(image -> {
                    Integer order = image.getDisplayOrder();
                    return order != null ? order : Integer.MAX_VALUE;
                }))
                .map(ProductImage::getImageUrl)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(url -> !url.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        if (urls.isEmpty() && product.getImageUrl() != null && !product.getImageUrl().isBlank()) {
            urls.add(product.getImageUrl().trim());
        }

        return urls;
    }

    private ProductGender parseGender(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if ("MALE".equals(normalized)) {
            return ProductGender.MALE;
        }
        if ("FEMALE".equals(normalized)) {
            return ProductGender.FEMALE;
        }

        throw new BadRequestException("Invalid gender value: " + value);
    }

    private void syncVariants(Product product, ProductRequest request) {
        List<ProductRequest.ProductVariantRequest> manualVariants = request.getVariants();
        List<String> sizes = request.getSizes();
        List<String> colors = request.getColors();
        Map<String, Integer> sizeStocks = request.getSizeStocks();

        boolean hasExistingVariants = product.getId() != null && !product.getVariants().isEmpty();
        product.getVariants().clear();
        if (hasExistingVariants) {
            // Force delete existing rows first to avoid hitting
            // unique(product_id,size,color)
            // when re-adding variants in the same transaction.
            productRepository.flush();
        }

        if (manualVariants != null && !manualVariants.isEmpty()) {
            Set<String> uniqueVariantKeys = new HashSet<>();

            for (ProductRequest.ProductVariantRequest manualVariant : manualVariants) {
                if (manualVariant == null || manualVariant.getSize() == null || manualVariant.getColor() == null
                        || manualVariant.getSize().isBlank() || manualVariant.getColor().isBlank()) {
                    continue;
                }

                String normalizedSize = manualVariant.getSize().trim().toUpperCase(Locale.ROOT);
                String normalizedColor = manualVariant.getColor().trim().toLowerCase(Locale.ROOT);
                String uniqueKey = normalizedSize + "::" + normalizedColor;
                if (!uniqueVariantKeys.add(uniqueKey)) {
                    throw new BadRequestException("Duplicate variant: " + normalizedSize + "/" + normalizedColor);
                }

                ProductVariant variant = new ProductVariant();
                variant.setProduct(product);
                variant.setSize(normalizedSize);
                variant.setColor(normalizedColor);
                Integer manualStock = manualVariant.getStock();
                variant.setStock(Math.max(0, manualStock != null ? manualStock.intValue() : 0));
                product.getVariants().add(variant);
            }

            return;
        }

        if (sizes == null || sizes.isEmpty()) {
            return;
        }

        String fallbackColor = (colors != null && !colors.isEmpty() && colors.get(0) != null
                && !colors.get(0).isBlank())
                        ? colors.get(0).trim().toLowerCase(Locale.ROOT)
                        : "black";

        Integer requestedBaseStock = request.getStock();
        int baseStock = requestedBaseStock != null ? requestedBaseStock.intValue() : 0;

        for (int i = 0; i < sizes.size(); i++) {
            String size = sizes.get(i);
            if (size == null || size.isBlank()) {
                continue;
            }

            String color = fallbackColor;
            if (colors != null && !colors.isEmpty()) {
                String candidate = colors.get(i % colors.size());
                if (candidate != null && !candidate.isBlank()) {
                    color = candidate.trim().toLowerCase(Locale.ROOT);
                }
            }

            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);
            variant.setSize(size.trim().toUpperCase(Locale.ROOT));
            variant.setColor(color);
            int variantStock = baseStock;
            if (sizeStocks != null) {
                Integer requestedStock = sizeStocks.get(variant.getSize());
                if (requestedStock != null) {
                    variantStock = Math.max(0, requestedStock);
                }
            }
            variant.setStock(variantStock);
            product.getVariants().add(variant);
        }
    }

    private void syncImages(Product product, ProductRequest request) {
        List<String> normalizedImageUrls = normalizeImageUrls(request);

        product.getImages().clear();

        for (int i = 0; i < normalizedImageUrls.size(); i++) {
            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setImageUrl(normalizedImageUrls.get(i));
            image.setDisplayOrder(i);
            product.getImages().add(image);
        }

        product.setImageUrl(resolvePrimaryImageUrl(normalizedImageUrls));
    }

    private String resolvePrimaryImageUrl(List<String> normalizedImageUrls) {
        if (normalizedImageUrls.isEmpty()) {
            return null;
        }

        String primary = normalizedImageUrls.get(0);
        if (primary.startsWith("data:")) {
            // Keep base64 images in product_images table and avoid legacy-length column
            // overflow.
            return null;
        }

        return primary;
    }

    private List<String> normalizeImageUrls(ProductRequest request) {
        List<String> normalized = new ArrayList<>();

        if (request.getImageUrls() != null) {
            for (String imageUrl : request.getImageUrls()) {
                if (imageUrl == null) {
                    continue;
                }

                String trimmed = imageUrl.trim();
                if (trimmed.isEmpty() || normalized.contains(trimmed)) {
                    continue;
                }

                normalized.add(trimmed);
            }
        }

        String fallbackImageUrl = request.getImageUrl();
        if (fallbackImageUrl != null) {
            String trimmedFallback = fallbackImageUrl.trim();
            if (!trimmedFallback.isEmpty() && !normalized.contains(trimmedFallback)) {
                normalized.add(0, trimmedFallback);
            }
        }

        return normalized;
    }

    private String normalizeProductCode(String code) {
        if (code == null || code.isBlank()) {
            throw new BadRequestException("Product code is required");
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }
}
