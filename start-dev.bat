@echo off
REM Colors and formatting (Windows batch doesn't support colors well, so we'll use simple output)
setlocal enabledelayedexpansion

echo.
echo ==============================================
echo   Starting Routine Application
echo ==============================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo.
    echo Error: Docker is not running. Please start Docker and try again.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

echo Starting services with Docker Compose...
echo.
docker-compose up -d

REM Wait for services to be ready
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak

REM Show service status
echo.
echo ==============================================
echo   Service Status
echo ==============================================
echo.
echo Backend (Spring Boot): http://localhost:8080
echo Admin Dashboard:      http://localhost:5173
echo Storefront:           http://localhost:5174
echo Database (MySQL):     localhost:3306
echo.

echo ==============================================
echo   Container Status
echo ==============================================
echo.
docker-compose ps

echo.
echo [OK] All services are starting!
echo.
echo Commands:
echo   - View logs:       docker-compose logs -f
echo   - Stop services:   docker-compose down
echo   - View specific:   docker-compose logs -f backend
echo.
pause
