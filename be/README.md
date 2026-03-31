# Routine Backend (`be`)

Backend API cho hệ thống Routine, phục vụ đồng thời:

- Admin app (nội bộ).
- Storefront app (khách hàng).

## Công nghệ

- Java 21
- Spring Boot 3.5.x
- Spring Web, Spring Data JPA, Spring Security
- JWT (admin và customer)
- MySQL 8+
- Spring WebSocket (STOMP broker nội bộ)
- Maven Wrapper (`mvnw.cmd`)

## Cấu trúc code

```text
src/main/java/com/example/be/
	controller/     REST controllers
	service/        business logic
	repository/     JPA repositories
	entity/         domain entities
	dto/            request/response models
	security/       JWT filter + auth components
	config/         security, CORS, websocket, init data
	exception/      custom exceptions
```

## Thiết lập và chạy

### 1. Cấu hình database

File cấu hình: `src/main/resources/application.properties`

Các thuộc tính quan trọng:

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`

### 2. Chạy local

```bat
cd be
mvnw.cmd spring-boot:run
```

Base URL mặc định: `http://localhost:8080/api`

## Build và test

```bat
cd be
mvnw.cmd clean test
mvnw.cmd clean package
```

## API docs

- Swagger UI: `http://localhost:8080/api/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api/api-docs`

## Nghiệp vụ nổi bật

- Luồng đơn hàng online/offline.
- Kiểm tra tồn kho khi xác nhận đơn.
- Quản lý trạng thái đơn, lịch sử trạng thái và timeline tracking.
- Realtime thông báo đổi trạng thái đơn qua WebSocket topic.
- Khách hàng gửi đánh giá sản phẩm sau đơn thành công.
- Đánh giá hỗ trợ đính kèm ảnh (`imageUrls`).

## Realtime (WebSocket)

- Endpoint handshake: `/ws`
- Broker topic: `/topic/orders/status-changed`

Storefront và admin có thể subscribe topic để cập nhật trạng thái đơn theo thời gian thực.

## CORS local

Mặc định cho phép:

- `http://localhost:5173` (storefront)
- `http://localhost:5174` (admin)

Giá trị cấu hình tại `cors.allowed-origins` trong `application.properties`.

## Lưu ý

- Dự án đang dùng `spring.jpa.hibernate.ddl-auto=update`, schema sẽ tự cập nhật khi thêm trường mới.
- Khi thay đổi entity, nên chạy lại backend để Hibernate cập nhật bảng.
