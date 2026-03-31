package com.example.be.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.be.dto.request.SubmitProductReviewRequest;
import com.example.be.entity.Customer;
import com.example.be.entity.Order;
import com.example.be.entity.OrderItem;
import com.example.be.entity.OrderStatus;
import com.example.be.entity.Product;
import com.example.be.entity.ProductReview;
import com.example.be.exception.BadRequestException;
import com.example.be.exception.ErrorCode;
import com.example.be.exception.ResourceNotFoundException;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.OrderRepository;
import com.example.be.repository.ProductRepository;
import com.example.be.repository.ProductReviewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderReviewService {

    private static final int MAX_REVIEW_IMAGES = 4;

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductReviewRepository productReviewRepository;

    @Transactional
    public void submitProductReview(Long orderId, SubmitProductReviewRequest request, String customerEmail) {
        Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        validateReviewOwnership(order, customer);
        validateReviewAllowedStatus(order.getStatus());

        Long productId = request.getProductId();
        OrderItem reviewedItem = findReviewedItem(order, productId);

        if (productReviewRepository.existsByProductIdAndCustomerId(productId, customer.getId())) {
            throw new BadRequestException(ErrorCode.REVIEW_ALREADY_SUBMITTED, "You already reviewed this product");
        }

        ProductReview review = new ProductReview();
        review.setProduct(reviewedItem.getProduct());
        review.setCustomer(customer);
        review.setRating(request.getRating());
        review.setComment(request.getComment() == null ? null : request.getComment().trim());
        review.setImageUrls(sanitizeReviewImages(request.getImageUrls()));
        review.setIsVerified(true);
        productReviewRepository.save(review);

        refreshProductRatingStats(reviewedItem.getProduct());
    }

    private void validateReviewOwnership(Order order, Customer customer) {
        if (order.getCustomer() == null || !order.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException(ErrorCode.REVIEW_NOT_OWN_ORDER,
                    "You can only review products from your own orders");
        }
    }

    private void validateReviewAllowedStatus(OrderStatus status) {
        OrderStatus normalizedStatus = status == null ? OrderStatus.PENDING : status;
        if (normalizedStatus != OrderStatus.COMPLETED
                && normalizedStatus != OrderStatus.DELIVERED
                && normalizedStatus != OrderStatus.PAID) {
            throw new BadRequestException(ErrorCode.REVIEW_STATUS_NOT_ALLOWED,
                    "Review is only allowed after successful order completion");
        }
    }

    private OrderItem findReviewedItem(Order order, Long productId) {
        return (order.getItems() == null ? List.<OrderItem>of() : order.getItems())
                .stream()
                .filter(item -> item.getProduct() != null
                        && item.getProduct().getId() != null
                        && item.getProduct().getId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new BadRequestException(ErrorCode.REVIEW_PRODUCT_NOT_IN_ORDER,
                        "Product does not belong to this order"));
    }

    private List<String> sanitizeReviewImages(List<String> imageUrls) {
        List<String> sanitized = (imageUrls == null ? List.<String>of() : imageUrls)
                .stream()
                .map(value -> value == null ? "" : value.trim())
                .filter(value -> !value.isBlank())
                .peek(this::validateImageSource)
                .collect(Collectors.toList());

        if (sanitized.size() > MAX_REVIEW_IMAGES) {
            throw new BadRequestException(ErrorCode.REVIEW_IMAGE_LIMIT_EXCEEDED,
                    "Review can include up to " + MAX_REVIEW_IMAGES + " images");
        }

        return sanitized;
    }

    private void validateImageSource(String value) {
        boolean supportedSource = value.startsWith("data:image/")
                || value.startsWith("https://")
                || value.startsWith("http://");
        if (!supportedSource) {
            throw new BadRequestException(ErrorCode.REVIEW_IMAGE_INVALID_FORMAT, "Invalid review image format");
        }
    }

    private void refreshProductRatingStats(Product product) {
        Double averageRating = productReviewRepository.getAverageRating(product.getId());
        Long reviewCount = productReviewRepository.getReviewCount(product.getId());
        BigDecimal rating = BigDecimal.valueOf(averageRating == null ? 0D : averageRating)
                .setScale(1, RoundingMode.HALF_UP);
        product.setRating(rating);
        product.setReviewCount(reviewCount == null ? 0 : reviewCount.intValue());
        productRepository.save(product);
    }
}
