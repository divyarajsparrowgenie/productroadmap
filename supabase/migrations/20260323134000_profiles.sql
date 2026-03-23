-- Profiles table (one per auth user)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view all profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Add assignee_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
