# Routine

Routine la he thong ban le gom 3 phan chay trong cung workspace:

- Backend API (Spring Boot) xu ly nghiep vu va du lieu.
- Admin app (React + Vite) cho van hanh noi bo.
- Storefront app (React + Vite) cho khach hang mua sam.

## Tong quan thanh phan

- `be`: Backend Java 21, Spring Boot, JPA, JWT, MySQL, WebSocket.
- `fe/admin`: Ung dung quan tri (POS, don hang, san pham, kho, bao cao).
- `fe/storefront`: Ung dung khach hang (duyet san pham, gio hang, dat hang, theo doi don).
- `postman/routine-full-dataset-runner.postman_collection.json`: Bo request phuc vu seed/test API.
- `startAll.bat`: Script chay nhanh toan bo he thong tren Windows.

## Yeu cau moi truong

- Java 21
- MySQL 8+
- Node.js 20+ (khuyen nghi LTS)
- npm 10+

## Cau hinh database backend

Cap nhat thong tin ket noi trong file:

`be/src/main/resources/application.properties`

Gia tri can kiem tra:

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`

## Cai dat lan dau

Tu thu muc goc du an:

```bat
cd fe\storefront
npm install

cd ..\admin
npm install
```

Backend su dung Maven Wrapper (`be/mvnw.cmd`), khong can cai Maven global.

## Chay nhanh toan he thong (Windows)

Tu thu muc goc:

```bat
startAll.bat
```

Script se:

- Kiem tra cac port 8080, 5173, 5174.
- Mo 3 cua so terminal rieng cho backend, storefront, admin.

Dia chi mac dinh:

- Backend API: `http://localhost:8080/api`
- Storefront: `http://localhost:5173`
- Admin: `http://localhost:5174`

## Chay thu cong tung phan

### 1. Backend

```bat
cd be
mvnw.cmd spring-boot:run
```

### 2. Storefront

```bat
cd fe\storefront
npm run dev -- --host 0.0.0.0 --port 5173
```

### 3. Admin

```bat
cd fe\admin
npm run dev -- --host 0.0.0.0 --port 5174
```

## Build va test

### Backend

```bat
cd be
mvnw.cmd clean test
mvnw.cmd clean package
```

### Storefront

```bat
cd fe\storefront
npm run build
```

### Admin

```bat
cd fe\admin
npm run build
```

## API docs

Khi backend dang chay:

- Swagger UI: `http://localhost:8080/api/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api/api-docs`

## Tinh nang noi bat

- Theo doi trang thai don hang realtime qua WebSocket.
- Don online trong admin uu tien cac don vua thay doi trang thai.
- Lich su don cua khach hang tu dong cap nhat theo trang thai moi.
- Ho tro quy trinh huy don, hoan don, xac nhan giao thanh cong.
- Danh gia san pham sau khi don hoan tat, co ho tro dinh kem anh.

## Cau truc thu muc

```text
Routine/
  README.md
  startAll.bat
  be/
  fe/
    admin/
    storefront/
  postman/
  testing/
```

## Troubleshooting

- Port da duoc su dung: dung process dang chiem 8080/5173/5174 roi chay lai.
- Backend khong len: chay lenh trong dung thu muc `be` (hoac dung `-f .\be\pom.xml` neu chay tu root).
- Khong ket noi duoc DB: kiem tra lai cau hinh datasource trong `application.properties`.
- Frontend goi API loi: dam bao backend da chay va `VITE_API_URL` dung.
