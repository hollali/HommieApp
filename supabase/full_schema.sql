-- HOMMIE APP: UNIFIED DATABASE SCHEMA
-- This file contains the complete tables, functions, and RLS policies for the project.

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. TABLES

-- Users table (Extends Supabase/Clerk auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- Linked to Auth provider ID
    full_name TEXT,
    phone TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('tenant', 'landlord', 'agent', 'airbnb_host', 'admin', 'super_admin')) DEFAULT 'tenant',
    verification_status TEXT CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')) DEFAULT 'unverified',
    verification_documents TEXT[], -- Array of document URLs
    verification_requested_at TIMESTAMP WITH TIME ZONE,
    subscription_plan TEXT CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')) DEFAULT 'free',
    subscription_status TEXT CHECK (subscription_status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    host_about TEXT,
    host_languages TEXT,
    host_response_rate TEXT,
    host_since TEXT,
    avatar_url TEXT,
    push_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('apartment', 'airbnb', 'hotel', 'hostel', 'house', 'store', 'warehouse', 'office', 'land', 'other')) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    payment_type TEXT CHECK (payment_type IN ('daily', 'weekly', 'monthly')) NOT NULL,
    region TEXT NOT NULL,
    city TEXT NOT NULL,
    area TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    bedrooms INTEGER,
    bathrooms INTEGER,
    furnished BOOLEAN DEFAULT false,
    parking BOOLEAN DEFAULT false,
    amenities TEXT[] DEFAULT '{}',
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')) DEFAULT 'pending',
    is_available BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property images table
CREATE TABLE IF NOT EXISTS public.property_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property Lists (Collections)
CREATE TABLE IF NOT EXISTS public.property_lists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Join table for Property Lists
CREATE TABLE IF NOT EXISTS public.property_list_items (
    list_id UUID REFERENCES public.property_lists(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (list_id, property_id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan TEXT CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')) NOT NULL DEFAULT 'free',
    status TEXT CHECK (status IN ('active', 'expired', 'cancelled')) NOT NULL DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('subscription', 'featured_listing', 'boost', 'verification', 'commission', 'payout', 'booking_payment')),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GHS',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('paystack', 'mobile_money', 'card', 'bank_transfer')),
    reference TEXT NOT NULL UNIQUE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method TEXT CHECK (method IN ('bank', 'mobile_money')) NOT NULL,
    account_details JSONB NOT NULL,
    status TEXT CHECK (status IN ('pending', 'processing', 'paid', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES public.users(id)
);

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participant1_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    participant2_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count_p1 INTEGER DEFAULT 0,
    unread_count_p2 INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT participants_different CHECK (participant1_id != participant2_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    image_url TEXT,
    is_flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('booking', 'payment', 'message', 'approval', 'general')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    target_type TEXT CHECK (target_type IN ('property', 'user')) NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT CHECK (reason IN ('scam', 'incorrect_info', 'inappropriate_content', 'spam', 'other')) NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.users(id)
);

-- Admin Users (Additional bridge for specifically designated admin accounts if needed)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_region ON public.properties(region);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant1_id, participant2_id);

-- 4. TRIGGERS
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4b. MESSAGE MONITORING FUNCTION
CREATE OR REPLACE FUNCTION monitor_message_content()
RETURNS TRIGGER AS $$
DECLARE
    -- Regex for phone numbers (multiple formats)
    phone_regex TEXT := '(\+?233|0)[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{4}';
    -- Keywords suggesting off-platform deals
    off_platform_keywords TEXT[] := ARRAY['whatsapp', 'telegram', 'dm me', 'direct pay', 'call me', '024', '054', '020', '050', '027', '057', '026', '056'];
    keyword TEXT;
    is_airbnb BOOLEAN;
BEGIN
    -- Only strictly monitor Airbnb messages to prevent fraud
    SELECT type = 'airbnb' INTO is_airbnb FROM public.properties WHERE id = NEW.property_id;
    
    IF is_airbnb THEN
        -- Check for phone numbers
        IF NEW.text ~ phone_regex THEN
            NEW.is_flagged := true;
            NEW.flag_reason := 'Phone number detected in Airbnb chat';
        END IF;

        -- Check for keywords
        FOREACH keyword IN ARRAY off_platform_keywords LOOP
            IF LOWER(NEW.text) LIKE '%' || keyword || '%' THEN
                NEW.is_flagged := true;
                NEW.flag_reason := 'Suspicious keyword detected: ' || keyword;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_monitor_message_content ON public.messages;
CREATE TRIGGER tr_monitor_message_content
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION monitor_message_content();

-- 4c. VERIFICATION NOTIFICATION FUNCTION
CREATE OR REPLACE FUNCTION notify_user_verification_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if the status actually changed
    IF (OLD.verification_status IS DISTINCT FROM NEW.verification_status) THEN
        -- Approval Notification
        IF NEW.verification_status = 'verified' THEN
            INSERT INTO public.notifications (user_id, type, title, message, metadata)
            VALUES (
                NEW.id, 
                'approval', 
                'Account Verified! 🎉', 
                'Congratulations! Your identity has been verified. You now have full access to host tools and features.',
                jsonb_build_object('status', 'verified', 'timestamp', NOW())
            );
        -- Rejection Notification
        ELSIF NEW.verification_status = 'rejected' THEN
            INSERT INTO public.notifications (user_id, type, title, message, metadata)
            VALUES (
                NEW.id, 
                'approval', 
                'Verification Update', 
                'Your verification request was not approved. Please review your documents and try again or contact support.',
                jsonb_build_object('status', 'rejected', 'timestamp', NOW())
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_user_verification_update ON public.users;
CREATE TRIGGER tr_notify_user_verification_update
AFTER UPDATE OF verification_status ON public.users
FOR EACH ROW EXECUTE FUNCTION notify_user_verification_update();

-- 4d. PAYOUT NOTIFICATION FUNCTION
CREATE OR REPLACE FUNCTION notify_user_payout_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if the status actually changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Paid Notification
        IF NEW.status = 'paid' THEN
            INSERT INTO public.notifications (user_id, type, title, message, metadata)
            VALUES (
                NEW.user_id, 
                'payment', 
                'Payout Successful! 💰', 
                'Your withdrawal of ' || NEW.amount || ' has been processed successfully.',
                jsonb_build_object('payout_id', NEW.id, 'status', 'paid', 'timestamp', NOW())
            );
        -- Rejection Notification
        ELSIF NEW.status = 'rejected' THEN
            INSERT INTO public.notifications (user_id, type, title, message, metadata)
            VALUES (
                NEW.user_id, 
                'payment', 
                'Payout Request Update', 
                'Your payout request was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided.'),
                jsonb_build_object('payout_id', NEW.id, 'status', 'rejected', 'timestamp', NOW())
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_notify_user_payout_update ON public.payouts;
CREATE TRIGGER tr_notify_user_payout_update
AFTER UPDATE OF status ON public.payouts
FOR EACH ROW EXECUTE FUNCTION notify_user_payout_update();

-- 5. ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check Admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ) OR EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Payouts Policies
DROP POLICY IF EXISTS "Users can view own payouts" ON public.payouts;
CREATE POLICY "Users can view own payouts" ON public.payouts FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users can create payout requests" ON public.payouts;
CREATE POLICY "Users can create payout requests" ON public.payouts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage payouts" ON public.payouts;
CREATE POLICY "Admins can manage payouts" ON public.payouts FOR ALL USING (is_admin());

-- Users Policies
DROP POLICY IF EXISTS "Users can view public profile info" ON public.users;
CREATE POLICY "Users can view public profile info" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Properties Policies
DROP POLICY IF EXISTS "Anyone can view approved properties" ON public.properties;
CREATE POLICY "Anyone can view approved properties" ON public.properties FOR SELECT USING (is_available = true AND status = 'approved');

DROP POLICY IF EXISTS "Owners can view their own properties" ON public.properties;
CREATE POLICY "Owners can view their own properties" ON public.properties FOR SELECT USING (auth.uid() = owner_id OR is_admin());

DROP POLICY IF EXISTS "Owners can update their own properties" ON public.properties;
CREATE POLICY "Owners can update their own properties" ON public.properties FOR UPDATE USING (auth.uid() = owner_id OR is_admin());

DROP POLICY IF EXISTS "Owners can delete their own properties" ON public.properties;
CREATE POLICY "Owners can delete their own properties" ON public.properties FOR DELETE USING (auth.uid() = owner_id OR is_admin());

DROP POLICY IF EXISTS "Authorized roles can create properties" ON public.properties;
CREATE POLICY "Authorized roles can create properties" ON public.properties FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('landlord', 'agent', 'airbnb_host', 'admin'))
);

