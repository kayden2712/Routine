# Module Quản Lý Khuyến Mãi - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Module Quản Lý Khuyến Mãi cho phép tạo, quản lý và áp dụng các chương trình khuyến mãi vào đơn hàng trong hệ thống Routine.

### Tính Năng Chính
- ✅ Tạo và quản lý chương trình khuyến mãi (CRUD)
- ✅ Hỗ trợ 3 loại khuyến mãi: Giảm %, Giảm tiền, Tặng quà
- ✅ Tự động áp dụng khuyến mãi khi checkout
- ✅ State machine: DRAFT → ACTIVE → EXPIRED/CANCELLED
- ✅ Scheduled job tự động cập nhật trạng thái
- ✅ Phân quyền theo vai trò (Sales Staff, Manager)
- ✅ Log lịch sử sử dụng khuyến mãi

---

## 🗄️ Database Schema

### Bảng `promotions`
```sql
CREATE TABLE promotions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    discount_value DECIMAL(15,2) NOT NULL,
    max_discount_amount DECIMAL(15,2),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    min_order_amount DECIMAL(15,2) DEFAULT 0,
    apply_to_all_products BOOLEAN DEFAULT TRUE,
    usage_limit INT,
    usage_count INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT
);
```

### Bảng `promotion_products`
Liên kết nhiều-nhiều giữa khuyến mãi và sản phẩm.

### Bảng `promotion_usage_log`
Lưu lịch sử áp dụng khuyến mãi vào đơn hàng.

---

## 🔌 API Endpoints

### 1. Lấy danh sách khuyến mãi
```http
GET /api/promotions?status=ACTIVE
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "SUMMER2026",
      "name": "Khuyến mãi mùa hè",
      "type": "GIAM_PHAN_TRAM",
      "discountValue": 20.00,
      "status": "ACTIVE",
      ...
    }
  ]
}
```

### 2. Lấy chi tiết khuyến mãi
```http
GET /api/promotions/{id}
```

### 3. Tạo khuyến mãi mới
```http
POST /api/promotions
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "FLASH15",
  "name": "Flash Sale 15%",
  "description": "Giảm 15% cho tất cả sản phẩm",
  "type": "GIAM_PHAN_TRAM",
  "discountValue": 15.0,
  "maxDiscountAmount": 500000.0,
  "startDate": "2026-06-01T00:00:00",
  "endDate": "2026-06-30T23:59:59",
  "minOrderAmount": 200000.0,
  "applyToAllProducts": true
}
```
**Roles:** `SALES_STAFF`, `MANAGER`

### 4. Cập nhật khuyến mãi
```http
PUT /api/promotions/{id}
Authorization: Bearer <token>
```
**Roles:** `SALES_STAFF`, `MANAGER`

### 5. Xóa khuyến mãi
```http
DELETE /api/promotions/{id}
Authorization: Bearer <token>
```
**Roles:** `MANAGER` only

### 6. Kích hoạt khuyến mãi
```http
POST /api/promotions/{id}/activate
Authorization: Bearer <token>
```
Chuyển trạng thái từ DRAFT → ACTIVE

### 7. Hủy khuyến mãi
```http
POST /api/promotions/{id}/cancel
Authorization: Bearer <token>
```
Chuyển trạng thái sang CANCELLED

### 8. Áp dụng khuyến mãi vào đơn hàng
```http
POST /api/promotions/apply
Content-Type: application/json

{
  "promotionCode": "SUMMER2026",
  "orderAmount": 1000000.0,
  "productIds": [1, 2, 3],
  "customerId": 5
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "applicable": true,
    "message": "Áp dụng khuyến mãi thành công",
    "discountAmount": 200000.0,
    "originalAmount": 1000000.0,
    "finalAmount": 800000.0
  }
}
```

### 9. Kiểm tra khuyến mãi áp dụng được
```http
POST /api/promotions/check
Content-Type: application/json

{
  "orderAmount": 1000000.0,
  "productIds": [1, 2, 3]
}
```

---

## 🎭 State Machine

```
DRAFT ──activate()──> ACTIVE ──expire()──> EXPIRED
  │                      │
  └──cancel()──────────> CANCELLED
```

### Quy tắc chuyển đổi:
- **DRAFT → ACTIVE**: Khi admin kích hoạt hoặc tự động đến `startDate`
- **ACTIVE → EXPIRED**: Tự động khi quá `endDate`
- **DRAFT/ACTIVE → CANCELLED**: Khi quản lý hủy thủ công
- **EXPIRED/CANCELLED**: Không thể chuyển sang trạng thái khác

---

## 🔐 Phân Quyền

| Chức năng | Khách | NV Bán Hàng | Quản Lý |
|-----------|-------|-------------|---------|
| Xem KM | ✅ | ✅ | ✅ |
| Áp dụng KM | ✅ (auto) | ✅ | ✅ |
| Tạo KM | ❌ | ✅ | ✅ |
| Cập nhật KM | ❌ | ✅ | ✅ |
| Xóa KM | ❌ | ❌ | ✅ |

---

## ⚙️ Scheduled Jobs

### 1. Expire Promotions
```java
@Scheduled(cron = "0 */5 * * * *") // Chạy mỗi 5 phút
public void expirePromotions()
```
Tự động chuyển các khuyến mãi hết hạn sang trạng thái EXPIRED.

