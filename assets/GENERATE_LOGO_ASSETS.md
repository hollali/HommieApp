# Generate Logo Assets for Hommie App

This guide explains how to generate app icons, splash screens, and other assets from the SVG logo files.

## Logo Files Available

1. **`logo.svg`** - White logo on transparent background (for dark backgrounds)
2. **`logo-dark.svg`** - Black logo on transparent background (for light backgrounds)
3. **`icon-house-only.svg`** - House icon only (for app icon)
4. **`logo-splash.svg`** - Full logo with blue background (for splash screen)

## Required App Assets

### 1. App Icon (`icon.png`)
- **Size**: 1024x1024px
- **Source**: Use `icon-house-only.svg`
- **Background**: #0066FF (brand blue)
- **Format**: PNG with transparency

**Steps:**
1. Open `icon-house-only.svg` in a design tool (Figma, Illustrator, Inkscape)
2. Set canvas to 1024x1024px
3. Center the house icon
4. Add #0066FF background
5. Export as PNG

### 2. Splash Screen (`splash.png`)
- **Size**: 1242x2436px (iOS) or 1284x2778px (recommended)
- **Source**: Use `logo-splash.svg` or `logo.svg`
- **Background**: #0066FF
- **Format**: PNG

**Steps:**
1. Create canvas: 1284x2778px
2. Fill background with #0066FF
3. Center the logo (from `logo.svg` or `logo-splash.svg`)
4. Scale logo appropriately (about 300-400px height)
5. Export as PNG

### 3. Adaptive Icon (`adaptive-icon.png`)
- **Size**: 1024x1024px
- **Source**: Use `icon-house-only.svg`
- **Background**: Transparent (will be layered on #0066FF)
- **Format**: PNG with transparency

**Steps:**
1. Open `icon-house-only.svg`
2. Set canvas to 1024x1024px
3. Center the house icon
4. Keep background transparent
5. Export as PNG

### 4. Favicon (`favicon.png`)
- **Size**: 192x192px or 512x512px
- **Source**: Use `icon-house-only.svg`
- **Background**: #0066FF or transparent
- **Format**: PNG

**Steps:**
1. Open `icon-house-only.svg`
2. Set canvas to 192x192px (or 512x512px)
3. Center the house icon
4. Add #0066FF background (optional)
5. Export as PNG

## Quick Generation Tools

### Option 1: Online Tools
1. **SVG to PNG Converter**: [CloudConvert](https://cloudconvert.com/svg-to-png) or [Convertio](https://convertio.co/svg-png/)
2. **App Icon Generator**: [AppIcon.co](https://www.appicon.co/) or [MakeAppIcon](https://makeappicon.com/)
   - Upload `icon-house-only.svg`
   - Select sizes needed
   - Download generated icons

### Option 2: Design Software
- **Figma**: Import SVG, resize, export PNG
- **Adobe Illustrator**: Open SVG, resize, export PNG
- **Inkscape** (Free): Open SVG, resize, export PNG
- **Sketch**: Import SVG, resize, export PNG

### Option 3: Command Line (ImageMagick)
```bash
# Install ImageMagick first
# Convert SVG to PNG at specific size
convert -background "#0066FF" -resize 1024x1024 icon-house-only.svg icon.png

# For splash screen
convert -background "#0066FF" -resize 1284x2778 -gravity center logo.svg splash.png
```

## Asset Specifications Summary

| Asset | Size | Source | Background | Format |
|-------|------|--------|------------|--------|
| `icon.png` | 1024x1024 | `icon-house-only.svg` | #0066FF | PNG |
| `splash.png` | 1284x2778 | `logo.svg` | #0066FF | PNG |
| `adaptive-icon.png` | 1024x1024 | `icon-house-only.svg` | Transparent | PNG |
| `favicon.png` | 192x192 | `icon-house-only.svg` | #0066FF | PNG |

## Design Guidelines

- **Brand Color**: #0066FF (Blue)
- **Logo Color**: White (#FFFFFF) on dark backgrounds, Black (#000000) on light backgrounds
- **House Icon**: Triangular roof + pentagonal/rectangular base outline
- **Typography**: Bold, sans-serif (Arial or similar)
- **Spacing**: Maintain proper spacing around logo elements

## Notes

- All SVG files use viewBox for scalability
- House icon proportions: Roof height ≈ 40% of total height, Base height ≈ 60%
- Logo text: "H" + House "O" + "mmie"
- The house "O" should align with the text baseline
