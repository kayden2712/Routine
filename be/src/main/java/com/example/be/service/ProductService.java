package com.example.be.service;

import com.example.be.dto.request.ProductRequest;
import com.example.be.dto.response.ProductResponse;
import com.example.be.entity.Category;
import com.example.be.entity.Product;
import com.example.be.entity.ProductStatus;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.CategoryRepository;
import com.example.be.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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
        if (productRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Product code already exists: " + request.getCode());
        }
        
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        
        Product product = new Product();
        product.setCode(request.getCode());
        product.setName(request.getName());
        product.setCategory(category);
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCostPrice(request.getCostPrice());
        product.setOldPrice(request.getOldPrice());
        product.setStock(request.getStock() != null ? request.getStock() : 0);
        product.setMinStock(request.getMinStock() != null ? request.getMinStock() : 10);
        product.setStatus(ProductStatus.ACTIVE);
        product.setImageUrl(request.getImageUrl());
        product.setSku(request.getSku());
        product.setMaterial(request.getMaterial());
        product.setFit(request.getFit());
        product.setSeason(request.getSeason());
        product.setCareInstructions(request.getCareInstructions());
        
        Product saved = productRepository.save(product);
        return mapToResponse(saved);
    }
    
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        
        if (!product.getCode().equals(request.getCode()) && productRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Product code already exists: " + request.getCode());
        }
        
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        
        product.setCode(request.getCode());
        product.setName(request.getName());
        product.setCategory(category);
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCostPrice(request.getCostPrice());
        product.setOldPrice(request.getOldPrice());
        product.setStock(request.getStock());
        product.setMinStock(request.getMinStock());
        product.setImageUrl(request.getImageUrl());
        product.setSku(request.getSku());
        product.setMaterial(request.getMaterial());
        product.setFit(request.getFit());
        product.setSeason(request.getSeason());
        product.setCareInstructions(request.getCareInstructions());
        
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
                .sku(product.getSku())
                .material(product.getMaterial())
                .fit(product.getFit())
                .season(product.getSeason())
                .careInstructions(product.getCareInstructions())
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .badge(product.getBadge() != null ? product.getBadge().name() : null)
                .createdAt(product.getCreatedAt())
                .build();
    }
}
