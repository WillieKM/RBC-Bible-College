import { requireRole } from "@/lib/auth";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Log in to your professor portal",
    color: "bg-gold",
    body: `You are already here! Bookmark this page so you can return any time.

Your login email is the one the administrator used to invite you. Use "Forgot password" on the login page if you ever need to reset it.`,
  },
  {
    number: "02",
    title: "Set up your profile & password",
    color: "bg-blue-500",
    body: `Go to Settings (bottom of the left menu) to set a secure password and update your contact details.

Make sure your name is correct — it appears on student communications and grading feedback.`,
    link: { href: "/settings", label: "Go to Settings →" },
  },
  {
    number: "03",
    title: "Review your assigned courses",
    color: "bg-violet-500",
    body: `Click "My Courses" to see the courses the admin has assigned to you. Each course shows enrolled students, your assignments, course materials, and a class discussion board.

If you expected a course but don't see it, contact your administrator to have it assigned.`,
    link: { href: "/professor", label: "My Courses →" },
  },
  {
    number: "04",
    title: "Create and manage assignments",
    color: "bg-emerald-500",
    body: `From any course page, use the "New Assignment" form to post work for your students. Set a title, due date, and point value. Students will be notified by email automatically.

You can also create assignments directly from the Assignments page without navigating to a specific course.`,
    link: { href: "/professor/assignments", label: "Assignments →" },
  },
  {
    number: "05",
    title: "Grade submitted work",
    color: "bg-red-500",
    body: `Your home page shows an "Ungraded Submissions" inbox so you never miss pending work. Click any submission to open the grading page, read the student's response, enter a grade and feedback, then save.

Students are notified by email and bell notification as soon as you grade their work.`,
    link: { href: "/professor", label: "View Ungraded →" },
  },
  {
    number: "06",
    title: "Track grades with the Grade Book",
    color: "bg-sky-500",
    body: `The Grade Book shows a grid of all your students versus all assignments across every course. Green numbers are confirmed grades, an amber dot means submitted but not yet graded, and a dash means not submitted.

Use this to spot students who are falling behind before it becomes a problem.`,
    link: { href: "/professor/gradebook", label: "Open Grade Book →" },
  },
  {
    number: "07",
    title: "Upload course modules (reading material)",
    color: "bg-amber-500",
    body: `The admin uploads PDF modules centrally and releases them to all students. You can see the full module history — including which modules are currently active and which have been previously taught — under "Modules" in the menu.`,
    link: { href: "/professor/modules", label: "View Modules →" },
  },
  {
    number: "08",
    title: "Join and manage Zoom sessions",
    color: "bg-slate-500",
    body: `Upcoming Zoom sessions are listed under "Zoom & Recordings." Click "Join →" when a session goes live. After each class, use "Zoom Register" to mark which students attended — this feeds into their attendance records.`,
    link: { href: "/professor/zoom", label: "Zoom Sessions →" },
  },
];

export default async function ProfessorGettingStartedPage() {
  await requireRole(["professor"]);

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-gold bg-amber-50 px-6 py-5">
        <h1 className="text-2xl font-bold text-slate-900">Professor Quick-Start Guide</h1>
        <p className="mt-2 text-sm text-slate-600">
          New to the RBC professor portal? This guide covers everything from logging in to grading assignments and running Zoom sessions.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 px-5 py-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${step.color} text-sm font-bold text-white`}>
                {step.number}
              </span>
              <h2 className="text-base font-semibold text-slate-900">{step.title}</h2>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="whitespace-pre-wrap text-sm text-slate-600">{step.body}</p>
              {step.link && (
                <Link
                  href={step.link.href}
                  className="mt-3 inline-block text-sm font-medium text-gold-dark hover:underline"
                >
                  {step.link.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Need help?</p>
        <p className="mt-1">Contact your administrator for access issues, course assignments, or any other questions. You can revisit this guide any time from the "Getting Started" link in the menu.</p>
      </div>
    </div>
  );
}
