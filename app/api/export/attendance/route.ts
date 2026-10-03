import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const [{ data: students }, { data: enrollments }, { data: courses }, { data: attendance }] =
    await Promise.all([
      admin.from("profiles").select("id, full_name, student_number, program_id").eq("role", "student").order("full_name"),
      admin.from("enrollments").select("student_id, course_id"),
      admin.from("courses").select("id, title, code"),
      admin.from("attendance").select("student_id, course_id, present"),
    ]);

  const courseMap = new Map(
    (courses ?? []).map((c) => [c.id as string, `${c.title}${c.code ? ` (${c.code})` : ""}`])
  );

  type CourseAtt = { present: number; total: number };
  const attMap = new Map<string, Map<string, CourseAtt>>();
  for (const a of attendance ?? []) {
    if (!attMap.has(a.student_id)) attMap.set(a.student_id, new Map());
    const inner = attMap.get(a.student_id)!;
    const cur = inner.get(a.course_id) ?? { present: 0, total: 0 };
    inner.set(a.course_id, { present: cur.present + (a.present ? 1 : 0), total: cur.total + 1 });
  }

  const enrolledByStudent = new Map<string, string[]>();
  for (const e of enrollments ?? []) {
    const list = enrolledByStudent.get(e.student_id) ?? [];
    list.push(e.course_id);
    enrolledByStudent.set(e.student_id, list);
  }

  const headers = ["Student Number", "Full Name", "Course", "Sessions Present", "Sessions Total", "Attendance %"];
  const rows: string[][] = [];

  for (const student of (students ?? []) as { id: string; full_name: string; student_number: string | null }[]) {
    const courseIds = enrolledByStudent.get(student.id) ?? [];
    if (courseIds.length === 0) {
      rows.push([student.student_number ?? "", student.full_name, "—", "0", "0", "—"]);
      continue;
    }
    for (const cid of courseIds) {
      const courseName = courseMap.get(cid) ?? cid;
      const att = attMap.get(student.id)?.get(cid);
      const pct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
      rows.push([
        student.student_number ?? "",
        student.full_name,
        courseName,
        String(att?.present ?? 0),
        String(att?.total ?? 0),
        pct !== null ? `${pct}%` : "—",
      ]);
    }
  }

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
