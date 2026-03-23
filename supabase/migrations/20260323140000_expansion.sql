-- =============================================
-- EXPANSION MIGRATION: All new tables & alters
-- =============================================

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own activity" ON activity_log FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id, created_at DESC);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- Task watchers
CREATE TABLE IF NOT EXISTS task_watchers (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);
ALTER TABLE task_watchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watches" ON task_watchers FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sprints
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage sprints of own features" ON sprints FOR ALL
  USING (
    feature_id IS NULL OR
    EXISTS (SELECT 1 FROM features WHERE features.id = sprints.feature_id AND features.user_id = auth.uid())
  )
  WITH CHECK (
    feature_id IS NULL OR
    EXISTS (SELECT 1 FROM features WHERE features.id = sprints.feature_id AND features.user_id = auth.uid())
  );

-- Sprint tasks junction
CREATE TABLE IF NOT EXISTS sprint_tasks (
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (sprint_id, task_id)
);
ALTER TABLE sprint_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sprint_tasks" ON sprint_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sprints
      JOIN features ON features.id = sprints.feature_id
      WHERE sprints.id = sprint_tasks.sprint_id AND features.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sprints
      JOIN features ON features.id = sprints.feature_id
      WHERE sprints.id = sprint_tasks.sprint_id AND features.user_id = auth.uid()
    )
  );

-- Jira connections
CREATE TABLE IF NOT EXISTS jira_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  base_url TEXT NOT NULL,
  email TEXT NOT NULL,
  api_token TEXT NOT NULL,
  project_key TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE jira_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own jira connection" ON jira_connections FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Version templates
CREATE TABLE IF NOT EXISTS version_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE version_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON version_templates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public roadmap tokens
CREATE TABLE IF NOT EXISTS public_roadmap_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public_roadmap_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own token" ON public_roadmap_tokens FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read tokens" ON public_roadmap_tokens FOR SELECT
  USING (true);

-- Alter features: archived_at
ALTER TABLE features ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Alter versions: archived_at + jira_epic_key
ALTER TABLE versions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE versions ADD COLUMN IF NOT EXISTS jira_epic_key TEXT;

-- Alter tasks: jira_issue_key
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS jira_issue_key TEXT;

-- Alter profiles: WSJF weights
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wsjf_bv_weight NUMERIC NOT NULL DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wsjf_tc_weight NUMERIC NOT NULL DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wsjf_rr_weight NUMERIC NOT NULL DEFAULT 1;
