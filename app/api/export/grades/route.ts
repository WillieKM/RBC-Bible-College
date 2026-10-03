import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";

function letterGrade(pct: number | null): string {
  if (pct == null) return "—";
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
}

export async function GET() {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const [{ data: students }, { data: enrollments }, { data: courses }, { data: assignments }, { data: submissions }] =
    await Promise.all([
      admin.from("profiles").select("id, full_name, student_number").eq("role", "student").order("full_name"),
      admin.from("enrollments").select("student_id, course_id"),
      admin.from("courses").select("id, title, code"),
      admin.from("assignments").select("id, course_id, points_possible"),
      admin.from("submissions").select("assignment_id, student_id, grade"),
    ]);

  const courseMap = new Map(
    (courses ?? []).map((c) => [c.id as string, `${c.title as string}${c.code ? ` (${c.code})` : ""}`])
  );

  const asnByCourse = new Map<string, { id: string; points_possible: number | null }[]>();
  for (const a of assignments ?? []) {
    const list = asnByCourse.get(a.course_id) ?? [];
    list.push(a);
    asnByCourse.set(a.course_id, list);
  }

  type SubEntry = { grade: number | null };
  const subMap = new Map<string, Map<string, SubEntry>>();
  for (const s of submissions ?? []) {
    if (!subMap.has(s.student_id)) subMap.set(s.student_id, new Map());
    subMap.get(s.student_id)!.set(s.assignment_id, { grade: s.grade });
  }

  const enrolledByStudent = new Map<string, string[]>();
  for (const e of enrollments ?? []) {
    const list = enrolledByStudent.get(e.student_id) ?? [];
    list.push(e.course_id);
    enrolledByStudent.set(e.student_id, list);
  }

  const headers = ["Student Number", "Full Name", "Course", "Assignments Graded", "Points Earned", "Points Possible", "Percentage", "Letter Grade"];
  const rows: string[][] = [];

  for (const student of (students ?? []) as { id: string; full_name: string; student_number: string | null }[]) {
    const courseIds = enrolledByStudent.get(student.id) ?? [];
    for (const cid of courseIds) {
      const courseName = courseMap.get(cid) ?? cid;
      const courseAsn = asnByCourse.get(cid) ?? [];
      const studentSubs = subMap.get(student.id) ?? new Map();
      const graded = courseAsn.filter((a) => studentSubs.get(a.id)?.grade != null);
      const possible = graded.reduce((s, a) => s + (a.points_possible ?? 0), 0);
      const earned = graded.reduce((s, a) => s + (studentSubs.get(a.id)?.grade ?? 0), 0);
      const pct = possible > 0 ? Math.round((earned / possible) * 100) : null;
      rows.push([
        student.student_number ?? "",
        student.full_name,
        courseName,
        String(graded.length),
        String(earned),
        String(possible),
        pct !== null ? `${pct}%` : "—",
        letterGrade(pct),
      ]);
    }
  }

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="grades-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
