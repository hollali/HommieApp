
import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local from admin-dashboard directory
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncAdmin() {
  console.log('🚀 Starting Admin Sync...');

  try {
    // 1. Fetch users from Clerk
    const { data: users } = await clerkClient.users.getUserList();
    
    if (users.length === 0) {
      console.log('❌ No users found in Clerk.');
      return;
    }

    console.log(`Found ${users.length} users in Clerk.`);

    for (const user of users) {
      const email = user.emailAddresses[0]?.emailAddress;
      console.log(`Syncing user: ${email} (${user.id})`);

      // 2. Insert into public.users
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin User',
          email: email,
          role: 'super_admin', // Force admin role for sync script
          verification_status: 'verified',
          created_at: new Date(user.createdAt).toISOString(),
        });

      if (userError) {
        console.error(`❌ Error syncing user to public.users:`, userError.message);
        continue;
      }

      // 3. Insert into public.admin_users
      const { error: adminError } = await supabase
        .from('admin_users')
        .upsert({
          id: user.id,
          assigned_at: new Date().toISOString(),
        });

      if (adminError) {
        console.error(`❌ Error syncing user to public.admin_users:`, adminError.message);
      } else {
        console.log(`✅ Successfully synced ${email} as Admin!`);
      }
    }

    console.log('\n✨ Sync completed!');
    console.log('You can now log in to the admin dashboard with your Clerk account.');

  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
  }
}

syncAdmin();
