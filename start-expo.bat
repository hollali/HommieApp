@echo off
REM Batch script to start Expo with workarounds for Windows
echo Starting Expo development server...
echo.

REM Set environment variable to avoid node:sea issue
set EXPO_NO_METRO_LAZY=1
set EXPO_USE_FAST_RESOLVER=0

REM Try starting Expo
npx expo start --tunnel --clear

pause

