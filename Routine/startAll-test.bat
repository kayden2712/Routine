@echo off
setlocal

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

echo ========================================
echo Routine - Start All Services (TEST DB)
echo Root: %ROOT_DIR%
echo Using Database: routine_test_db
echo Auto-reset enabled: Yes
echo ========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm not found. Please install Node.js and reopen terminal.
  exit /b 1
)

if not exist "%ROOT_DIR%\be\mvnw.cmd" (
  echo [ERROR] Backend wrapper not found: %ROOT_DIR%\be\mvnw.cmd
  exit /b 1
)

for %%P in (8080 5173 5174) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    echo [ERROR] Port %%P is already in use by PID %%A.
    echo [HINT] Close the existing process, then run startAll-test.bat again.
    exit /b 1
  )
)

echo Starting backend on http://localhost:8080 (with TEST database: routine_test_db)...
start "Routine Backend (TEST)" cmd /k "cd /d "%ROOT_DIR%\be" && set SPRING_PROFILES_ACTIVE=dev && call mvnw.cmd spring-boot:run"

echo Starting storefront on http://localhost:5173 ...
start "Routine Storefront" cmd /k "cd /d "%ROOT_DIR%\fe\storefront" && npm run dev -- --host 0.0.0.0 --port 5173"

echo Starting admin on http://localhost:5174 ...
start "Routine Admin" cmd /k "cd /d "%ROOT_DIR%\fe\admin" && npm run dev -- --host 0.0.0.0 --port 5174"

echo.
echo ========================================
echo All services started in separate windows!
echo ========================================
echo.
echo Frontend URLs:
echo   Admin:      http://localhost:5174
echo   Storefront: http://localhost:5173
echo.
echo Backend API: http://localhost:8080/api
echo.
echo Database: routine_test_db (auto-reset enabled)
echo.
echo Close this window or keep it for logs.

endlocal
