-- Task comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Allow users to manage comments on their own tasks
CREATE POLICY "Users manage comments on own tasks"
  ON task_comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN versions ON versions.id = tasks.version_id
      JOIN features ON features.id = versions.feature_id
      WHERE tasks.id = task_comments.task_id AND features.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN versions ON versions.id = tasks.version_id
      JOIN features ON features.id = versions.feature_id
      WHERE tasks.id = task_comments.task_id AND features.user_id = auth.uid()
    )
  );
