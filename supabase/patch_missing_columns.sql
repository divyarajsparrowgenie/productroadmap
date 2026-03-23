-- =====================================================================
-- PATCH: Add missing columns to existing tables
-- Run this in Supabase SQL Editor if CSV import is failing
-- Safe to run multiple times (IF NOT EXISTS)
-- =====================================================================

-- Add user_id to features (required for RLS + CSV import)
ALTER TABLE public.features ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.features ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add new columns to versions
ALTER TABLE public.versions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.versions ADD COLUMN IF NOT EXISTS jira_epic_key TEXT;

-- Add new columns to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS jira_issue_key TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS watcher_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure RLS policies exist (drop + recreate is safe)
DROP POLICY IF EXISTS "Users can manage own features" ON public.features;
CREATE POLICY "Users can manage own features" ON public.features FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage versions of own features" ON public.versions;
CREATE POLICY "Users can manage versions of own features" ON public.versions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.features WHERE features.id = versions.feature_id AND features.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.features WHERE features.id = versions.feature_id AND features.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage tasks of own features" ON public.tasks;
CREATE POLICY "Users can manage tasks of own features" ON public.tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.versions
    JOIN public.features ON features.id = versions.feature_id
    WHERE versions.id = tasks.version_id AND features.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.versions
    JOIN public.features ON features.id = versions.feature_id
    WHERE versions.id = tasks.version_id AND features.user_id = auth.uid()
  ));

-- Backfill user_id for existing features owned by the current user
-- (run this only if you have existing features without a user_id)
-- UPDATE public.features SET user_id = auth.uid() WHERE user_id IS NULL;
