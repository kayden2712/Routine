# Setup DB (Docker va khong dung Docker)

Tai lieu nay huong dan setup MySQL cho du an Routine theo 2 cach:
- Cach 1: Dung Docker (de, nhanh)
- Cach 2: Khong dung Docker (MySQL cai local)

## 1) Dung Docker

### 1.1 Khoi dong MySQL bang Docker Compose

Tu thu muc goc project, chay:

```bash
docker compose -f docker-compose.mysql.yml up -d mysql
```

Kiem tra container da len:

```bash
docker ps --filter name=routine-mysql
```

### 1.2 Thong tin ket noi mac dinh

Theo file `docker-compose.mysql.yml`:
- Host: `localhost`
- Port: `3306`
- Database: `routine_db`
- User: `routine_user`
- Password: `12345`
- Root password: `12345`

### 1.3 Test ket noi nhanh

```bash
mysql -h127.0.0.1 -uroutine_user -p12345 -e "SELECT 1" routine_db
```

Neu co ket qua, DB da san sang cho backend.

### 1.4 Dung voi backend

Backend mac dinh dang doc:
- DB_USER = `routine_user`
- DB_PASSWORD = `12345`
- DB_HOST = `localhost`
- DB_PORT = `3306`

Nen neu dung Docker theo file compose hien tai thi thuong khong can chinh them.

## 2) Khong dung Docker (MySQL local)

### 2.1 Cai va chay MySQL 8+

Dam bao MySQL dang chay tren may va nghe cong `3306`.

### 2.2 Tao database + user bang script

Tu thu muc goc project, chay:

```bash
mysql -u root -p < be/setup-database.sql
```

Neu can test DB rieng:

```bash
mysql -u root -p < be/setup-test-database.sql
```

### 2.3 Luu y ve mat khau

Script trong `be/setup-database.sql` tao user `routine_user` voi password:
- `Routine@2026!`

Trong khi backend default password la:
- `12345`

Ban can chon 1 trong 2 cach de backend ket noi duoc:

Cach A: Doi password user ve `12345` trong MySQL

```sql
ALTER USER 'routine_user'@'localhost' IDENTIFIED BY '12345';
ALTER USER 'routine_user'@'%' IDENTIFIED BY '12345';
FLUSH PRIVILEGES;
```

Cach B: Giu password `Routine@2026!` va set env khi chay backend

```bash
cd be
DB_PASSWORD='Routine@2026!' ./mvnw spring-boot:run
```

### 2.4 Truong hop khong co user MySQL rieng

Neu ban chay MySQL local nhung chua co user `routine_user` (hoac script khong tao duoc user), lam theo 1 trong 2 cach sau:

Cach A (khuyen nghi): Tao user rieng cho app

```sql
CREATE DATABASE IF NOT EXISTS routine_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'routine_user'@'localhost' IDENTIFIED BY '12345';
CREATE USER IF NOT EXISTS 'routine_user'@'%' IDENTIFIED BY '12345';
GRANT ALL PRIVILEGES ON routine_db.* TO 'routine_user'@'localhost';
GRANT ALL PRIVILEGES ON routine_db.* TO 'routine_user'@'%';
FLUSH PRIVILEGES;
```

Sau do chay backend voi cau hinh mac dinh (khong can set them env).

Cach B (tam thoi): Dung user `root` de chay backend

```bash
cd be
DB_USER=root DB_PASSWORD='<mat_khau_root>' ./mvnw spring-boot:run
```

Luu y:
- Cach B chi nen dung local/dev.
- Khong nen dung `root` trong moi truong test chung hoac production.
- Neu MySQL cua ban dung `auth_socket` cho root (Ubuntu), co the can dang nhap bang `sudo mysql` de tao `routine_user` theo Cach A.

## 3) Kiem tra backend da noi DB

Chay backend:

```bash
cd be
./mvnw spring-boot:run
```

Mo health check:
- `http://localhost:8080/api/actuator/health`

Neu status la `UP`, cau hinh DB co ban da dung.

## 4) Lenh stop Docker MySQL (neu can)

```bash
docker compose -f docker-compose.mysql.yml down
```

Neu muon xoa ca du lieu volume:

```bash
docker compose -f docker-compose.mysql.yml down -v
```
