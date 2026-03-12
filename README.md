# Hommie - Ghana Rental Marketplace App

A production-ready React Native mobile app for finding and listing rental properties in Ghana. Built with Expo, TypeScript, and Supabase.

## Features

- **Multi-Role Support**: Tenant, Landlord, and Agent roles
- **Property Types**: Hostels, Apartments, Stores/Shops, Airbnbs, and more
- **Authentication**: Email/Password and Phone OTP (Ghana numbers)
- **Property Search & Filters**: Location, price, type, amenities
- **Favorites**: Save properties for later
- **Booking System**: Schedule property viewings
- **Ghana-Specific**: Pre-configured regions, cities, GHS currency, WhatsApp integration

## Tech Stack

- **Frontend**: React Native + Expo (SDK 50)
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Maps**: React Native Maps

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

## Deploy Landing + Admin to Vercel (Recommended)

This repo contains **two apps**:

- **Mobile app (Expo)**: this folder (root)
- **Web app (Landing + Admin, Next.js)**: `admin-dashboard/`

For **Option A** (single deployment hosting both **Landing** and **Admin**), deploy the Next.js app on Vercel.

### Vercel setup

1. Create a new project in Vercel and import this repo.
2. Set **Root Directory** to `admin-dashboard`.
   - Landing is served at `/` (it renders `app/landing/page.tsx`)
   - Admin routes live under `/dashboard`, `/users`, etc.
3. Add environment variables in Vercel:

```env
# Paystack (required for real payments + mobile app API calls)
PAYSTACK_SECRET_KEY=sk_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_...

# Optional: Supabase (when enabling real data)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=

# Optional: Clerk (if enabled in admin-dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

### Mobile app Paystack API URL (important)

The mobile app initializes Paystack payments via the deployed web app API routes.
Set this in your mobile app `.env`:

```env
EXPO_PUBLIC_PAYSTACK_BACKEND_URL=https://YOUR_VERCEL_PROJECT.vercel.app
```

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema:
   - Copy contents of `supabase/schema.sql` and run in Supabase SQL Editor
   - Copy contents of `supabase/rls-policies.sql` and run in Supabase SQL Editor
3. Configure environment variables:
   - Create `.env` file in root directory (same folder as `package.json`):
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Template available in `env.example`.

### 3. Run the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### 4. Test with Expo Go

1. Install Expo Go app on your mobile device
2. Scan the QR code from the terminal
3. The app will load on your device

## Project Structure

```
app/
 ├── (auth)/          # Authentication screens
 │   ├── onboarding.tsx
 │   ├── login.tsx
 │   ├── signup.tsx
 │   ├── phone-otp.tsx
 │   └── role-selection.tsx
 ├── (tabs)/          # Main tab navigation
 │   ├── home.tsx
 │   ├── search.tsx
 │   ├── favorites.tsx
 │   ├── listings.tsx
 │   └── profile.tsx
 ├── property/
 │   └── [id].tsx     # Property details
 └── _layout.tsx      # Root layout

lib/
 ├── supabase.ts      # Supabase client
 ├── types.ts         # TypeScript types
 └── constants.ts     # App constants (Ghana regions, etc.)

supabase/
 ├── schema.sql       # Database schema
 └── rls-policies.sql # Row Level Security policies
```

## Database Schema

### Tables
- `users` - User profiles with roles
- `properties` - Property listings
- `property_images` - Property photos
- `bookings` - Viewing appointments
- `favorites` - Saved properties

See `supabase/schema.sql` for full schema details.

## Features in Development

- [ ] Payment integration (Paystack/Flutterwave)
- [ ] In-app messaging
- [ ] Push notifications
- [ ] Image upload functionality
- [ ] Admin dashboard
- [ ] Advanced search filters
- [ ] Property analytics for landlords

## Environment Setup

Make sure you have:
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android)
- Expo Go app on your mobile device

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.

