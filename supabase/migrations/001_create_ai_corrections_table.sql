-- Migration: 001_create_ai_corrections_table
-- Purpose: Store user corrections for AI OCR and categorization errors to feed back into the AI via few-shot prompting.

CREATE TABLE IF NOT EXISTS public.ai_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    raw_name TEXT NOT NULL,
    corrected_category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_corrections_raw_name ON public.ai_corrections(raw_name);

-- Supabase (May 2026+) no longer grants implicit access on public schema tables —
-- without these, all requests from clients fail with 42501 Permission Denied.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_corrections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_corrections TO service_role;

-- Row Level Security (RLS)
ALTER TABLE public.ai_corrections ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their corrections
CREATE POLICY "Users can insert ai corrections"
    ON public.ai_corrections
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Everyone (or service role) can read all corrections to use in prompt
-- We allow anon/authenticated so the Edge Function (using anon key + user auth) can read them.
CREATE POLICY "Users can select all ai corrections"
    ON public.ai_corrections
    FOR SELECT
    TO authenticated
    USING (true);