-- Property Images Policies
DROP POLICY IF EXISTS "Public view images of approved properties" ON public.property_images;
CREATE POLICY "Public view images of approved properties" ON public.property_images FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND (status = 'approved' OR owner_id = auth.uid()))
);

DROP POLICY IF EXISTS "Owners can manage property images" ON public.property_images;
CREATE POLICY "Owners can manage property images" ON public.property_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND (owner_id = auth.uid() OR is_admin()))
);

-- Bookings Policies
DROP POLICY IF EXISTS "Participants can view own bookings" ON public.bookings;
CREATE POLICY "Participants can view own bookings" ON public.bookings FOR SELECT USING (
    auth.uid() = tenant_id OR 
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND (owner_id = auth.uid() OR is_admin()))
);

DROP POLICY IF EXISTS "Tenants can create bookings" ON public.bookings;
CREATE POLICY "Tenants can create bookings" ON public.bookings FOR INSERT WITH CHECK (
    auth.uid() = tenant_id AND
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND type = 'airbnb')
);

DROP POLICY IF EXISTS "Owners can update booking status" ON public.bookings;
CREATE POLICY "Owners can update booking status" ON public.bookings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.properties WHERE id = property_id AND (owner_id = auth.uid() OR is_admin()))
);

-- Conversations Policies
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversations;
CREATE POLICY "Participants can view their conversations" ON public.conversations FOR SELECT USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id OR is_admin()
);
DROP POLICY IF EXISTS "Participants can create conversations" ON public.conversations;
CREATE POLICY "Participants can create conversations" ON public.conversations FOR INSERT WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
);

-- Messages Policies
DROP POLICY IF EXISTS "Participants can view chat messages" ON public.messages;
CREATE POLICY "Participants can view chat messages" ON public.messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id OR is_admin()
);
DROP POLICY IF EXISTS "Senders can insert messages" ON public.messages;
CREATE POLICY "Senders can insert messages" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Reports Policies
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Admins can view and manage reports" ON public.reports;
CREATE POLICY "Admins can view and manage reports" ON public.reports FOR ALL USING (is_admin());
