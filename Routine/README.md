# Routine

Routine là hệ thống quản lý bán lẻ gồm 3 phần chạy trong cùng workspace:

- Backend API để xử lý nghiệp vụ và dữ liệu.
- Admin app cho vận hành nội bộ.
- Storefront app cho khách hàng mua sắm online.

## Thành phần

| Thành phần | Công nghệ chính | Vai trò |
| --- | --- | --- |
| be/ | Java 21, Spring Boot, JPA, Security, WebSocket, MySQL | API, nghiệp vụ, đồng bộ trạng thái đơn hàng |
| fe/admin/ | React 18, Vite, TypeScript, Tailwind CSS, Zustand | POS, sản phẩm, kho, khách hàng, báo cáo |
| fe/storefront/ | React 18, Vite, TypeScript, Tailwind CSS, Zustand | Duyệt sản phẩm, giỏ hàng, checkout, theo dõi đơn |
| postman/ | Postman Collection | Kiểm thử API và dữ liệu mẫu |

## Yêu cầu môi trường

- Java 21+
- MySQL 8+
- Node.js 20+
- npm 10+

## Thiết lập ban đầu

1. Cài dependencies cho hai frontend.

```bash
cd fe/storefront
npm install

cd ../admin
npm install
```

2. Tạo database cho backend.

```bash
mysql -u root -p < be/setup-database.sql
```

3. Nếu muốn dùng database test, tạo thêm schema test.

```bash
mysql -u root -p < be/setup-test-database.sql
```

Chi tiết cho môi trường test nằm trong [be/TEST-DATABASE-SETUP.md](be/TEST-DATABASE-SETUP.md).

## Chạy toàn hệ thống

### Windows

```bash
startAll.bat
```

Chạy backend cùng cả hai frontend với database chính.

```bash
startAll-test.bat
```

Chạy với database test; dữ liệu sẽ được reset theo cấu hình test.

## Chạy từng phần

### Backend

```bash
cd be
mvnw.cmd spring-boot:run
```

Nếu muốn dùng profile dev/test:

```bash
set SPRING_PROFILES_ACTIVE=dev
mvnw.cmd spring-boot:run
```

### Admin app

```bash
cd fe/admin
npm run dev -- --host 0.0.0.0 --port 5174
```

### Storefront app

```bash
cd fe/storefront
npm run dev -- --host 0.0.0.0 --port 5173
```

## Địa chỉ mặc định

| Dịch vụ | URL |
| --- | --- |
| Backend API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/api/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/api/api-docs |
| Admin | http://localhost:5174 |
| Storefront | http://localhost:5173 |

## Build và kiểm tra

### Backend

```bash
cd be
mvnw.cmd clean test
mvnw.cmd clean package
```

### Frontend

```bash
cd fe/admin
npm run build

cd ../storefront
npm run build
```

## Cấu hình phổ biến

- Backend dùng `be/src/main/resources/application.properties` cho môi trường mặc định.
- Backend dev/test dùng `be/src/main/resources/application-dev.properties`.
- Frontend gọi API qua biến `VITE_API_URL`.
- Backend cho phép CORS với `http://localhost:5173` và `http://localhost:5174`.

## Tài liệu liên quan

- [Backend README](be/README.md)
- [Admin README](fe/admin/README.md)
- [Storefront README](fe/storefront/README.md)
- [Test Database Setup](be/TEST-DATABASE-SETUP.md)
- [Error Codes](docs/error-codes.md)

## Cấu trúc thư mục

```text
Routine/
├── README.md
├── startAll.bat
├── startAll-test.bat
├── be/
├── fe/
│   ├── admin/
│   └── storefront/
├── postman/
├── testing/
└── docs/
```

## Ghi chú

- Repo này ưu tiên chạy bằng Maven Wrapper, không cần cài Maven global.
- WebSocket backend handshake tại `/ws`, topic cập nhật trạng thái đơn là `/topic/orders/status-changed`.
- Khi backend không lên, kiểm tra MySQL, profile đang dùng và biến `SPRING_PROFILES_ACTIVE`.

