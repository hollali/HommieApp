# Hommie App Assets

This directory contains logo files and assets for the Hommie rental app.

## Logo Files

### SVG Logos (Vector Format)
- **`logo.svg`** - White "Hommie" logo with house-shaped "O" (for dark backgrounds)
- **`logo-dark.svg`** - Black "Hommie" logo with house-shaped "O" (for light backgrounds)
- **`icon-house-only.svg`** - House icon only (for app icons)
- **`logo-splash.svg`** - Full logo with blue background (for splash screens)

### Logo Design
- **Text**: "Hommie" in bold sans-serif
- **House "O"**: Triangular roof + pentagonal/rectangular base outline
- **Colors**: White (#FFFFFF) or Black (#000000) depending on background
- **Brand Color**: #0066FF (Blue)

## Required App Assets

To generate app assets from the SVG files, see **`GENERATE_LOGO_ASSETS.md`**.

### Quick Checklist
- [ ] `icon.png` (1024x1024px) - App icon
- [ ] `splash.png` (1284x2778px) - Splash screen
- [ ] `adaptive-icon.png` (1024x1024px) - Android adaptive icon
- [ ] `favicon.png` (192x192px) - Web favicon

## Usage in Code

The logo is implemented as a React component:
- **Mobile App**: `components/Logo.tsx`
- **Admin Dashboard**: `admin-dashboard/components/Logo.tsx`

See `LOGO_DESIGN.md` in the root directory for component usage details.

## Design Guidelines

1. **Consistency**: Always use the house-shaped "O" - never replace with regular "O"
2. **Spacing**: Maintain proper spacing between letters
3. **Colors**: Use white on dark backgrounds, black on light backgrounds
4. **Scaling**: SVG files scale perfectly - use them for all sizes
