"use client";

type Assignment = { id: string; title: string; pointsPossible: number | null };
type Student = { name: string; grades: Record<string, number | null> };
type Course = { id: string; title: string; code: string | null; assignments: Assignment[]; students: Student[] };

export function GradebookExport({ courses }: { courses: Course[] }) {
  function exportCSV() {
    const rows: string[] = [];

    for (const course of courses) {
      if (course.students.length === 0) continue;

      const headers = [
        "Student",
        ...course.assignments.map((a) =>
          `${a.title}${a.pointsPossible ? ` (/${a.pointsPossible})` : ""}`
        ),
        "Average %",
      ];
      rows.push(`\n${course.title}${course.code ? ` (${course.code})` : ""}`);
      rows.push(headers.map((h) => `"${h}"`).join(","));

      for (const student of course.students) {
        const graded = course.assignments.filter((a) => student.grades[a.id] != null);
        const earned = graded.reduce((s, a) => s + (student.grades[a.id] ?? 0), 0);
        const possible = graded.reduce((s, a) => s + (a.pointsPossible ?? 0), 0);
        const avg = possible > 0 ? `${Math.round((earned / possible) * 100)}%` : "—";

        const row = [
          `"${student.name}"`,
          ...course.assignments.map((a) =>
            student.grades[a.id] != null ? String(student.grades[a.id]) : "—"
          ),
          avg,
        ];
        rows.push(row.join(","));
      }
    }

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gradebook-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCSV}
      className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-gold hover:text-gold-dark"
    >
      Export CSV
    </button>
  );
}
