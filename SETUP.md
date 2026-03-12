# Hommie App - Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Expo Go app installed on your mobile device (iOS/Android)

### 2. Install Dependencies
```bash
npm install
```

### 3. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (note: free tier is sufficient for development)
3. Wait for the project to initialize (takes ~2 minutes)

#### Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Open `supabase/schema.sql` and copy all contents
3. Paste into SQL Editor and click **Run**
4. Open `supabase/rls-policies.sql` and copy all contents
5. Paste into SQL Editor and click **Run**

#### Get API Keys
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

#### Configure Environment Variables
1. Create a file named `.env` in the root directory (same folder as `package.json`).

2. Use `env.example` as the template (copy/paste contents), then fill in values:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Restart Expo after updating `.env`:

```bash
npm start -- --clear
```

### 4. Configure Storage (for property images)

In Supabase dashboard:
1. Go to **Storage**
2. Create a new bucket named `property-images`
3. Set it to **Public** (or configure RLS policies as needed)

### 5. Start the App

```bash
# Start Expo development server
npm start
```

### 6. Run on Device

**Option A: Expo Go (Easiest)**
1. Install **Expo Go** app on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Scan the QR code shown in your terminal
3. The app will load on your device

**Option B: iOS Simulator (Mac only)**
```bash
npm run ios
```

**Option B: Android Emulator**
```bash
npm run android
```

## Testing the App

### 1. Create Test Account
1. Open the app
2. Go through onboarding screens
3. Tap "Sign Up"
4. Create an account with email/password
5. Select your role (Tenant, Landlord, or Agent)

### 2. Add Test Property (Landlord/Agent)
1. Sign in as Landlord or Agent
2. Go to "My Listings" tab
3. Tap "+" to create a listing
4. Fill in property details
5. Save the listing

### 3. Browse Properties (Tenant)
1. Sign in as Tenant
2. Browse properties on Home screen
3. Use Search tab to filter properties
4. Tap a property to view details
5. Book a viewing or save to favorites

## Common Issues

### "Missing Supabase environment variables" warning
- Make sure `.env` file exists in root directory
- Restart Expo server after adding environment variables
- Check that variable names start with `EXPO_PUBLIC_`

### "Property not found" errors
- Verify database schema was run successfully
- Check RLS policies are in place
- Ensure user is authenticated

### Maps not showing
- For iOS: Add Google Maps API key to `app.json`
- For Android: Add Google Maps API key to `app.json`
- See [react-native-maps setup guide](https://github.com/react-native-maps/react-native-maps)

### Images not uploading
- Verify Storage bucket exists in Supabase
- Check bucket permissions (should be public for MVP)
- Ensure image URLs are correct format

## Next Steps

### Production Preparation
1. **Enable Phone Auth** (requires Supabase phone auth setup)
2. **Add Image Upload** functionality
3. **Set up Payment Gateway** (Paystack/Flutterwave)
4. **Configure Push Notifications**
5. **Set up Analytics** (optional)

### App Store Deployment
1. Create EAS account: `npm install -g eas-cli && eas login`
2. Configure app: `eas build:configure`
3. Build for stores: `eas build --platform ios` or `eas build --platform android`
4. Submit to stores: `eas submit`

## Support

For issues or questions:
- Check [Expo documentation](https://docs.expo.dev)
- Check [Supabase documentation](https://supabase.com/docs)
- Open an issue on GitHub

