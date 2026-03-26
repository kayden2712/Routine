# 🚀 Routine - Full Stack Application Setup Guide

## Cấu trúc dự án
```
Routine/
├── be/              # Backend (Spring Boot Java)
├── fe/              # Frontend Projects
│   ├── admin/       # Admin Dashboard (React)
│   └── storefront/  # Storefront (React)
└── docker-compose.yml
```

## 🎯 Các cách chạy dự án

### Cách 1: Chạy với Docker (Khuyên dùng)

#### Yêu cầu:
- Docker Desktop cài đặt và đang chạy
- Docker Compose

#### Bước 1: Xây dựng và chạy tất cả services
**Trên Windows:**
```bash
.\start-dev.bat
```

**Trên macOS/Linux:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Hoặc chạy trực tiếp:**
```bash
docker-compose up -d
```

#### Bước 2: Truy cập ứng dụng
- **Admin Dashboard**: http://localhost:5173
- **Storefront**: http://localhost:5174
- **Backend API**: http://localhost:8080
- **Database**: localhost:3306

#### Xem logs
```bash
# Tất cả logs
docker-compose logs -f

# Logs backend
docker-compose logs -f backend

# Logs admin
docker-compose logs -f admin

# Logs storefront
docker-compose logs -f storefront
```

#### Dừng services
```bash
docker-compose down

# Dừng và xóa dữ liệu (bao gồm database)
docker-compose down -v
```

---

### Cách 2: Chạy Local Development (Manual)

#### Backend (Spring Boot)

**Yêu cầu:**
- Java 21+
- MySQL 8.0

**Chạy:**
```bash
cd be
./mvnw spring-boot:run
```

Hoặc trên Windows:
```bash
cd be
mvnw.cmd spring-boot:run
```

**Truy cập**: http://localhost:8080

---

#### Frontend Admin (React)

**Yêu cầu:**
- Node.js 18+
- npm/yarn

**Cài dependencies:**
```bash
cd fe/admin
npm install
```

**Chạy development server:**
```bash
npm run dev
```

**Truy cập**: http://localhost:5173

---

#### Frontend Storefront (React)

**Yêu cầu:**
- Node.js 18+
- npm/yarn

**Cài dependencies:**
```bash
cd fe/storefront
npm install
```

**Chạy development server:**
```bash
npm run dev
```

**Truy cập**: http://localhost:5174

---

## 🔧 Cấu hình API

### Admin Dashboard
File: `fe/admin/src/config/api.ts` (hoặc tương tự)
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

### Storefront
File: `fe/storefront/src/config/api.ts` (hoặc tương tự)
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

---

## 📊 Database

### Credentials (Docker)
- **Host**: localhost
- **Port**: 3306
- **Username**: routine_user
- **Password**: routine_password
- **Database**: routine_db

### Chạy SQL scripts
```bash
# Vào MySQL container
docker-compose exec mysql mysql -u routine_user -proutine_password routine_db < setup-database.sql
```

---

## 🛑 Troubleshooting

### Docker issues
```bash
# Xem tất cả containers
docker ps -a

# Xem logs chi tiết
docker-compose logs --tail=100

# Rebuild images
docker-compose build --no-cache
```

### Port conflicts
Nếu port đã được sử dụng, sửa `docker-compose.yml`:
- Backend: thay `8080` bằng port khác
- Admin: thay `5173` bằng port khác
- Storefront: thay `5174` bằng port khác

### Cơ sở dữ liệu không kết nối
1. Đảm bảo MySQL container đang chạy: `docker-compose ps`
2. Kiểm tra credentials trong `docker-compose.yml`
3. Xem logs MySQL: `docker-compose logs mysql`

---

## 📝 Lưu ý

- Cổng mặc định:
  - Admin: 5173
  - Storefront: 5174
  - Backend: 8080
  - MySQL: 3306

- Để thay đổi cấu hình, chỉnh sửa `docker-compose.yml`

- Dữ liệu MySQL được lưu trong volume `mysql_data` (không bị xóa khi stop containers)

---

## 🎓 Development Workflow

### Phát triển Backend
```bash
cd be
./mvnw clean package  # Build
./mvnw spring-boot:run  # Run
```

### Phát triển Frontend
```bash
# Admin
cd fe/admin
npm run dev   # Development
npm run build  # Production build

# Storefront
cd fe/storefront
npm run dev   # Development
npm run build  # Production build
```

---

## 🚀 Deployment

Khi sẵn sàng deploy:
```bash
# Build production images
docker-compose build

# Run in production
docker-compose -f docker-compose.yml up -d
```

---

**✅ Bây giờ bạn có thể chạy toàn bộ dự án với một lệnh!**
