export type Role = "admin" | "professor" | "student";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
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
  title: string;
  code: string | null;
  professor_id: string | null;
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
