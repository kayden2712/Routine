# Test Database Setup Guide

## Mục đích
Tạo một database **riêng biệt** (`routine_test_db`) để test, mà không ảnh hưởng đến database gốc (`routine_db`).

## Setup

### 1️⃣ Tạo Test Database
Chạy file SQL để tạo database test:

```bash
# Trên Windows
cd be
mysql -u root -p < setup-test-database.sql

# Hoặc trên MySQL Workbench/Command Line
mysql> source be\setup-test-database.sql;
```

**Kết quả:**
- Database mới: `routine_test_db`
- User: `routine_user` / `Routine@2026!`

### 2️⃣ Chạy Application với Test Database

#### Option A: Dùng Profile "dev" (Recommended)
```bash
cd be
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=dev"
```

#### Option B: Dùng Environment Variable
```bash
# Windows (PowerShell)
$env:SPRING_PROFILES_ACTIVE="dev"
mvn spring-boot:run

# Linux/Mac
export SPRING_PROFILES_ACTIVE=dev
mvn spring-boot:run
```

#### Option C: Cấu hình IDE
Trong IDE, set environment variable hoặc VM arguments:
```
-Dspring.profiles.active=dev
```

### 3️⃣ Cơ Chế Tự Reset Dữ Liệu

#### Cách hoạt động
- Khi application startup với profile `dev` hoặc `test`:
  - Component `TestDataResetComponent` sẽ tự động chạy
  - Xóa toàn bộ dữ liệu từ tất cả các tables
  - Tuỳ chọn: Seeding lại sample data mới

#### Tùy chỉnh trong `application-dev.properties`:

```properties
# Bật/tắt reset dữ liệu
app.test.reset-data.enabled=true    # true = reset, false = keep data

# Bật/tắt seeding sample data
app.test.data.seed=true              # true = insert sample data, false = skip
```

### 4️⃣ Verify Setup

**Kiểm tra database đã tạo:**
```sql
SHOW DATABASES;
-- Sẽ thấy: routine_db, routine_test_db
```

**Kiểm tra connection:**
```bash
mysql -u routine_user -p'Routine@2026!' -D routine_test_db -e "SELECT DATABASE();"
```

---

## 🔐 Bảo vệ Database Gốc

### Database Gốc (`routine_db`)
- Sử dụng trong production hoặc development chính
- **Không bị reset** khi application startup
- Activate khi **KHÔNG** dùng profile `dev`

### Database Test (`routine_test_db`)
- Sử dụng riêng cho testing
- **TỰ ĐỘNG RESET** mỗi lần startup với profile `dev`
- An toàn xóa/modify dữ liệu

---

## 📋 Quy trình Workflow

```
1. Chạy bình thường (production/dev chính):
   → No profile / default
   → Kết nối routine_db
   → Dữ liệu giữ nguyên

2. Chạy test:
   → Profile: dev
   → Kết nối routine_test_db
   → Dữ liệu tự reset khi startup
   → Test và modify thoải mái

3. Reset test data:
   → Chỉ cần restart application
   → Component tự động clear + reseed (nếu enabled)
```

---

## ⚠️ Lưu ý

- **Reset data chỉ xảy ra khi**:
  - Profile `dev` hoặc `test` được activate
  - `app.test.reset-data.enabled=true`
  
- **Database gốc an toàn vì**:
  - Sử dụng connection URL tới `routine_test_db` khác
  - Application sẽ không thể truy cập database gốc khi profile dev activate

---

## 🔄 Tự Động Reset (Tuỳ chọn)

Nếu muốn reset dữ liệu giữa các test runs mà không restart application:

1. **Tạo endpoint admin:**
   ```java
   @PostMapping("/admin/test/reset-db")
   @PreAuthorize("hasRole('MANAGER')")
   public ResponseEntity<String> resetTestDatabase() {
       // Call testDataResetComponent.resetData()
       return ResponseEntity.ok("Database reset");
   }
   ```

2. **Call endpoint từ test script**

---

## 📞 Troubleshooting

### Q: "Access denied for user 'routine_user'"
**A:** Chạy lại setup-test-database.sql hoặc kiểm tra password

### Q: "Unknown database 'routine_test_db'"
**A:** Database chưa được create, chạy setup SQL script

### Q: "Dữ liệu không reset khi startup"
**A:** Kiểm tra:
- Profile `dev` có được activate?
- `app.test.reset-data.enabled=true` trong application-dev.properties?

### Q: "Muốn giữ dữ liệu giữa startup"
**A:** Set `app.test.reset-data.enabled=false` trong application-dev.properties
