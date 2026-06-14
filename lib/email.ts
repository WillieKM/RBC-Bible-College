import nodemailer from "nodemailer";

const SCHOOL_NAME = process.env.SCHOOL_NAME || "Revelation Bible College";
const SCHOOL_COLOR = "#14110c";
const SCHOOL_ACCENT = "#d4af37";

function mailer() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

function send(to: string, subject: string, html: string) {
  const t = mailer();
  if (!t) {
    console.warn("Email skipped — GMAIL_USER / GMAIL_APP_PASSWORD not set");
    return Promise.resolve();
  }
  const from = `"${SCHOOL_NAME}" <${process.env.GMAIL_USER}>`;
  return t.sendMail({ from, to, subject, html });
}

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.10);">
    <div style="background:${SCHOOL_COLOR};padding:28px 32px;color:white;">
      <p style="margin:0 0 6px;font-size:12px;color:${SCHOOL_ACCENT};text-transform:uppercase;letter-spacing:.08em;">${SCHOOL_NAME}</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;">${title}</h1>
    </div>
    <div style="padding:28px 32px;">${body}</div>
  </div>
</body></html>`;
}

// ─── Application submitted (to admissions) ────────────────────────────────

export async function sendNewApplicationEmail(opts: {
  fullName: string;
  email: string;
  phone: string | null;
  program: string;
  statement: string | null;
}) {
  const admissionsEmail = process.env.ADMISSIONS_EMAIL;
  if (!admissionsEmail) {
    console.warn("Email skipped — ADMISSIONS_EMAIL not set");
    return;
  }
  const row = (label: string, value: string) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;width:100px;vertical-align:top;">${label}</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:15px;color:#1e293b;font-weight:500;">${value}</td></tr>`;

  await send(admissionsEmail, `New Application: ${opts.fullName}`,
    wrap("New Application Received",
      `<table style="width:100%;border-collapse:collapse;">
         ${row("Name", opts.fullName)}
         ${row("Email", opts.email)}
         ${opts.phone ? row("Phone", opts.phone) : ""}
         ${row("Program", opts.program)}
       </table>
       ${opts.statement ? `<p style="margin-top:16px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Statement</p><p style="font-size:14px;color:#475569;white-space:pre-wrap;">${opts.statement}</p>` : ""}`
    ));
}

// ─── Application submitted (to program professor) ──────────────────────────

export async function sendNewApplicationToProfessorEmail(opts: {
  to: string;
  professorName: string;
  fullName: string;
  email: string;
  phone: string | null;
  program: string;
}) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;width:100px;vertical-align:top;">${label}</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:15px;color:#1e293b;font-weight:500;">${value}</td></tr>`;

  await send(opts.to, `New Application for ${opts.program}: ${opts.fullName}`,
    wrap("New Application In Your Program",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${opts.professorName}</strong>,</p>
       <p style="font-size:15px;color:#475569;">A new application has been submitted for <strong>${opts.program}</strong>, which you're assigned to.</p>
       <table style="width:100%;border-collapse:collapse;">
         ${row("Name", opts.fullName)}
         ${row("Email", opts.email)}
         ${opts.phone ? row("Phone", opts.phone) : ""}
       </table>
       <p style="margin-top:16px;font-size:14px;color:#475569;">An admin will review this application and follow up.</p>`
    ));
}

// ─── Application decision (to applicant) ───────────────────────────────────

export async function sendApplicationDecisionEmail(opts: {
  to: string;
  fullName: string;
  approved: boolean;
  loginUrl?: string;
  studentNumber?: string;
}) {
  if (opts.approved) {
    await send(opts.to, `Your application to ${SCHOOL_NAME} has been approved`,
      wrap("Application Approved",
        `<p style="font-size:15px;color:#475569;">Hi <strong>${opts.fullName}</strong>,</p>
         <p style="font-size:15px;color:#475569;">Congratulations! Your application has been approved and an account has been created for you.</p>
         ${opts.studentNumber ? `<p style="font-size:15px;color:#475569;">Your student ID is <strong>${opts.studentNumber}</strong>. Please keep this for your records.</p>` : ""}
         <p style="font-size:15px;color:#475569;">Check your inbox for a separate email from Supabase to set your password, then log in below.</p>
         ${opts.loginUrl ? `<div style="margin-top:24px;text-align:center;"><a href="${opts.loginUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Go to Login →</a></div>` : ""}`
      ));
  } else {
    await send(opts.to, `Update on your application to ${SCHOOL_NAME}`,
      wrap("Application Update",
        `<p style="font-size:15px;color:#475569;">Hi <strong>${opts.fullName}</strong>,</p>
         <p style="font-size:15px;color:#475569;">Thank you for applying. After review, we are unable to offer admission at this time.</p>`
      ));
  }
}

