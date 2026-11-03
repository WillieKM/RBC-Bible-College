-- Community Q&A: scholars and lecturers ask and answer questions; lecturers can
-- mark a best answer and moderate. Run after migration_049_assignment_drafts.sql.
--
-- Accessed only via the service-role admin client (the app checks who may post,
-- mark, and delete), so no RLS policies are needed.
begin;

create table if not exists qa_questions (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid references profiles(id) on delete set null,
  course_id      uuid references courses(id) on delete set null,
  title          text not null,
  body           text not null,
  best_answer_id uuid,
  created_at     timestamptz not null default now()
);

create table if not exists qa_answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references qa_questions(id) on delete cascade,
  author_id   uuid references profiles(id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);

alter table qa_questions drop constraint if exists qa_questions_best_answer_fk;
alter table qa_questions
  add constraint qa_questions_best_answer_fk
  foreign key (best_answer_id) references qa_answers(id) on delete set null;

create index if not exists qa_questions_created_idx on qa_questions (created_at desc);
create index if not exists qa_answers_question_idx on qa_answers (question_id, created_at);

alter table qa_questions enable row level security;
alter table qa_answers enable row level security;
-- No policies: only the service-role key (admin client) can read/write these tables.

commit;
