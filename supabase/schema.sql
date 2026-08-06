-- ==========================================================
-- STICKLE SUPABASE DATABASE SCHEMA
-- Phase 12: Public Waitlist Table & RLS Policies
-- ==========================================================

-- 1. Create Waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  use_case TEXT DEFAULT 'General',
  source TEXT DEFAULT 'homepage',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public/Anonymous users can insert waitlist entries
CREATE POLICY "Enable public insert for waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- 4. Policy: Only service role can read/manage waitlist entries
CREATE POLICY "Enable service role read for waitlist"
  ON public.waitlist FOR SELECT
  USING (auth.role() = 'service_role');
