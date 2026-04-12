package com.example.be.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.be.dto.request.SubmitProductReviewRequest;
import com.example.be.entity.Customer;
import com.example.be.entity.Order;
import com.example.be.entity.OrderItem;
import com.example.be.entity.OrderStatus;
import com.example.be.entity.Product;
import com.example.be.entity.ProductReview;
import com.example.be.exception.BadRequestException;
import com.example.be.repository.CustomerRepository;
import com.example.be.repository.OrderRepository;
import com.example.be.repository.ProductRepository;
import com.example.be.repository.ProductReviewRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class OrderReviewServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductReviewRepository productReviewRepository;

    @InjectMocks
    private OrderReviewService orderReviewService;

    @Test
    void submitProductReviewSuccess() {
        Customer customer = new Customer();
        customer.setId(2L);
        customer.setEmail("customer@routine.vn");

        Product product = new Product();
        product.setId(7L);
        product.setCode("P001");
        product.setName("Routine Tee");
        product.setPrice(BigDecimal.valueOf(200000));

        OrderItem item = new OrderItem();
        item.setProduct(product);

        Order order = new Order();
        order.setId(20L);
        order.setCustomer(customer);
        order.setStatus(OrderStatus.COMPLETED);
        order.setItems(List.of(item));

        SubmitProductReviewRequest request = new SubmitProductReviewRequest(
                7L,
                5,
                "  rat tot  ",
                List.of(" https://img.example/1.jpg "));

        when(customerRepository.findByEmail("customer@routine.vn")).thenReturn(Optional.of(customer));
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(productReviewRepository.existsByProductIdAndCustomerId(7L, 2L)).thenReturn(false);
        when(productReviewRepository.getAverageRating(7L)).thenReturn(4.25);
        when(productReviewRepository.getReviewCount(7L)).thenReturn(3L);

        orderReviewService.submitProductReview(20L, request, "customer@routine.vn");

        ArgumentCaptor<ProductReview> reviewCaptor = ArgumentCaptor.forClass(ProductReview.class);
        verify(productReviewRepository).save(reviewCaptor.capture());
        ProductReview savedReview = reviewCaptor.getValue();
        assertEquals("rat tot", savedReview.getComment());
        assertEquals(true, savedReview.getIsVerified());
        assertEquals(1, savedReview.getImageUrls().size());
        assertEquals("https://img.example/1.jpg", savedReview.getImageUrls().get(0));

        verify(productRepository).save(product);
        assertEquals(BigDecimal.valueOf(4.3), product.getRating());
        assertEquals(3, product.getReviewCount());
    }

    @Test
    void submitProductReviewRejectsInvalidOrderStatus() {
        Customer customer = new Customer();
        customer.setId(2L);

        Product product = new Product();
        product.setId(7L);

        OrderItem item = new OrderItem();
        item.setProduct(product);

        Order order = new Order();
        order.setCustomer(customer);
        order.setStatus(OrderStatus.PENDING);
        order.setItems(List.of(item));

        SubmitProductReviewRequest request = new SubmitProductReviewRequest(7L, 4, "ok", List.of());

        when(customerRepository.findByEmail("customer@routine.vn")).thenReturn(Optional.of(customer));
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> orderReviewService.submitProductReview(20L, request, "customer@routine.vn"));
        assertNotNull(exception.getMessage());
    }

    @Test
    void submitProductReviewRejectsInvalidImageSource() {
        Customer customer = new Customer();
        customer.setId(2L);

        Product product = new Product();
        product.setId(7L);

        OrderItem item = new OrderItem();
        item.setProduct(product);

        Order order = new Order();
        order.setCustomer(customer);
        order.setStatus(OrderStatus.COMPLETED);
        order.setItems(List.of(item));

        SubmitProductReviewRequest request = new SubmitProductReviewRequest(7L, 4, "ok", List.of("ftp://image.jpg"));

        when(customerRepository.findByEmail("customer@routine.vn")).thenReturn(Optional.of(customer));
        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(productReviewRepository.existsByProductIdAndCustomerId(7L, 2L)).thenReturn(false);

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> orderReviewService.submitProductReview(20L, request, "customer@routine.vn"));
        assertNotNull(exception.getMessage());
    }
}
