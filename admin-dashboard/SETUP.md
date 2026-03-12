# Admin Dashboard Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd admin-dashboard
npm install
```

### 2. Environment Setup
Create `.env.local` file in `admin-dashboard/` directory:
```env
# --- Supabase (optional) ---
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# --- Paystack (Payment Processing) ---
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_94e8ce74c095bdd8c38cfdb16476893ff955155d
PAYSTACK_SECRET_KEY=sk_test_1d5d50b36eba97223747ce4f904773e5d39be729
```

**Where to find these:**
- Go to your Supabase project dashboard
- Settings → API
- Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
- Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy "service_role" key → `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 3. Database Setup
Run the SQL migration in Supabase:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/admin-schema.sql`
3. Run the SQL script
4. This creates:
   - `admin_users` table
   - `admin_logs` table
   - `reports` table
   - Adds columns to `properties` and `users` tables

### 4. Create First Admin User

**Option A: Via Supabase Dashboard**
1. Go to Authentication → Users
2. Create a new user (or use existing)
3. Note the user ID
4. Run in SQL Editor:
```sql
INSERT INTO admin_users (id, email, role, full_name)
VALUES ('user-id-here', 'admin@hommie.com', 'super_admin', 'Admin User');
```

**Option B: Via SQL (if user exists)**
```sql
-- First, get the user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'your-admin@email.com';

-- Then insert into admin_users
INSERT INTO admin_users (id, email, role, full_name)
SELECT id, email, 'super_admin', 'Admin User'
FROM auth.users
WHERE email = 'your-admin@email.com';
```

### 5. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

You'll be redirected to `/login` if not authenticated, or `/dashboard` if logged in.

### 6. Login
- Use the admin email and password you created
- After login, you'll see the dashboard

---

## Testing the Dashboard

### Test User Management
1. Go to `/users`
2. Try searching for users
3. Filter by role
4. Test suspend/activate actions

### Test Property Management
1. Go to `/properties`
2. Filter by status (pending, approved, etc.)
3. Click on a property to view details
4. Test approve/reject/verify actions

### Test Reports
1. Go to `/reports`
2. Filter by status
3. Test resolve/dismiss actions
4. Add admin notes

### Test Analytics
1. Go to `/analytics`
2. View charts and statistics
3. Check data visualization

---

## Production Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd admin-dashboard
   vercel
   ```

3. **Set Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.local`

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Alternative: Deploy to Other Platforms

**Netlify:**
- Connect GitHub repository
- Build command: `npm run build`
- Publish directory: `.next`

**Railway/Render:**
- Connect repository
- Set environment variables
- Deploy automatically on push

---

## Troubleshooting

### "Cannot find module" errors
```bash
cd admin-dashboard
rm -rf node_modules package-lock.json
npm install
```

### Authentication not working
- Check `.env.local` has correct Supabase credentials
- Verify Supabase project is active
- Check browser console for errors

### Database errors
- Ensure you've run `admin-schema.sql`
- Check table names match in Supabase
- Verify RLS policies are set correctly

### Charts not showing
- Ensure `recharts` is installed: `npm install recharts`
- Check browser console for errors
- Verify data is being fetched correctly

### Styling issues
- Ensure Tailwind CSS is configured
- Check `globals.css` is imported
- Verify `tailwind.config.js` paths are correct

---

## Security Checklist

- [ ] Service Role Key is only in `.env.local` (not committed)
- [ ] `.env.local` is in `.gitignore`
- [ ] RLS policies are enabled on all tables
- [ ] Admin routes are protected
- [ ] HTTPS is enabled in production
- [ ] Regular security audits planned

---

## Support

For issues or questions:
1. Check `ADMIN_DASHBOARD_STATUS.md` for implementation details
2. Review `README.md` for feature documentation
3. Check Supabase logs for backend errors
4. Review browser console for frontend errors
