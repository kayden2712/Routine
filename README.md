# Routine

Monorepo hệ thống bán lẻ Routine, gồm backend API, admin nội bộ và storefront cho khách hàng.

## Thành phần chính

| Thư mục | Vai trò | Công nghệ chính |
| --- | --- | --- |
| `be/` | Backend API + nghiệp vụ | Java 21, Spring Boot, JPA, Security, WebSocket, MySQL |
| `fe/admin/` | Ứng dụng quản trị nội bộ | React 18, TypeScript, Vite, Tailwind CSS, Zustand |
| `fe/storefront/` | Ứng dụng mua sắm online | React 18, TypeScript, Vite, Tailwind CSS, Zustand |
| `postman/` | Collection kiểm thử API | Postman |

## Yêu cầu môi trường

- Java 21+
- Node.js 20+
- npm 10+
- MySQL 8+

## Thiết lập lần đầu

1. Cài package cho frontend:

```bash
cd fe/admin && npm install
cd ../storefront && npm install
```

2. Khởi tạo database:

```bash
mysql -u root -p < be/setup-database.sql
```

3. (Tuỳ chọn) khởi tạo test database:

```bash
mysql -u root -p < be/setup-test-database.sql
```

## Chạy nhanh toàn hệ thống

### Windows

```bat
startAll.bat
```

Chạy với DB test:

```bat
startAll-test.bat
```

### Linux/macOS

```bash
./startAll.sh
```

## Chạy từng service

### Backend

```bash
cd be
./mvnw spring-boot:run
```

### Admin

```bash
cd fe/admin
npm run dev -- --host 0.0.0.0 --port 5174
```

### Storefront

```bash
cd fe/storefront
npm run dev -- --host 0.0.0.0 --port 5173
```

## URL mặc định

| Dịch vụ | URL |
| --- | --- |
| Backend API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/api/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/api/api-docs |
| Admin | http://localhost:5174 |
| Storefront | http://localhost:5173 |

## Build / Test

### Backend

```bash
cd be
./mvnw clean test
./mvnw clean package
```

### Frontend

```bash
cd fe/admin && npm run build
cd ../storefront && npm run build
```

## Cấu hình quan trọng

- Backend context path: `/api`
- WebSocket endpoint: `/api/ws`
- Topic realtime trạng thái đơn: `/topic/orders/status-changed`
- CORS local mặc định: `http://localhost:5173`, `http://localhost:5174`
- Biến DB backend: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
- Biến frontend gọi API: `VITE_API_URL` (mặc định `http://localhost:8080/api`)

## Tài liệu liên quan

- [Backend README](be/README.md)
- [DB setup (Docker/non-Docker)](docs/setupDB.md)
- [Admin README](fe/admin/README.md)
- [Storefront README](fe/storefront/README.md)
- [Test DB setup](be/TEST-DATABASE-SETUP.md)
- [Error codes](docs/error-codes.md)
