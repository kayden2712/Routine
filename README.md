# 📦 Routine - E-commerce Management System

Hệ thống quản lý bán lẻ toàn diện gồm 3 thành phần chạy trong cùng workspace:

- **Backend API** (Spring Boot 21) - Xử lý nghiệp vụ và dữ liệu
- **Admin App** (React + Vite) - Ứng dụng quản trị nội bộ
- **Storefront App** (React + Vite) - Ứng dụng bán hàng cho khách

---

## 🏗 Kiến trúc

| Thành phần | Công nghệ | Chức năng |
|-----------|-----------|---------|
| **be/** | Java 21, Spring Boot, JPA, JWT, MySQL 8+, WebSocket | API, xử lý logic, quản lý dữ liệu |
| **fe/admin/** | React 18, Vite, TypeScript, TailwindCSS | POS, quản lý đơn, sản phẩm, kho, báo cáo |
| **fe/storefront/** | React 18, Vite, TypeScript, TailwindCSS | Khách hàng: duyệt sản phẩm, giỏ hàng, đặt hàng |
| **postman/** | Postman Collection | API testing & seed data |

---

## ✅ Yêu cầu môi trường

- **Java**: 21+
- **MySQL**: 8.0+
- **Node.js**: 20+ (LTS)
- **npm**: 10+

---

## 🚀 Cài đặt lần đầu

### 1️⃣ Cài đặt Frontend

```bash
# Storefront
cd fe/storefront
npm install

# Admin
cd ../admin
npm install
```

### 2️⃣ Cài đặt Database

Frontend sẽ tự động sử dụng Maven Wrapper (`be/mvnw.cmd`) - không cần cài Maven global.

**Database chính (production):**
```bash
mysql -u root -p < be\setup-database.sql
```

**Database test (tuỳ chọn - cho testing):**
```bash
mysql -u root -p < be\setup-test-database.sql
```
*Chi tiết: Xem [TEST-DATABASE-SETUP.md](be/TEST-DATABASE-SETUP.md)*

---

## 🎯 Chạy hệ thống

### 🟢 Chạy với Database Gốc (Production)

**Windows:**
```bash
startAll.bat
```

**Linux/Mac:**
```bash
# Coming soon
```

**Kết quả:** chạy backend + 2 frontend trên các cửa sổ terminal riêng

### 🔵 Chạy với Database Test (Recommended for Development)

Database test sẽ **tự động reset** dữ liệu khi startup.

**Windows:**
```bash
startAll-test.bat
```

**Effect:** Backend kết nối `routine_test_db` (tách biệt hoàn toàn từ database gốc)

---

## 📍 Địa chỉ mặc định

| Dịch vụ | URL | Mục đích |
|--------|-----|---------|
| **Backend** | `http://localhost:8080/api` | API endpoints |
| **Swagger UI** | `http://localhost:8080/api/swagger-ui.html` | API documentation |
| **Admin** | `http://localhost:5174` | Quản trị viên |
| **Storefront** | `http://localhost:5173` | Khách hàng |

---

## 🔧 Chạy từng phần riêng

### Backend

```bash
cd be
mvnw.cmd spring-boot:run
```

**Với test database:**
```bash
set SPRING_PROFILES_ACTIVE=dev
mvnw.cmd spring-boot:run
```

### Frontend - Storefront

```bash
cd fe/storefront
npm run dev -- --host 0.0.0.0 --port 5173
```

### Frontend - Admin

```bash
cd fe/admin
npm run dev -- --host 0.0.0.0 --port 5174
```

---

## 🏗 Build & Tests

### Backend

```bash
cd be

# Run tests
mvnw.cmd clean test

# Build JAR
mvnw.cmd clean package

# Build with specific profile
mvnw.cmd clean package -P prod
```

### Frontend

```bash
# Storefront
cd fe/storefront
npm run build

# Admin
cd fe/admin
npm run build
```

---

## 📊 Database Configuration

### Production (default)
- **Database**: `routine_db`
- **User**: `root` (hoặc `routine_user`)
- **Config**: `be/src/main/resources/application.properties`

### Development/Test (profile: dev)
- **Database**: `routine_test_db`
- **User**: `routine_user` / `Routine@2026!`
- **Config**: `be/src/main/resources/application-dev.properties`
- **Feature**: Auto-reset dữ liệu khi startup

---

## ✨ Những tính năng nổi bật

✅ **Real-time Order Tracking** - WebSocket cập nhật trạng thái đơn hàng realtime  
✅ **Admin POS System** - Bán hàng tại quầy, quản lý hàng tồn  
✅ **Inventory Management** - Theo dõi kho, cảnh báo hết hàng  
✅ **Order Lifecycle** - Tạo → Giao → Hoàn/Hủy → Đánh giá  
✅ **Customer Profiles** - Lưu địa chỉ, lịch sử mua hàng  
✅ **Product Gallery** - Hình ảnh sản phẩm, reviews  
✅ **JWT Authentication** - Bảo mật API endpoints  
✅ **Test Database** - Môi trường testing với auto-reset  

---

## 🐛 Troubleshooting

| Vấn đề | Giải pháp |
|--------|----------|
| **Port đã bị chiếm** | Dừng process dùng port, chạy lại script |
| **Backend không khởi động** | Chạy lệnh trong thư mục `be` hoặc kiểm tra Java version |
| **Không kết nối DB** | Xem cấu hình datasource trong `application.properties` |
| **Frontend gọi API lỗi** | Kiểm tra backend có chạy, `VITE_API_URL` đúng |
| **Test DB không reset** | Kiểm tra profile `dev` được activate, `app.test.reset-data.enabled=true` |

---

## 📚 Tài liệu thêm

- [Test Database Setup](be/TEST-DATABASE-SETUP.md) - Hướng dẫn chi tiết test database
- [API Documentation](be/README.md) - Chi tiết backend
- [Error Codes](docs/error-codes.md) - Danh sách lỗi hệ thống

---

## 📁 Cấu trúc thư mục

```
Routine/
├── README.md                              # File này
├── startAll.bat                           # Chạy tất cả với DB gốc
├── startAll-test.bat                      # Chạy tất cả với DB test
├── be/                                    # Backend (Java 21, Spring Boot)
│   ├── src/main/java/com/example/be/
│   ├── src/main/resources/
│   │   ├── application.properties         # Config production
│   │   └── application-dev.properties     # Config test database
│   ├── setup-database.sql                 # SQL tạo DB gốc
│   ├── setup-test-database.sql            # SQL tạo test DB
│   ├── TEST-DATABASE-SETUP.md             # Hướng dẫn test DB
│   └── mvnw.cmd
├── fe/
│   ├── admin/                             # Admin app (React + Vite)
│   │   └── src/
│   └── storefront/                        # Storefront app (React + Vite)
│       └── src/
├── postman/                               # Postman collection & environment
├── testing/                               # Selenium test scripts
└── docs/                                  # Tài liệu
    └── error-codes.md
```

---

## 🎓 Workflow thường gặp

### Phát triển tính năng mới
```bash
# 1. Chạy với test database
startAll-test.bat

# 2. Code bình thường, test DB tự reset mỗi khi restart

# 3. Kiểm tra trước merge
mvnw.cmd clean test   # backend tests
npm run build         # frontend builds
```

### Staging/Demo
```bash
startAll.bat          # Dùng database gốc
```

### Production
```bash
# Build image Docker (coming soon)
docker build -f be/Dockerfile -t routine-backend .
```

---

**Hỗ trợ**: Liên hệ team development hoặc check issues tại repository.

