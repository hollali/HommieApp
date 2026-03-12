@echo off
echo ========================================
echo Starting Expo Go for Hommie App
echo ========================================
echo.

REM Disable problematic features
set EXPO_NO_METRO_LAZY=1

REM Try tunnel mode first (most reliable on Windows)
echo Attempting to start Expo in TUNNEL mode...
echo This will create a public URL that works from anywhere
echo.
npx expo start --tunnel --clear

pause

