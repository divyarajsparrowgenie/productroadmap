-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feature-tag junction
CREATE TABLE IF NOT EXISTS feature_tags (
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (feature_id, tag_id)
);

-- RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tags"
  ON tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own feature_tags"
  ON feature_tags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM features WHERE features.id = feature_tags.feature_id AND features.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM features WHERE features.id = feature_tags.feature_id AND features.user_id = auth.uid())
  );
