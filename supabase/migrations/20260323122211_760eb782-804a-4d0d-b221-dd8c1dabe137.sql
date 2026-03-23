
-- Create features table
CREATE TABLE public.features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create versions table with WSJF fields
CREATE TABLE public.versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Released', 'Completed')),
  due_date DATE,
  business_value INTEGER NOT NULL DEFAULT 1 CHECK (business_value BETWEEN 1 AND 10),
  time_criticality INTEGER NOT NULL DEFAULT 1 CHECK (time_criticality BETWEEN 1 AND 10),
  risk_reduction INTEGER NOT NULL DEFAULT 1 CHECK (risk_reduction BETWEEN 1 AND 10),
  job_size INTEGER NOT NULL DEFAULT 1 CHECK (job_size BETWEEN 1 AND 10),
  wsjf_score NUMERIC GENERATED ALWAYS AS (
    (business_value + time_criticality + risk_reduction)::NUMERIC / NULLIF(job_size, 0)
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo', 'Doing', 'Done')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Since this is a personal tool with no auth, allow all operations
CREATE POLICY "Allow all on features" ON public.features FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on versions" ON public.versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_versions_feature_id ON public.versions(feature_id);
CREATE INDEX idx_tasks_version_id ON public.tasks(version_id);
CREATE INDEX idx_versions_wsjf ON public.versions(wsjf_score DESC NULLS LAST);
CREATE INDEX idx_tasks_completed_at ON public.tasks(completed_at);
