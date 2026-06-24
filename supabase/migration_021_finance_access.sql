-- Let the owner restrict invoice/payment visibility to specific admins
-- instead of every admin account automatically seeing finances.
alter table profiles add column if not exists finance_access boolean not null default false;

-- Preserve current behavior for existing admins; revoke individually afterward as needed.
update profiles set finance_access = true where role = 'admin';

drop policy if exists "Admin full access on invoices" on invoices;
create policy "Finance admin full access on invoices" on invoices
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin' and finance_access = true)
  );

drop policy if exists "Admin full access on payments" on payments;
create policy "Finance admin full access on payments" on payments
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin' and finance_access = true)
  );