### 2. Activate Promotions
```java
@Scheduled(cron = "0 */5 * * * *")
public void activatePromotions()
```
Tự động kích hoạt các khuyến mãi khi đến thời gian bắt đầu.

---

## 🎨 Frontend (Admin)

### Trang Quản Lý Khuyến Mãi
**Route:** `/promotions`

**Features:**
- Hiển thị danh sách khuyến mãi với filter theo trạng thái
- Tìm kiếm theo mã, tên, mô tả
- Thống kê nhanh: Tổng số, Đang hoạt động, Nháp, Hết hạn
- Actions: Tạo mới, Chỉnh sửa, Xóa, Kích hoạt, Hủy

### Form Tạo/Chỉnh Sửa
**Fields:**
- Mã khuyến mãi (unique, readonly khi edit)
- Tên chương trình
- Mô tả
- Loại: Giảm %, Giảm tiền, Tặng quà
- Giá trị ưu đãi
- Giảm tối đa (cho giảm %)
- Thời gian bắt đầu/kết thúc
- Giá trị đơn hàng tối thiểu
- Giới hạn số lần sử dụng
- Áp dụng cho tất cả sản phẩm

---

## 🧪 Testing

### Run Unit Tests
```bash
cd be
mvn test -Dtest=PromotionServiceTest
```

### Test Cases Covered:
- ✅ Create promotion
- ✅ Update promotion
- ✅ Delete promotion
- ✅ Activate/Cancel promotion
- ✅ Apply promotion (percentage)
- ✅ Apply promotion (fixed amount)
- ✅ Validate minimum order amount
- ✅ Validate expired promotion
- ✅ Validate usage limit
- ✅ Auto-expire promotions

---

## 🚀 Deployment

### 1. Chạy migration SQL
```bash
mysql -u root -p routine_db < be/src/main/resources/db/migration/V001__create_promotions_tables.sql
```

### 2. Build Backend
```bash
cd be
mvn clean package -DskipTests
```

### 3. Build Frontend
```bash
cd fe/admin
npm install
npm run build
```

### 4. Start Application
```bash
cd be
java -jar target/be-0.0.1-SNAPSHOT.jar
```

---

## 📝 Usage Examples

### Ví dụ 1: Tạo khuyến mãi giảm %
```javascript
const promotion = {
  code: "SUMMER20",
  name: "Giảm 20% mùa hè",
  type: "GIAM_PHAN_TRAM",
  discountValue: 20,
  maxDiscountAmount: 500000,
  startDate: "2026-06-01T00:00:00",
  endDate: "2026-08-31T23:59:59",
  applyToAllProducts: true
};
```

### Ví dụ 2: Tạo khuyến mãi giảm tiền
```javascript
const promotion = {
  code: "SAVE50K",
  name: "Giảm 50K cho đơn từ 500K",
  type: "GIAM_TIEN",
  discountValue: 50000,
  minOrderAmount: 500000,
  startDate: "2026-04-01T00:00:00",
  endDate: "2026-12-31T23:59:59",
  applyToAllProducts: true
};
```

### Ví dụ 3: Áp dụng khuyến mãi trong checkout
```javascript
// 1. Check khuyến mãi áp dụng được
const checkResult = await promotionApi.check({
  orderAmount: 1000000,
  productIds: [1, 2, 3]
});

if (checkResult.hasApplicablePromotions) {
  // 2. Áp dụng khuyến mãi tốt nhất
  const applyResult = await promotionApi.apply({
    promotionCode: checkResult.applicablePromotions[0].code,
    orderAmount: 1000000,
    productIds: [1, 2, 3]
  });
  
  console.log(`Giảm giá: ${applyResult.discountAmount}đ`);
}
```

---

## 🐛 Troubleshooting

### Lỗi: "Mã khuyến mãi đã tồn tại"
**Nguyên nhân:** Code bị trùng  
**Giải pháp:** Sử dụng mã khác hoặc xóa khuyến mãi cũ

### Lỗi: "Không thể kích hoạt khuyến mãi"
**Nguyên nhân:** Khuyến mãi không ở trạng thái DRAFT  
**Giải pháp:** Chỉ có thể kích hoạt khuyến mãi ở trạng thái DRAFT

### Lỗi: "Không thể xóa khuyến mãi đang hoạt động"
**Nguyên nhân:** Khuyến mãi đang ở trạng thái ACTIVE  
**Giải pháp:** Hủy khuyến mãi trước, sau đó mới xóa

---

## 📞 Support

Nếu có vấn đề khi sử dụng module, vui lòng liên hệ:
- **Backend Issues:** Kiểm tra logs tại `be/logs/application.log`
- **Frontend Issues:** Mở Developer Console (F12) để xem lỗi
- **Database Issues:** Kiểm tra kết nối MySQL và chạy lại migration

---

## ✅ Checklist Triển Khai

- [x] Database migration đã chạy
- [x] Backend đã build thành công
- [x] Frontend đã build thành công
- [x] Scheduled jobs đang chạy
- [x] Permissions đã cấu hình đúng
- [ ] Test thủ công tất cả flows
- [ ] Import data mẫu (nếu cần)

---

**Version:** 1.0.0  
**Last Updated:** 2026-04-06  
**Author:** Routine Development Team
