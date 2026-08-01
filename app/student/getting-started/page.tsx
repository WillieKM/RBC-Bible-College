import { requireRole } from "@/lib/auth";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Log in to your student portal",
    color: "bg-gold",
    body: `You are already here! Bookmark this page so you can return any time.

Your login email is the one your administrator used to invite you. If you ever forget your password, use the "Forgot password" link on the login page to reset it.`,
  },
  {
    number: "02",
    title: "Set up your profile & password",
    color: "bg-blue-500",
    body: `Go to Settings (bottom of the left menu) to set a strong password and update your contact details.

Make sure your name and email are correct — these appear on your certificates and invoices.`,
    link: { href: "/settings", label: "Go to Settings →" },
  },
  {
    number: "03",
    title: "Find your modules and courses",
    color: "bg-violet-500",
    body: `Click "My Courses" or "Modules" in the left menu to see all the subjects you are enrolled in.

Each module contains your reading materials, lecture notes, and assignments. Work through them at your own pace, but keep an eye on due dates.`,
    link: { href: "/student/modules", label: "View My Modules →" },
  },
  {
    number: "04",
    title: "Join live Zoom sessions",
    color: "bg-sky-500",
    body: `Your school holds live online classes via Zoom. When a session is scheduled you will receive an email with the link — check your inbox (and spam/junk folder).

You can also find all upcoming sessions under "Zoom Sessions" in the menu. Click "Join →" when the class is live.`,
    link: { href: "/student/zoom", label: "Zoom Sessions →" },
  },
  {
    number: "05",
    title: "Watch recordings of past classes",
    color: "bg-red-500",
    body: `Missed a session? No problem. Recordings are posted to YouTube after each class and linked directly in the "Zoom Sessions" page.

Click "▶ Watch" next to any past session to open the recording on YouTube. You can pause, rewind, and re-watch as many times as you need.`,
    link: { href: "/student/zoom", label: "View Recordings →" },
  },
  {
    number: "06",
    title: "Complete and submit assignments",
    color: "bg-emerald-500",
    body: `Each course has assignments you must complete. Open a course, read the assignment instructions, and submit your work before the due date shown.

Your submission will be graded by your professor. Once graded, your mark appears in your Transcript.`,
    link: { href: "/student/transcript", label: "View Transcript →" },
  },
  {
    number: "07",
    title: "Pay your tuition fees",
    color: "bg-amber-500",
    body: `Your invoice is on the Invoices page. It shows the amount due and your payment history.

Kenya / International students: use M-Pesa Lipa na M-Pesa → Pay Bill. Paybill number and account number are shown on your invoice and on the home page.

USA students: send payment via Zelle or Cash App to the number shown on your invoice.

After paying, upload your proof of payment (M-Pesa screenshot or receipt) directly from the Invoices page so the finance team can confirm it.`,
    link: { href: "/student/invoices", label: "View Invoices →" },
  },
  {
    number: "08",
    title: "Read the student handbook",
    color: "bg-slate-500",
    body: `The Handbook contains the school's policies, academic rules, code of conduct, and graduation requirements. Please read it carefully.

If you have any questions not answered in the handbook, contact your administrator directly.`,
    link: { href: "/student/handbook", label: "Open Handbook →" },
  },
];

export default async function GettingStartedPage() {
  await requireRole(["student"]);

  return (
    <div className="max-w-2xl">
      {/* Hero */}
      <div className="rounded-xl border border-gold bg-amber-50 px-6 py-5">
        <h1 className="text-2xl font-bold text-slate-900">Welcome to RBC Bible College</h1>
        <p className="mt-2 text-sm text-slate-600">
          New here? This guide walks you through everything you need to know to get started — from logging in to submitting your first assignment and paying your fees.
        </p>
      </div>

      {/* Steps */}
      <div className="mt-6 space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${step.color} text-sm font-bold text-white`}>
                {step.number}
              </span>
              <h2 className="text-base font-semibold text-slate-900">{step.title}</h2>
            </div>
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{step.body}</p>
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

      {/* Footer help */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Still have questions?</p>
        <p className="mt-1">Reach out to your administrator — they can help with access issues, program questions, and payment queries. You can also re-read this guide any time from the "Getting Started" link in the menu.</p>
      </div>
    </div>
  );
}
