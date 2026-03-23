-- Add user_id to features for per-user data isolation
ALTER TABLE features ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to scope by user
-- Features
DROP POLICY IF EXISTS "Allow all features" ON features;
CREATE POLICY "Users can manage own features"
  ON features FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Versions (scoped through features)
DROP POLICY IF EXISTS "Allow all versions" ON versions;
CREATE POLICY "Users can manage versions of own features"
  ON versions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM features WHERE features.id = versions.feature_id AND features.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM features WHERE features.id = versions.feature_id AND features.user_id = auth.uid())
  );

-- Tasks (scoped through versions -> features)
DROP POLICY IF EXISTS "Allow all tasks" ON tasks;
CREATE POLICY "Users can manage tasks of own features"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM versions
      JOIN features ON features.id = versions.feature_id
      WHERE versions.id = tasks.version_id AND features.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM versions
      JOIN features ON features.id = versions.feature_id
      WHERE versions.id = tasks.version_id AND features.user_id = auth.uid()
    )
  );
