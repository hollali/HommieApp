# App Assets

This directory should contain the following assets for the Hommie app:

## Required Assets

### 1. `icon.png` (1024x1024px)
- App icon for iOS and Android
- Should be square with rounded corners (Expo will handle the rounding)
- Recommended: Simple "H" logo or house icon in brand color (#0066FF)
- Format: PNG with transparency

### 2. `splash.png` (1242x2436px for iOS, 1284x2778px recommended)
- Splash screen shown when app is loading
- Should contain app logo/name centered
- Background color: #0066FF (brand blue)
- Format: PNG

### 3. `adaptive-icon.png` (1024x1024px)
- Android adaptive icon foreground
- Should be the icon without background (transparent)
- Will be layered on colored background (#0066FF)
- Format: PNG with transparency

### 4. `favicon.png` (48x48px or 192x192px)
- Web favicon
- Simplified version of app icon
- Format: PNG

## Quick Setup

### Option 1: Use Expo Asset Generator
```bash
npx expo-asset-generator
```

### Option 2: Use Online Tools
- Use tools like [App Icon Generator](https://www.appicon.co/) or [MakeAppIcon](https://makeappicon.com/)
- Upload a 1024x1024px square logo
- Download and place files in this directory

### Option 3: Create Manually
1. Design your icon (1024x1024px square)
2. Export as `icon.png`
3. For splash screen, add logo to center of 1242x2436px canvas with #0066FF background
4. Export as `splash.png`
5. Copy icon as `adaptive-icon.png` (foreground only, transparent background)
6. Create 192x192px version as `favicon.png`

## Design Guidelines

- **Brand Color**: #0066FF (Blue)
- **Secondary Color**: #FFF (White)
- **Logo Style**: Modern, minimal, house/home related
- **Typography**: Clean, sans-serif if text is included

## Temporary Placeholders

For development, Expo will use default placeholders if these files are missing. However, for production builds, you must provide all assets.

