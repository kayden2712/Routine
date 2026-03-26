# 🔧 Fix Database Connection Error

## ❌ Current Error
```
Access denied for user 'root'@'localhost' (using password: YES)
```

## ✅ Solutions

### Option 1: Update MySQL Password (Recommended)
1. **Check your MySQL password:**
   ```bash
   # Login to MySQL
   mysql -u root -p
   ```

2. **Update application.properties:**
   ```properties
   spring.datasource.username=root
   spring.datasource.password=YOUR_ACTUAL_PASSWORD
   ```

### Option 2: Create New MySQL User
```sql
-- Login as root
mysql -u root -p

-- Create new user
CREATE USER 'routine_user'@'localhost' IDENTIFIED BY 'Routine@2026!';

-- Grant permissions
GRANT ALL PRIVILEGES ON routine_db.* TO 'routine_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SELECT User, Host FROM mysql.user WHERE User='routine_user';
```

Then update `application.properties`:
```properties
spring.datasource.username=routine_user
spring.datasource.password=Routine@2026!
```

### Option 3: Reset MySQL Root Password

**For Windows:**
```powershell
# Stop MySQL service
net stop MySQL80

# Start MySQL without password check
mysqld --skip-grant-tables --skip-networking

# In another terminal, login without password
mysql -u root

# Reset password
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'NewPassword123!';
FLUSH PRIVILEGES;

# Restart MySQL normally
net start MySQL80
```

**For Linux/Mac:**
```bash
# Stop MySQL
sudo systemctl stop mysql

# Start without password
sudo mysqld_safe --skip-grant-tables &

# Login and reset
mysql -u root
USE mysql;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'NewPassword123!';
FLUSH PRIVILEGES;

# Restart
sudo systemctl start mysql
```

---

## 🚀 Quick Start Script

Create file `setup-database.sql`:
```sql
-- Create database
CREATE DATABASE IF NOT EXISTS routine_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER IF NOT EXISTS 'routine_user'@'localhost' IDENTIFIED BY 'Routine@2026!';

-- Grant permissions
GRANT ALL PRIVILEGES ON routine_db.* TO 'routine_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
USE routine_db;
SHOW TABLES;
```

Run it:
```bash
mysql -u root -p < setup-database.sql
```

---

## 📝 Environment Variables (Best Practice)

Create `.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=routine_db
DB_USERNAME=routine_user
DB_PASSWORD=Routine@2026!

# JWT Secret
JWT_SECRET=YourVerySecureRandomSecretKeyAtLeast256BitsLong123456789012345678901234567890
```

Update `application.properties`:
```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:routine_db}?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:root}

# JWT Configuration
jwt.secret=${JWT_SECRET:YourSuperSecretKeyForJWTTokenGenerationChangeThisInProduction123456789}
```

Add to `.gitignore`:
```
.env
application-local.properties
```

---

## ✅ Verification

After fixing, verify:
```bash
# Test MySQL connection
mysql -u routine_user -p routine_db

# Run Spring Boot
cd be
mvn spring-boot:run
```

Expected output:
```
Started BeApplication in X.XXX seconds
Tomcat started on port(s): 8080 (http)
```

Test endpoints:
```bash
# Health check
curl http://localhost:8080/api/actuator/health

# Swagger UI
http://localhost:8080/api/swagger-ui.html
```

---

## 🔍 Troubleshooting

### Error: "Public Key Retrieval is not allowed"
Add to URL: `allowPublicKeyRetrieval=true` ✅ (Already added)

### Error: "Unknown database 'routine_db'"
Add to URL: `createDatabaseIfNotExist=true` ✅ (Already added)

### Error: "Communications link failure"
- Check if MySQL is running: `systemctl status mysql` (Linux) or `net start MySQL80` (Windows)
- Check port 3306 is open: `netstat -an | findstr 3306`

### Error: "SSL connection error"
Add to URL: `useSSL=false` ✅ (Already added)

---

## 📊 Next Steps After Fix

1. ✅ Fix database connection
2. Run application: `mvn spring-boot:run`
3. Access Swagger: http://localhost:8080/api/swagger-ui.html
4. Test auth endpoints:
   - POST `/api/auth/register/admin`
   - POST `/api/auth/login/admin`
5. Verify database tables created:
   ```sql
   USE routine_db;
   SHOW TABLES;
   DESCRIBE users;
   ```
