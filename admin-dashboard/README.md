# Hommie Admin Dashboard

Web-based admin dashboard for managing the Hommie rental platform.

## 📝 Mock Data Setup (Current)

This admin dashboard currently uses **mock data** stored in `localStorage`. No Supabase connection is required!

### Demo Login Credentials

**Email:** `admin@hommie.com`  
**Password:** Any password works (for demo purposes)

Other admin emails you can try:
- `moderator@hommie.com`
- `support@hommie.com`

### Mock Data Includes

✅ Complete admin dashboard with sample data:
- **10 mock users** (tenants, landlords, agents)
- **25 mock properties** (various types and statuses)
- **8 mock reports**
- **20 admin activity logs**
- Dashboard stats and analytics

✅ All features work without Supabase:
- User management (suspend/activate)
- Property management (approve/reject/suspend/verify)
- Reports management (resolve/dismiss)
- Analytics with charts
- Activity logs (complete audit trail)
- Revenue tracking
- Subscription management
- Featured listings management
- Payment history

### Converting to Real Supabase

When ready to connect to Supabase:
1. Add your Supabase credentials to `.env.local`
2. Run `supabase/admin-schema.sql` in Supabase SQL Editor
3. Replace `lib/mockData.ts` imports with `lib/supabase.ts` in all pages
4. Update authentication flow in `app/login/page.tsx`

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons
- **State Management**: TanStack React Query
- **Backend**: Supabase
- **Charts**: Recharts

## Features

### ✅ Implemented (MVP)

1. **Authentication**
   - Admin login page
   - Protected routes with middleware
   - Session management

2. **Dashboard Overview**
   - KPI cards (Users, Listings, Approvals, Reports)
   - Recent activity feed
   - Real-time stats

3. **User Management**
   - View all users with filters
   - Search by name, email, phone
  - Filter by role (tenant, airbnb_host, landlord, agent, admin, super_admin)
   - Suspend/Activate users
   - User details display

4. **Property Management**
   - View all listings
   - Filter by status (pending, approved, rejected, suspended)
   - Approve/Reject/Suspend listings
   - Verify listings
   - Search properties
   - View property details

5. **Reports Management**
   - View all reports from mobile app
   - Filter by status (pending, resolved, dismissed)
   - Resolve or dismiss reports
   - Add admin notes
   - Report details with reporter info

6. **Analytics**
   - Listings by location (bar chart)
   - Property types distribution (pie chart)
   - Price distribution (bar chart)
   - Summary statistics

7. **Activity Logs** ✅
   - Complete audit trail of all admin actions
   - Filter by action type and admin user
   - Search functionality
   - Detailed action information with timestamps

8. **Revenue & Payments** ✅
   - Revenue overview with comprehensive stats
   - Payment history tracking
   - CSV export functionality
   - Transaction filtering and search

9. **Subscriptions** ✅
   - View all user subscriptions
   - Filter by plan and status
   - Cancel subscriptions
   - Collect payments via Paystack

10. **Featured Listings** ✅
    - Manage featured and boosted listings
    - Track active boosts
    - Collect payments for featured listings
    - View boost statistics

## Setup

### 1. Install Dependencies

```bash
cd admin-dashboard
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:

```env
# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Paystack (Payment Processing)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
```

**Important:** 
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for public keys)
- Variables without `NEXT_PUBLIC_` are server-side only (use for secret keys)
- Never commit `.env.local` to version control

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Design

The admin dashboard follows the same design language as the mobile app:
- **Primary Color**: #0066FF (Blue)
- **Background**: #F8F8F8 (Light gray)
- **Surface**: #FFFFFF (White)
- **Typography**: Inter font family
- **Border Radius**: 12px (xl), 16px (2xl)
- **Spacing**: Consistent 4px grid

## Database Schema Requirements

### Additional Tables Needed

1. **admin_users** (for production)
   ```sql
   CREATE TABLE admin_users (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     email TEXT UNIQUE NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator', 'support')),
     full_name TEXT,
     last_login TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **admin_logs**
   ```sql
   CREATE TABLE admin_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     admin_id UUID REFERENCES admin_users(id),
     action TEXT NOT NULL,
     entity_type TEXT NOT NULL,
     entity_id UUID NOT NULL,
     details JSONB,
     timestamp TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **reports**
   ```sql
   CREATE TABLE reports (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     reporter_id UUID REFERENCES users(id),
     target_type TEXT NOT NULL CHECK (target_type IN ('property', 'user')),
     target_id UUID NOT NULL,
     reason TEXT NOT NULL CHECK (reason IN ('scam', 'incorrect_info', 'inappropriate_content', 'spam', 'other')),
     description TEXT,
     status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
     admin_notes TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     resolved_at TIMESTAMPTZ,
     resolved_by UUID REFERENCES admin_users(id)
   );
   ```

4. **properties** table needs:
   - `status` column (pending, approved, rejected, suspended)
   - `is_verified` boolean column
   - `updated_at` timestamp

## Future Enhancements

- [x] Admin activity logs page ✅
- [x] Settings page (manage admins, system config) ✅
- [ ] Bulk actions (approve/reject multiple listings)
- [x] Export data (CSV/Excel) ✅ (Payments page has CSV export)
- [ ] Advanced filters and sorting
- [ ] Real-time notifications
- [ ] Dark mode
- [ ] Two-factor authentication
- [ ] Automated moderation (AI)

## Production Deployment

1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy to Vercel (recommended):
   ```bash
   npm install -g vercel
   vercel
   ```

3. Set environment variables in Vercel dashboard

4. Configure custom domain (optional)

## Security Notes

- Always use Service Role Key server-side only
- Implement proper RBAC (Role-Based Access Control)
- Add rate limiting for API routes
- Enable 2FA for admin accounts
- Log all admin actions
- Regular security audits
