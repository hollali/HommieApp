@echo off
REM Quick start script for Expo Go
REM This will try to start Expo with various workarounds

echo.
echo ============================================
echo   Starting Expo Go for Hommie App
echo ============================================
echo.

REM Check Node version
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Current Node.js version: %NODE_VERSION%

echo.
echo NOTE: If you see 'node:sea' error, you need Node.js 20.x LTS
echo Download from: https://nodejs.org/
echo.

REM Set environment variable
set EXPO_NO_METRO_LAZY=1

echo.
echo Starting Expo in tunnel mode...
echo This may take a minute...
echo.

REM Try starting Expo
npx expo start --tunnel --clear

if %errorlevel% neq 0 (
    echo.
    echo ============================================
    echo   STARTUP FAILED
    echo ============================================
    echo.
    echo If you see 'node:sea' error:
    echo   1. Download Node.js 20.x LTS from https://nodejs.org/
    echo   2. Install it (this will replace your current version)
    echo   3. Restart this script
    echo.
    echo Alternative: Use Web version
    echo   Run: npm run web
    echo.
    pause
)
