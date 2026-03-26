# Routine E-commerce Backend

Backend API cho hệ thống Routine E-commerce với 2 frontends: **Admin** (POS) và **Storefront** (Khách hàng).

## 🚀 Tech Stack

- **Java 21**
- **Spring Boot 3.5.12**
- **Spring Security** + JWT Authentication
- **Spring Data JPA** + Hibernate
- **MySQL 8.x**
- **Maven**
- **Lombok**
- **Swagger/OpenAPI 3**

## 📁 Architecture

**Layered Architecture** (4 layers):

```
├── Controller Layer    → REST API endpoints
├── Service Layer       → Business logic
├── Repository Layer    → Data access (JPA)
└── Entity Layer        → Domain models
```

## 🗄️ Database Entities

1. **User** - Admin staff (Manager, Sales, Warehouse, Accountant)
2. **Customer** - Khách hàng (Regular, VIP)
3. **Category** - Danh mục sản phẩm
4. **Product** - Sản phẩm
5. **ProductVariant** - Biến thể (size, màu)
6. **ProductImage** - Ảnh sản phẩm
7. **Order** - Đơn hàng (POS)
8. **OrderItem** - Chi tiết đơn hàng
9. **CartItem** - Giỏ hàng
10. **WishlistItem** - Danh sách yêu thích
11. **DiscountCode** - Mã giảm giá
12. **ProductReview** - Đánh giá sản phẩm

## 🔐 Authentication

**Dual JWT Authentication:**
- **Admin JWT** - Cho User (staff): `/api/auth/admin/login`
- **Customer JWT** - Cho Customer: `/api/auth/customer/login`

**Roles:**
- `MANAGER` - Full access
- `SALES` - POS, Products, Customers, Orders
- `WAREHOUSE` - Inventory, Stock management
- `ACCOUNTANT` - Reports, Invoices
- `CUSTOMER` - Browse, Cart, Wishlist, Orders

## 📡 API Endpoints

### Auth
- `POST /api/auth/admin/register` - Register admin staff
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/customer/register` - Register customer
- `POST /api/auth/customer/login` - Customer login

### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `GET /api/products/category/{categoryId}` - Get products by category
- `GET /api/products/search?query=` - Search products
- `GET /api/products/low-stock` - Get low stock products (Admin)
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/{id}` - Update product (Admin)
- `PUT /api/products/{id}/stock` - Update stock (Admin)
- `DELETE /api/products/{id}` - Delete product (Admin)

### Orders (POS)
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/{id}` - Get order by ID (Admin)
- `GET /api/orders/customer/{customerId}` - Get customer orders (Admin)
- `GET /api/orders/status/{status}` - Get orders by status (Admin)
- `POST /api/orders` - Create order (Admin)
- `PUT /api/orders/{id}/status` - Update order status (Admin)

### Cart (Customer)
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- `PUT /api/cart/{id}` - Update quantity
- `DELETE /api/cart/{id}` - Remove item
- `DELETE /api/cart` - Clear cart

## 🛠️ Setup & Installation

### Prerequisites
- Java 21
- Maven 3.6+
- MySQL 8.x

### 1. Clone & Navigate
```bash
cd D:\Development\Routine\be
```

### 2. Configure Database
Update `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/routine_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_password
```

### 3. Build
```bash
mvn clean install
```

### 4. Run
```bash
mvn spring-boot:run
```

Server starts at: `http://localhost:8080/api`

## 📚 API Documentation

Swagger UI: http://localhost:8080/api/swagger-ui.html

OpenAPI JSON: http://localhost:8080/api/api-docs

## 🔑 Default Admin Account

```
Email: admin@routine.com
Password: admin123
Role: MANAGER
```

## 🌐 CORS Configuration

Allowed origins (configured in `application.properties`):
- `http://localhost:5173` - Admin frontend
- `http://localhost:5174` - Storefront frontend

## 📦 Project Structure

```
be/
├── src/main/java/com/example/be/
│   ├── controller/         # REST Controllers
│   ├── service/            # Business Logic
│   ├── repository/         # Data Access
│   ├── entity/             # JPA Entities
│   ├── dto/
│   │   ├── request/        # Request DTOs
│   │   └── response/       # Response DTOs
│   ├── security/           # JWT & Security
│   ├── config/             # Configurations
│   ├── exception/          # Exception Handling
│   └── BeApplication.java  # Main Application
├── src/main/resources/
│   ├── application.properties
│   └── schema.sql          # Database Schema
└── pom.xml
```

## 🧪 Testing

```bash
mvn test
```

## 📄 License

MIT License

## 👥 Contributors

- Backend Developer: Spring Boot + MySQL + JWT
- Frontend Teams: Admin (React) + Storefront (React)
