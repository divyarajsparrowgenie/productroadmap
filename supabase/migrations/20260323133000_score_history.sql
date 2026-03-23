-- WSJF score history
CREATE TABLE IF NOT EXISTS version_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  business_value INTEGER NOT NULL,
  time_criticality INTEGER NOT NULL,
  risk_reduction INTEGER NOT NULL,
  job_size INTEGER NOT NULL,
  wsjf_score NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE version_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own score history"
  ON version_score_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM versions
      JOIN features ON features.id = versions.feature_id
      WHERE versions.id = version_score_history.version_id AND features.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM versions
      JOIN features ON features.id = versions.feature_id
      WHERE versions.id = version_score_history.version_id AND features.user_id = auth.uid()
    )
  );
