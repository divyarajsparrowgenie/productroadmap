-- =====================================================================
-- PATCH: Gantt Roadmap Features
-- Run this in Supabase SQL Editor at ilflaoqwdlepmaqxcldj.supabase.co
-- Safe to run multiple times (IF NOT EXISTS)
-- =====================================================================

-- Add start_date to versions (enables true Gantt span bars)
ALTER TABLE public.versions ADD COLUMN IF NOT EXISTS start_date DATE;

-- Add color to features (custom feature color on roadmap)
ALTER TABLE public.features ADD COLUMN IF NOT EXISTS color TEXT;

-- ─── Milestones ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.milestones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  date       DATE NOT NULL,
  color      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage milestones of own features" ON public.milestones;
CREATE POLICY "Users manage milestones of own features" ON public.milestones
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.features
    WHERE features.id = milestones.feature_id AND features.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.features
    WHERE features.id = milestones.feature_id AND features.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_milestones_feature_id ON public.milestones(feature_id);

-- ─── Version Dependencies ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.version_dependencies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  target_id       UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocks'
    CHECK (dependency_type IN ('blocks', 'is_blocked_by', 'relates_to')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_id, target_id)
);

ALTER TABLE public.version_dependencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage version deps" ON public.version_dependencies;
CREATE POLICY "Users manage version deps" ON public.version_dependencies
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.versions v
    JOIN public.features f ON f.id = v.feature_id
    WHERE v.id = version_dependencies.source_id AND f.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.versions v
    JOIN public.features f ON f.id = v.feature_id
    WHERE v.id = version_dependencies.source_id AND f.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_version_deps_source ON public.version_dependencies(source_id);
CREATE INDEX IF NOT EXISTS idx_version_deps_target ON public.version_dependencies(target_id);
