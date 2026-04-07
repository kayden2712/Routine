# Routine Backend

Backend API của Routine phục vụ đồng thời cho admin app và storefront app.

## Công nghệ chính

- Java 21
- Spring Boot 3.5.13
- Spring Web, Spring Data JPA, Spring Security
- JWT cho luồng admin và customer
- Spring WebSocket với STOMP
- MySQL 8+
- Maven Wrapper

## Cấu trúc code

```text
src/main/java/com/example/be/
    controller/   REST controllers
    service/      business logic
    repository/   JPA repositories
    entity/       domain entities
    dto/          request/response models
    security/     JWT filter and auth components
    config/       security, CORS, websocket, init data
    exception/    custom exceptions
```

## Chạy local

```bat
cd be
mvnw.cmd spring-boot:run
```

Mặc định backend chạy tại `http://localhost:8080/api` và dùng database `routine_db`.

### Chạy với profile dev/test

```bat
set SPRING_PROFILES_ACTIVE=dev
mvnw.cmd spring-boot:run
```

Profile `dev` dùng `routine_test_db` và phù hợp cho môi trường phát triển.

## Database

File cấu hình mặc định: `src/main/resources/application.properties`

Giá trị quan trọng:

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `spring.jpa.hibernate.ddl-auto`

Script khởi tạo database nằm ở:

- `setup-database.sql`
- `setup-test-database.sql`

Chi tiết setup test database: [TEST-DATABASE-SETUP.md](TEST-DATABASE-SETUP.md)

## API docs

- Swagger UI: `http://localhost:8080/api/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api/api-docs`

## WebSocket realtime

- Handshake endpoint: `/ws`
- Topic cập nhật trạng thái đơn: `/topic/orders/status-changed`

Admin và storefront có thể subscribe topic này để nhận cập nhật realtime.

## CORS local

Backend cho phép gọi từ:

- `http://localhost:5173`
- `http://localhost:5174`

Danh sách origin nằm tại `cors.allowed-origins` trong `application.properties`.

## Build và test

```bat
cd be
mvnw.cmd clean test
mvnw.cmd clean package
```

## Nghiệp vụ nổi bật

- Quản lý đơn hàng online và offline.
- Kiểm tra tồn kho trước khi xác nhận đơn.
- Theo dõi trạng thái đơn và lịch sử thay đổi.
- Realtime cập nhật trạng thái đơn qua WebSocket.
- Đánh giá sản phẩm sau khi hoàn tất đơn.
- Hỗ trợ đính kèm ảnh trong đánh giá.

## Lưu ý kỹ thuật

- Dự án đang dùng `spring.jpa.hibernate.ddl-auto=update`.
- Khi thay đổi entity, nên restart backend để Hibernate cập nhật schema.
- Nếu frontend không kết nối được, kiểm tra port 8080, MySQL và biến môi trường JWT.
