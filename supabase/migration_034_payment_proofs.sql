-- Payment proofs submitted by students when they pay via M-Pesa or Zelle
CREATE TABLE IF NOT EXISTS payment_proofs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  student_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount       numeric     NOT NULL,
  reference    text        NOT NULL,
  payment_date date        NOT NULL,
  screenshot_url text,
  notes        text,
  reviewed     boolean     NOT NULL DEFAULT false,
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

-- Students can only insert proofs for their own invoices
CREATE POLICY "Students can submit own proofs" ON payment_proofs
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Admins can read all proofs
CREATE POLICY "Admins can view all proofs" ON payment_proofs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can mark proofs as reviewed
CREATE POLICY "Admins can update proofs" ON payment_proofs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
