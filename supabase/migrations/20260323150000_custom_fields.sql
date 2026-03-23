-- Custom field definitions
CREATE TABLE IF NOT EXISTS public.custom_field_defs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text','number','date','url','select','checkbox')),
  entity_type TEXT NOT NULL DEFAULT 'task'
    CHECK (entity_type IN ('feature','version','task')),
  options JSONB,        -- for select type: ["Option A","Option B"]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_field_defs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own field defs" ON public.custom_field_defs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Custom field values
CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_def_id UUID NOT NULL REFERENCES public.custom_field_defs(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (field_def_id, entity_id)
);

ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own field values" ON public.custom_field_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_field_defs
      WHERE custom_field_defs.id = custom_field_values.field_def_id
        AND custom_field_defs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.custom_field_defs
      WHERE custom_field_defs.id = custom_field_values.field_def_id
        AND custom_field_defs.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_cfv_entity ON public.custom_field_values(entity_id);
CREATE INDEX IF NOT EXISTS idx_cfv_def ON public.custom_field_values(field_def_id);
