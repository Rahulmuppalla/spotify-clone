@echo off
echo ===================================================
echo   Spotify Clone - Local Environment Startup Script
echo ===================================================
echo.
echo [1/3] Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/3] Starting Express Backend in a new window...
cd backend
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)
start "Spotify Backend Server" cmd /k "npm run dev"

echo [3/3] Starting Vite React Frontend in a new window...
cd ../frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)
start "Spotify Frontend Server" cmd /k "npm run dev"

echo.
echo ===================================================
echo   Services are starting!
echo   - Frontend: http://localhost:3000
echo   - Backend API: http://localhost:5000
echo ===================================================
echo.
pause