// ─── New assignment submission (to professor) ──────────────────────────────

export async function sendNewSubmissionEmail(opts: {
  to: string;
  professorName: string;
  studentName: string;
  courseTitle: string;
  assignmentTitle: string;
  reviewUrl: string;
}) {
  await send(opts.to, `New Submission: ${opts.assignmentTitle}`,
    wrap("New Assignment Submission",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${opts.professorName}</strong>,</p>
       <p style="font-size:15px;color:#475569;"><strong>${opts.studentName}</strong> submitted <strong>${opts.assignmentTitle}</strong> for <strong>${opts.courseTitle}</strong>.</p>
       <div style="margin-top:24px;text-align:center;"><a href="${opts.reviewUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Review Submission →</a></div>`
    ));
}

// ─── Assignment graded (to student) ────────────────────────────────────────

export async function sendGradedEmail(opts: {
  to: string;
  studentName: string;
  assignmentTitle: string;
  courseTitle: string;
  grade: number;
  pointsPossible: number | null;
  feedback: string | null;
  reviewUrl: string;
}) {
  await send(opts.to, `Grade Posted: ${opts.assignmentTitle}`,
    wrap("Assignment Graded",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${opts.studentName}</strong>,</p>
       <p style="font-size:15px;color:#475569;">Your submission for <strong>${opts.assignmentTitle}</strong> (${opts.courseTitle}) has been graded.</p>
       <div style="background:#eff6ff;border-radius:10px;padding:14px 18px;margin:16px 0;">
         <p style="margin:0;font-size:13px;font-weight:600;color:#1d4ed8;">Grade</p>
         <p style="margin:6px 0 0;font-size:20px;color:#1e293b;font-weight:700;">${opts.grade}${opts.pointsPossible ? ` / ${opts.pointsPossible}` : ""}</p>
       </div>
       ${opts.feedback ? `<p style="font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Feedback</p><p style="font-size:14px;color:#475569;white-space:pre-wrap;">${opts.feedback}</p>` : ""}
       <div style="margin-top:24px;text-align:center;"><a href="${opts.reviewUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">View Submission →</a></div>`
    ));
}

// ─── Degree accreditation confirmation (to applicant) ──────────────────────

export async function sendAccreditationEmail(opts: {
  to: string;
  fullName: string;
  program: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  await send(opts.to, `Your application — accreditation information`,
    wrap("Accreditation Confirmation",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${opts.fullName}</strong>,</p>
       <p style="font-size:15px;color:#475569;">Thank you for applying for <strong>${opts.program}</strong>.</p>
       <p style="font-size:15px;color:#475569;">This program is offered in partnership with Tabernacle Bible College and Seminary. We confirm that Tabernacle Bible College and Seminary is the accrediting institution for this program.</p>
       <div style="margin-top:16px;text-align:center;"><img src="${baseUrl}/tbcs-logo.png" alt="Tabernacle Bible College and Seminary" style="max-width:280px;width:100%;height:auto;border-radius:8px;" /></div>
       <p style="margin-top:16px;font-size:15px;color:#475569;">We'll be in touch with next steps regarding your application.</p>`
    ));
}

// ─── Account invite (to new user) ──────────────────────────────────────────

export async function sendAccountInviteEmail(opts: {
  to: string;
  fullName: string;
  role: string;
  loginUrl: string;
}) {
  await send(opts.to, `Your ${SCHOOL_NAME} account is ready`,
    wrap("Welcome",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${opts.fullName}</strong>,</p>
       <p style="font-size:15px;color:#475569;">An account has been created for you at ${SCHOOL_NAME} as a <strong>${opts.role}</strong>. Check your inbox for a separate email from Supabase to set your password, then log in below.</p>
       <div style="margin-top:24px;text-align:center;"><a href="${opts.loginUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Go to Login →</a></div>`
    ));
}
