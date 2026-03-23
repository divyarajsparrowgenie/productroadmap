-- =============================================================
-- COMPLETE SCHEMA — paste entire file into Supabase SQL Editor
-- Project: ilflaoqwdlepmaqxcldj
-- Safe to re-run: uses IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
-- =============================================================

-- ─── 0. Patch columns for pre-existing tables ────────────────
-- These ADD COLUMN IF NOT EXISTS are safe no-ops if the column already exists.
ALTER TABLE IF EXISTS public.features ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.features ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.versions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.versions ADD COLUMN IF NOT EXISTS jira_epic_key TEXT;
ALTER TABLE IF EXISTS public.tasks ADD COLUMN IF NOT EXISTS jira_issue_key TEXT;
ALTER TABLE IF EXISTS public.tasks ADD COLUMN IF NOT EXISTS watcher_count INTEGER NOT NULL DEFAULT 0;

-- ─── 1. Base tables ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned','In Progress','Released','Completed')),
  due_date DATE,
  business_value INTEGER NOT NULL DEFAULT 1 CHECK (business_value BETWEEN 1 AND 10),
  time_criticality INTEGER NOT NULL DEFAULT 1 CHECK (time_criticality BETWEEN 1 AND 10),
  risk_reduction INTEGER NOT NULL DEFAULT 1 CHECK (risk_reduction BETWEEN 1 AND 10),
  job_size INTEGER NOT NULL DEFAULT 1 CHECK (job_size BETWEEN 1 AND 10),
  wsjf_score NUMERIC GENERATED ALWAYS AS (
    (business_value + time_criticality + risk_reduction)::NUMERIC / NULLIF(job_size, 0)
  ) STORED,
  archived_at TIMESTAMPTZ,
  jira_epic_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo','Doing','Done')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 0,
  jira_issue_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_versions_feature_id ON public.versions(feature_id);
CREATE INDEX IF NOT EXISTS idx_tasks_version_id ON public.tasks(version_id);
CREATE INDEX IF NOT EXISTS idx_versions_wsjf ON public.versions(wsjf_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON public.tasks(completed_at);

-- ─── 3. RLS on base tables ───────────────────────────────────
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on features" ON public.features;
DROP POLICY IF EXISTS "Users can manage own features" ON public.features;
CREATE POLICY "Users can manage own features" ON public.features FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow all on versions" ON public.versions;
DROP POLICY IF EXISTS "Users can manage versions of own features" ON public.versions;
CREATE POLICY "Users can manage versions of own features" ON public.versions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.features WHERE features.id = versions.feature_id AND features.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.features WHERE features.id = versions.feature_id AND features.user_id = auth.uid()));

DROP POLICY IF EXISTS "Allow all on tasks" ON public.tasks;
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

-- ─── 4. Profiles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  wsjf_bv_weight NUMERIC NOT NULL DEFAULT 1,
  wsjf_tc_weight NUMERIC NOT NULL DEFAULT 1,
  wsjf_rr_weight NUMERIC NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view all profiles" ON public.profiles;
CREATE POLICY "Users view all profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id, display_name)
SELECT id, split_part(email, '@', 1) FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- assignee_id on tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ─── 5. Tags ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feature_tags (
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (feature_id, tag_id)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own tags" ON public.tags;
CREATE POLICY "Users manage own tags" ON public.tags FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own feature_tags" ON public.feature_tags;
CREATE POLICY "Users manage own feature_tags" ON public.feature_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.features WHERE features.id = feature_tags.feature_id AND features.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.features WHERE features.id = feature_tags.feature_id AND features.user_id = auth.uid()));

-- ─── 6. Task comments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage comments on own tasks" ON public.task_comments;
CREATE POLICY "Users manage comments on own tasks" ON public.task_comments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.versions ON versions.id = tasks.version_id
    JOIN public.features ON features.id = versions.feature_id
    WHERE tasks.id = task_comments.task_id AND features.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.versions ON versions.id = tasks.version_id
    JOIN public.features ON features.id = versions.feature_id
    WHERE tasks.id = task_comments.task_id AND features.user_id = auth.uid()
  ));

-- ─── 7. WSJF score history ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.version_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  business_value INTEGER NOT NULL,
  time_criticality INTEGER NOT NULL,
  risk_reduction INTEGER NOT NULL,
  job_size INTEGER NOT NULL,
  wsjf_score NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.version_score_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own score history" ON public.version_score_history;
CREATE POLICY "Users view own score history" ON public.version_score_history FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.versions
    JOIN public.features ON features.id = versions.feature_id
    WHERE versions.id = version_score_history.version_id AND features.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.versions
    JOIN public.features ON features.id = versions.feature_id
    WHERE versions.id = version_score_history.version_id AND features.user_id = auth.uid()
  ));

-- ─── 8. Activity log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own activity" ON public.activity_log;
CREATE POLICY "Users view own activity" ON public.activity_log FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id, created_at DESC);

-- ─── 9. Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ─── 10. Task watchers ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_watchers (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own watches" ON public.task_watchers;
CREATE POLICY "Users manage own watches" ON public.task_watchers FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── 11. Sprints ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES public.features(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage sprints of own features" ON public.sprints;
CREATE POLICY "Users manage sprints of own features" ON public.sprints FOR ALL
  USING (feature_id IS NULL OR EXISTS (SELECT 1 FROM public.features WHERE features.id = sprints.feature_id AND features.user_id = auth.uid()))
  WITH CHECK (feature_id IS NULL OR EXISTS (SELECT 1 FROM public.features WHERE features.id = sprints.feature_id AND features.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.sprint_tasks (
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (sprint_id, task_id)
);

ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sprint_tasks" ON public.sprint_tasks;
CREATE POLICY "Users manage own sprint_tasks" ON public.sprint_tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.sprints
    LEFT JOIN public.features ON features.id = sprints.feature_id
    WHERE sprints.id = sprint_tasks.sprint_id
      AND (sprints.feature_id IS NULL OR features.user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sprints
    LEFT JOIN public.features ON features.id = sprints.feature_id
    WHERE sprints.id = sprint_tasks.sprint_id
      AND (sprints.feature_id IS NULL OR features.user_id = auth.uid())
  ));

-- ─── 12. Jira connections ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jira_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  base_url TEXT NOT NULL,
  email TEXT NOT NULL,
  api_token TEXT NOT NULL,
  project_key TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jira_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own jira connection" ON public.jira_connections;
CREATE POLICY "Users manage own jira connection" ON public.jira_connections FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── 13. Version templates ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.version_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.version_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own templates" ON public.version_templates;
CREATE POLICY "Users manage own templates" ON public.version_templates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── 14. Public roadmap tokens ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.public_roadmap_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.public_roadmap_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own token" ON public.public_roadmap_tokens;
CREATE POLICY "Users manage own token" ON public.public_roadmap_tokens FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can read tokens" ON public.public_roadmap_tokens;
CREATE POLICY "Public can read tokens" ON public.public_roadmap_tokens FOR SELECT USING (true);
