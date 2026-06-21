export type Role = "admin" | "professor" | "student";
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  program_id: string | null;
  student_number: string | null;
  avatar_url: string | null;
  payment_status: PaymentStatus;
  completed_at: string | null;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  program_level: ProgramLevel;
  professor_id: string | null;
  fee: number | null;
  created_at: string;
}

export type ApplicationStatus = "pending" | "approved" | "rejected";
export type ProgramLevel = "diploma" | "degree";
export type ApplicationRegion = "usa" | "international";

export interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  program: string;
  program_level: ProgramLevel;
  region: ApplicationRegion | null;
  declaration_accepted: boolean;
  statement: string | null;
  photo_url: string | null;
  details: Record<string, unknown>;
  status: ApplicationStatus;
  cohort_id: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface Cohort {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  cohort_id: string | null;
  program_id: string | null;
  title: string;
  code: string | null;
  description: string | null;
  credits: number | null;
  professor_id: string | null;
  prerequisite_id: string | null;
  release_days: number | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_id: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  points_possible: number | null;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  file_url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author_id: string | null;
  target: "all" | "students" | "professors";
  created_at: string;
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  type: "link" | "note" | "file";
  url: string | null;
  body: string | null;
  file_url: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  course_id: string;
  student_id: string;
  session_date: string;
  present: boolean;
  notes: string | null;
  created_at: string;
}

export type PaymentMethod = "cash" | "mpesa" | "bank" | "card" | "other";
export type InvoiceStatus = "unpaid" | "partial" | "paid";

export interface Invoice {
  id: string;
  student_id: string;
  title: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface Discussion {
  id: string;
  course_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  type: "holiday" | "exam" | "assignment" | "class" | "other";
  author_id: string | null;
  created_at: string;
}

export interface HandbookPage {
  id: string;
  title: string;
  body: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
