# Routine Backend

Backend API phục vụ cả Admin và Storefront.

## Công nghệ

- Java 21
- Spring Boot 3.5.x
- Spring Web, Spring Data JPA, Spring Security
- JWT Authentication
- Spring WebSocket (STOMP)
- MySQL 8+
- Maven Wrapper

## Cấu trúc chính

```text
src/main/java/com/example/be/
  controller/   REST endpoints
  service/      business logic
  repository/   JPA repository
  entity/       domain models
  dto/          request/response
  security/     JWT + auth filters
  config/       security, cors, websocket
  exception/    error handling
```

## Chạy local

### Linux/macOS

```bash
cd be
./mvnw spring-boot:run
```

### Windows

```bat
cd be
mvnw.cmd spring-boot:run
```

Backend chạy tại: `http://localhost:8080/api`

## Cấu hình database

File mặc định: `src/main/resources/application.properties`

Biến môi trường hỗ trợ:

- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `3306`)
- `DB_USER` (default: `routine_user`)
- `DB_PASSWORD` (default: `12345`)

Script SQL:

- `setup-database.sql`
- `setup-test-database.sql`

Chi tiết môi trường test: [TEST-DATABASE-SETUP.md](TEST-DATABASE-SETUP.md)

## API docs

- Swagger UI: `http://localhost:8080/api/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api/api-docs`

## Realtime

- STOMP endpoint: `/api/ws`
- Broker topic: `/topic/orders/status-changed`
- App prefix: `/app`

## Build / Test

### Linux/macOS

```bash
cd be
./mvnw clean test
./mvnw clean package
```

### Windows

```bat
cd be
mvnw.cmd clean test
mvnw.cmd clean package
```

## Ghi chú

- Context path backend là `/api`.
- CORS local cho frontend: `http://localhost:5173`, `http://localhost:5174`.
- Khi đổi entity, nên restart backend để Hibernate cập nhật schema.
