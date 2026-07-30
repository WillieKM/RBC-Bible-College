CREATE TABLE professor_hours (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date          date NOT NULL,
  hours         numeric(5,2) NOT NULL CHECK (hours > 0),
  category      text NOT NULL DEFAULT 'Teaching',
  description   text,
  approved      boolean NOT NULL DEFAULT false,
  approved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE professor_hours ENABLE ROW LEVEL SECURITY;

-- Professors can view their own hours
CREATE POLICY "professor_read_own_hours" ON professor_hours
  FOR SELECT USING (professor_id = auth.uid());

-- Admins have full access
CREATE POLICY "admin_all_hours" ON professor_hours
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
