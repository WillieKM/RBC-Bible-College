-- ─── Invoices ─────────────────────────────────────────────────────────────────
create table if not exists invoices (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references profiles(id) on delete cascade,
  title        text not null,
  total_amount numeric(10,2) not null,
  notes        text,
  created_at   timestamptz not null default now()
);
alter table invoices enable row level security;

create policy "Admin full access on invoices" on invoices
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Student read own invoices" on invoices
  for select using (student_id = auth.uid());

-- ─── Payments ─────────────────────────────────────────────────────────────────
create table if not exists payments (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  amount       numeric(10,2) not null,
  payment_date date not null default current_date,
  method       text not null default 'cash'
                 check (method in ('cash', 'mpesa', 'bank', 'card', 'other')),
  reference    text,
  notes        text,
  created_at   timestamptz not null default now()
);
alter table payments enable row level security;

create policy "Admin full access on payments" on payments
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Student read own payments" on payments
  for select using (
    exists (select 1 from invoices where id = invoice_id and student_id = auth.uid())
  );
