import nodemailer from "nodemailer";

const SCHOOL_NAME = process.env.SCHOOL_NAME || "Revelation Bible College";
const SCHOOL_COLOR = "#14110c";
const SCHOOL_ACCENT = "#d4af37";

// ─── Payment constants — update these when details change ─────────────────
const ZELLE_CASHAPP    = process.env.PAYMENT_ZELLE_CASHAPP || "253-275-8494";
const MPESA_PAYBILL    = process.env.MPESA_PAYBILL         || "542542";
const MPESA_ACCOUNT    = process.env.MPESA_ACCOUNT         || "03009422856350";

// User- and staff-entered text (names, statements, feedback, etc.) is interpolated
// directly into these HTML email bodies, so it must be escaped to avoid HTML/markup
// injection into emails sent to applicants, students, professors, and admissions staff.
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    `<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;width:100px;vertical-align:top;">${label}</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:15px;color:#1e293b;font-weight:500;">${esc(value)}</td></tr>`;

  await send(admissionsEmail, `New Application: ${opts.fullName}`,
    wrap("New Application Received",
      `<table style="width:100%;border-collapse:collapse;">
         ${row("Name", opts.fullName)}
         ${row("Email", opts.email)}
         ${opts.phone ? row("Phone", opts.phone) : ""}
         ${row("Program", opts.program)}
       </table>
       ${opts.statement ? `<p style="margin-top:16px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Statement</p><p style="font-size:14px;color:#475569;white-space:pre-wrap;">${esc(opts.statement)}</p>` : ""}`
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
    `<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;width:100px;vertical-align:top;">${label}</td><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:15px;color:#1e293b;font-weight:500;">${esc(value)}</td></tr>`;

  await send(opts.to, `New Application for ${opts.program}: ${opts.fullName}`,
    wrap("New Application In Your Program",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.professorName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">A new application has been submitted for <strong>${esc(opts.program)}</strong>, which you're assigned to.</p>
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
        `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.fullName)}</strong>,</p>
         <p style="font-size:15px;color:#475569;">Congratulations! Your application has been approved and an account has been created for you.</p>
         ${opts.studentNumber ? `<p style="font-size:15px;color:#475569;">Your student ID is <strong>${esc(opts.studentNumber)}</strong>. Please keep this for your records.</p>` : ""}
         <p style="font-size:15px;color:#475569;">Click below to set your password and log in.</p>
         ${opts.loginUrl ? `<div style="margin-top:24px;text-align:center;"><a href="${opts.loginUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Set Your Password →</a></div>` : ""}`
      ));
  } else {
    await send(opts.to, `Update on your application to ${SCHOOL_NAME}`,
      wrap("Application Update",
        `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.fullName)}</strong>,</p>
         <p style="font-size:15px;color:#475569;">Thank you for the time and care you put into your application to <strong>${SCHOOL_NAME}</strong>. After prayerful consideration, we are unable to offer you a place in this intake.</p>
         <p style="font-size:15px;color:#475569;">We encourage you to continue pursuing your calling and would welcome you to apply again in a future intake. If you would like feedback or have questions, please reply to this email — we are happy to speak with you.</p>
         <p style="font-size:15px;color:#475569;">We wish you God's blessing on your journey.</p>`
      ));
  }
}

// ─── Password reset (to user) ─────────────────────────────────────────────

export async function sendPasswordResetEmail(opts: {
  to: string;
  fullName: string;
  resetUrl: string;
}) {
  await send(opts.to, `Reset your password — ${SCHOOL_NAME}`,
    wrap("Reset Your Password",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.fullName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">We received a request to reset the password for your ${SCHOOL_NAME} account. Click below to choose a new password.</p>
       <div style="margin-top:24px;text-align:center;">
         <a href="${opts.resetUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Set New Password →</a>
       </div>
       <p style="margin-top:20px;font-size:13px;color:#94a3b8;text-align:center;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>`
    ));
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
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.professorName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;"><strong>${esc(opts.studentName)}</strong> submitted <strong>${esc(opts.assignmentTitle)}</strong> for <strong>${esc(opts.courseTitle)}</strong>.</p>
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
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.studentName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">Your submission for <strong>${esc(opts.assignmentTitle)}</strong> (${esc(opts.courseTitle)}) has been graded.</p>
       <div style="background:#eff6ff;border-radius:10px;padding:14px 18px;margin:16px 0;">
         <p style="margin:0;font-size:13px;font-weight:600;color:#1d4ed8;">Grade</p>
         <p style="margin:6px 0 0;font-size:20px;color:#1e293b;font-weight:700;">${opts.grade}${opts.pointsPossible ? ` / ${opts.pointsPossible}` : ""}</p>
       </div>
       ${opts.feedback ? `<p style="font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;">Feedback</p><p style="font-size:14px;color:#475569;white-space:pre-wrap;">${esc(opts.feedback)}</p>` : ""}
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
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.fullName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">Thank you for applying for <strong>${esc(opts.program)}</strong>.</p>
       <p style="font-size:15px;color:#475569;">This program is offered in partnership with Tabernacle Bible College and Seminary. We confirm that Tabernacle Bible College and Seminary is the accrediting institution for this program.</p>
       <div style="margin-top:16px;text-align:center;"><img src="${baseUrl}/tbcs-logo.png" alt="Tabernacle Bible College and Seminary" style="max-width:280px;width:100%;height:auto;border-radius:8px;" /></div>
       <p style="margin-top:16px;font-size:15px;color:#475569;">We'll be in touch with next steps regarding your application.</p>`
    ));
}

// ─── Module release notification (to student) ──────────────────────────────

export async function sendModuleReleaseEmail(opts: {
  to: string;
  studentName: string;
  moduleTitle: string;
  moduleCode: string | null;
  programName: string;
  portalUrl: string;
}) {
  await send(opts.to, `New module available: ${opts.moduleTitle}`,
    wrap("New Module Available",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.studentName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">A new module is now available for you in your <strong>${esc(opts.programName)}</strong> program:</p>
       <div style="background:#eff6ff;border-radius:10px;padding:14px 18px;margin:16px 0;">
         <p style="margin:0;font-size:17px;font-weight:700;color:#1e293b;">${esc(opts.moduleTitle)}${opts.moduleCode ? ` <span style="font-size:14px;font-weight:400;color:#64748b;">(${esc(opts.moduleCode)})</span>` : ""}</p>
       </div>
       <p style="font-size:15px;color:#475569;">Log in to your student portal to access the module, view assignments, and submit your work.</p>
       <div style="margin-top:24px;text-align:center;"><a href="${opts.portalUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Go to Student Portal →</a></div>`
    ));
}

// ─── Application received confirmation (to applicant) ─────────────────────

export async function sendApplicationConfirmationEmail(opts: {
  to: string;
  fullName: string;
  program: string;
  region: string | null;
}) {
  const regionLabel = opts.region === "usa" ? "USA Campus" : opts.region === "international" ? "Kenya / International" : null;
  await send(opts.to, `We received your application — ${SCHOOL_NAME}`,
    wrap("Application Received",
      `<p style="font-size:15px;color:#475569;">Dear <strong>${esc(opts.fullName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">Thank you for applying to <strong>${SCHOOL_NAME}</strong>. We have successfully received your application for:</p>
       <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:16px 0;">
         <p style="margin:0;font-size:16px;font-weight:700;color:#1e293b;">${esc(opts.program)}</p>
         ${regionLabel ? `<p style="margin:6px 0 0;font-size:13px;color:#64748b;">${regionLabel}</p>` : ""}
       </div>
       <p style="font-size:15px;color:#475569;">Our admissions team will review your application and be in touch with you by email. You will receive a further email once a decision has been made on your application.</p>
       <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:16px 0;">
         <p style="margin:0;font-size:13px;color:#854d0e;">📬 <strong>Please check your spam or junk folder</strong> if you do not see our emails in your inbox. Add <strong>${process.env.GMAIL_USER ?? "admin.rbcus@gmail.com"}</strong> to your contacts to make sure future emails reach you.</p>
       </div>
       <p style="font-size:14px;color:#94a3b8;">If you have any questions, reply to this email and we will be happy to help.</p>`
    ));
}

// ─── Invoice (to student) ─────────────────────────────────────────────────────

export async function sendInvoiceEmail(opts: {
  to: string;
  studentName: string;
  invoiceTitle: string;
  invoiceId: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  payments: { payment_date: string; amount: number; method: string; reference: string | null }[];
  notes: string | null;
  portalUrl: string;
}) {
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const status = opts.balance <= 0 ? "PAID IN FULL" : opts.amountPaid > 0 ? "PARTIAL PAYMENT" : "OUTSTANDING";
  const statusColor = opts.balance <= 0 ? "#16a34a" : opts.amountPaid > 0 ? "#d97706" : "#dc2626";

  const paymentRows = opts.payments.length > 0
    ? opts.payments.map((p) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569;">${esc(p.payment_date)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569;text-transform:capitalize;">${esc(p.method)}${p.reference ? ` — ${esc(p.reference)}` : ""}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#16a34a;font-weight:600;text-align:right;">${fmt(p.amount)}</td>
        </tr>`
      ).join("")
    : `<tr><td colspan="3" style="padding:12px;font-size:13px;color:#94a3b8;text-align:center;">No payments recorded yet</td></tr>`;

  await send(opts.to, `Invoice: ${opts.invoiceTitle} — ${SCHOOL_NAME}`,
    wrap(`Invoice — ${esc(opts.invoiceTitle)}`,
      `<p style="font-size:15px;color:#475569;">Dear <strong>${esc(opts.studentName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">Please find your invoice details below.</p>

       <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin:20px 0;border:1px solid #e2e8f0;">
         <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
           <span style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Status</span>
           <span style="font-size:13px;font-weight:700;color:${statusColor};">${status}</span>
         </div>
         <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
           <span style="font-size:14px;color:#475569;">Total Amount</span>
           <span style="font-size:14px;font-weight:600;color:#1e293b;">${fmt(opts.totalAmount)}</span>
         </div>
         <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
           <span style="font-size:14px;color:#475569;">Amount Paid</span>
           <span style="font-size:14px;font-weight:600;color:#16a34a;">${fmt(opts.amountPaid)}</span>
         </div>
         <div style="display:flex;justify-content:space-between;border-top:2px solid #e2e8f0;padding-top:8px;margin-top:8px;">
           <span style="font-size:15px;font-weight:700;color:#1e293b;">Balance Due</span>
           <span style="font-size:15px;font-weight:700;color:${opts.balance > 0 ? "#dc2626" : "#16a34a"};">${fmt(Math.max(0, opts.balance))}</span>
         </div>
       </div>

       <p style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-top:20px;">Payment History</p>
       <table style="width:100%;border-collapse:collapse;margin-top:8px;">
         <thead>
           <tr style="background:#f8fafc;">
             <th style="padding:8px 12px;font-size:12px;font-weight:600;color:#94a3b8;text-align:left;">Date</th>
             <th style="padding:8px 12px;font-size:12px;font-weight:600;color:#94a3b8;text-align:left;">Method</th>
             <th style="padding:8px 12px;font-size:12px;font-weight:600;color:#94a3b8;text-align:right;">Amount</th>
           </tr>
         </thead>
         <tbody>${paymentRows}</tbody>
       </table>

       ${opts.notes ? `<p style="margin-top:16px;font-size:13px;color:#64748b;font-style:italic;">${esc(opts.notes)}</p>` : ""}

       <div style="margin-top:24px;text-align:center;">
         <a href="${opts.portalUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">View in Student Portal →</a>
       </div>`
    ));
}

// ─── Program completion (to student) ──────────────────────────────────────────

export async function sendCompletionEmail(opts: {
  to: string;
  studentName: string;
  programName: string;
  studentNumber: string | null;
  portalUrl: string;
}) {
  await send(opts.to, `Congratulations — You have completed ${opts.programName}`,
    wrap("Program Completed 🎓",
      `<p style="font-size:15px;color:#475569;">Dear <strong>${esc(opts.studentName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">Congratulations! You have successfully completed all requirements for the <strong>${esc(opts.programName)}</strong> program.</p>
       ${opts.studentNumber ? `<p style="font-size:15px;color:#475569;">Student ID: <strong>${esc(opts.studentNumber)}</strong></p>` : ""}
       <p style="font-size:15px;color:#475569;">We are proud of your achievement and commitment. Your certificate will be prepared and you will be contacted with further details.</p>
       <div style="margin-top:24px;text-align:center;"><a href="${opts.portalUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">View Your Portal →</a></div>`
    ));
}

// ─── Bulk announcement (to students / all) ─────────────────────────────────

export async function sendBulkAnnouncementEmail(opts: {
  to: string[];
  title: string;
  body: string;
}) {
  const t = mailer();
  if (!t) {
    console.warn("Email skipped — GMAIL_USER / GMAIL_APP_PASSWORD not set");
    return;
  }
  const from = `"${SCHOOL_NAME}" <${process.env.GMAIL_USER}>`;
  const html = wrap(esc(opts.title), `<p style="font-size:15px;color:#475569;white-space:pre-wrap;">${esc(opts.body)}</p>`);
  // Send in small batches to respect Gmail rate limits
  for (const to of opts.to) {
    await t.sendMail({ from, to, subject: opts.title, html }).catch(() => null);
  }
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
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.fullName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">An account has been created for you at ${SCHOOL_NAME} as a <strong>${esc(opts.role)}</strong>. Click below to set your password and log in.</p>
       <div style="margin-top:24px;text-align:center;"><a href="${opts.loginUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Set Your Password →</a></div>`
    ));
}

// ─── Invoice payment reminder ─────────────────────────────────────────────

export async function sendInvoiceReminderEmail(opts: {
  to: string;
  studentName: string;
  invoices: { title: string; balance: number; currency: string }[];
  totalBalance: number;
  currency: string;
  portalUrl: string;
}) {
  const rows = opts.invoices
    .map(
      (inv) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">${esc(inv.title)}</td>
         <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#dc2626;text-align:right;">${inv.currency}${inv.balance.toFixed(2)}</td></tr>`
    )
    .join("");

  await send(
    opts.to,
    `Payment reminder — ${opts.currency}${opts.totalBalance.toFixed(2)} outstanding`,
    wrap(
      "Payment Reminder",
      `<p style="margin:0 0 16px;font-size:15px;color:#334155;">Dear ${esc(opts.studentName)},</p>
       <p style="margin:0 0 16px;font-size:15px;color:#334155;">This is a friendly reminder that you have outstanding fees on your account. Please log in to the student portal to view your invoices and make payment arrangements.</p>
       <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
         <thead><tr>
           <th style="text-align:left;font-size:12px;color:#94a3b8;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Invoice</th>
           <th style="text-align:right;font-size:12px;color:#94a3b8;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Balance</th>
         </tr></thead>
         <tbody>${rows}</tbody>
         <tfoot><tr>
           <td style="padding-top:10px;font-size:14px;font-weight:700;color:#1e293b;">Total Outstanding</td>
           <td style="padding-top:10px;font-size:16px;font-weight:700;color:#dc2626;text-align:right;">${opts.currency}${opts.totalBalance.toFixed(2)}</td>
         </tr></tfoot>
       </table>
       <p style="margin:0 0 20px;font-size:13px;color:#64748b;">If you have already made payment or have questions about your account, please contact the administrative office.</p>
       <a href="${opts.portalUrl}" style="display:inline-block;background:#d4af37;color:#14110c;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px;">View My Invoices</a>`
    )
  );
}

// ─── Assignment due-date reminder ─────────────────────────────────────────

export async function sendAssignmentDueEmail(opts: {
  to: string;
  studentName: string;
  assignments: { title: string; courseTitle: string; dueDate: string }[];
  portalUrl: string;
}) {
  const items = opts.assignments
    .map(
      (a) =>
        `<li style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">
           <strong>${esc(a.title)}</strong><br>
           <span style="color:#64748b;font-size:13px;">${esc(a.courseTitle)} &mdash; due ${new Date(a.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</span>
         </li>`
    )
    .join("");

  const count = opts.assignments.length;
  await send(
    opts.to,
    `Reminder: ${count} assignment${count !== 1 ? "s" : ""} due tomorrow`,
    wrap(
      `Assignment${count !== 1 ? "s" : ""} Due Tomorrow`,
      `<p style="margin:0 0 16px;font-size:15px;color:#334155;">Dear ${esc(opts.studentName)},</p>
       <p style="margin:0 0 16px;font-size:15px;color:#334155;">You have ${count} assignment${count !== 1 ? "s" : ""} due tomorrow. Don&rsquo;t forget to submit!</p>
       <ul style="list-style:none;padding:0;margin:0 0 20px;">${items}</ul>
       <a href="${opts.portalUrl}" style="display:inline-block;background:#d4af37;color:#14110c;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px;">Go to My Courses</a>`
    )
  );
}

// ─── Payment receipt (to student) ────────────────────────────────────────────

export async function sendPaymentReceiptEmail(opts: {
  to: string;
  studentName: string;
  invoiceTitle: string;
  amount: number;
  currency: string;
  balance: number;
  method: string;
  reference: string | null;
  paymentDate: string;
  portalUrl: string;
}) {
  const fmt = (n: number) => `${opts.currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  await send(
    opts.to,
    `Payment received — ${fmt(opts.amount)} for ${opts.invoiceTitle}`,
    wrap(
      "Payment Received",
      `<p style="font-size:15px;color:#475569;">Dear <strong>${esc(opts.studentName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">We have received your payment. Thank you!</p>
       <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:16px 0;">
         <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
           <span style="font-size:14px;color:#475569;">Invoice</span>
           <span style="font-size:14px;font-weight:600;color:#1e293b;">${esc(opts.invoiceTitle)}</span>
         </div>
         <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
           <span style="font-size:14px;color:#475569;">Amount Paid</span>
           <span style="font-size:16px;font-weight:700;color:#16a34a;">${fmt(opts.amount)}</span>
         </div>
         <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
           <span style="font-size:14px;color:#475569;">Date</span>
           <span style="font-size:14px;color:#1e293b;">${esc(opts.paymentDate)}</span>
         </div>
         <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
           <span style="font-size:14px;color:#475569;">Method</span>
           <span style="font-size:14px;color:#1e293b;text-transform:capitalize;">${esc(opts.method)}${opts.reference ? ` — ${esc(opts.reference)}` : ""}</span>
         </div>
         <div style="display:flex;justify-content:space-between;border-top:2px solid #dcfce7;padding-top:8px;margin-top:4px;">
           <span style="font-size:14px;font-weight:700;color:#1e293b;">Remaining Balance</span>
           <span style="font-size:15px;font-weight:700;color:${opts.balance <= 0 ? "#16a34a" : "#dc2626"};">${opts.balance <= 0 ? "PAID IN FULL" : fmt(Math.max(0, opts.balance))}</span>
         </div>
       </div>
       ${opts.balance <= 0 ? '<p style="font-size:15px;color:#16a34a;font-weight:600;">Your account is fully paid up. Thank you!</p>' : '<p style="font-size:14px;color:#475569;">Please log in to view your invoice and make further payments.</p>'}
       <div style="margin-top:24px;text-align:center;"><a href="${opts.portalUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">View My Invoices →</a></div>`
    )
  );
}

// ─── Student payment proof notification (to admin) ───────────────────────────

export async function sendPaymentProofNotification(opts: {
  studentName: string;
  studentEmail: string;
  invoiceTitle: string;
  invoiceId: string;
  amount: number;
  currency: string;
  reference: string;
  paymentDate: string;
  screenshotUrl: string | null;
  adminPortalUrl: string;
}) {
  const to = process.env.GMAIL_USER || "";
  if (!to) return;
  const fmt = (n: number) => `${opts.currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  await send(
    to,
    `Payment proof submitted — ${esc(opts.studentName)} · ${fmt(opts.amount)}`,
    wrap(
      "Payment Proof Submitted",
      `<p style="font-size:15px;color:#475569;"><strong>${esc(opts.studentName)}</strong> (<a href="mailto:${esc(opts.studentEmail)}" style="color:${SCHOOL_ACCENT};">${esc(opts.studentEmail)}</a>) has submitted proof of payment.</p>
       <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin:16px 0;border:1px solid #e2e8f0;">
         <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
           <span style="font-size:14px;color:#64748b;">Invoice</span>
           <span style="font-size:14px;font-weight:600;color:#1e293b;">${esc(opts.invoiceTitle)}</span>
         </div>
         <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
           <span style="font-size:14px;color:#64748b;">Amount Claimed</span>
           <span style="font-size:16px;font-weight:700;color:#1e293b;">${fmt(opts.amount)}</span>
         </div>
         <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
           <span style="font-size:14px;color:#64748b;">M-Pesa / Reference</span>
           <span style="font-size:14px;font-family:monospace;font-weight:600;color:#1e293b;">${esc(opts.reference)}</span>
         </div>
         <div style="display:flex;justify-content:space-between;">
           <span style="font-size:14px;color:#64748b;">Date</span>
           <span style="font-size:14px;color:#1e293b;">${esc(opts.paymentDate)}</span>
         </div>
       </div>
       ${opts.screenshotUrl ? `<p style="font-size:14px;color:#475569;">Screenshot: <a href="${opts.screenshotUrl}" style="color:${SCHOOL_ACCENT};">View attached screenshot →</a></p>` : ""}
       <p style="font-size:14px;color:#475569;margin-top:12px;">Please verify the payment and record it in the admin portal.</p>
       <div style="margin-top:24px;text-align:center;"><a href="${opts.adminPortalUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Record Payment →</a></div>`
    )
  );
}

// ─── New assignment posted (to enrolled students) ─────────────────────────────

export async function sendNewAssignmentEmail(opts: {
  to: string;
  studentName: string;
  assignmentTitle: string;
  courseTitle: string;
  dueDate: string | null;
  description: string | null;
  portalUrl: string;
}) {
  const dueLine = opts.dueDate
    ? `<p style="font-size:15px;color:#475569;">Due: <strong>${new Date(opts.dueDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</strong></p>`
    : "";
  await send(
    opts.to,
    `New assignment: ${opts.assignmentTitle} — ${opts.courseTitle}`,
    wrap(
      "New Assignment Posted",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.studentName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">A new assignment has been posted in <strong>${esc(opts.courseTitle)}</strong>.</p>
       <div style="background:#eff6ff;border-radius:10px;padding:14px 18px;margin:16px 0;">
         <p style="margin:0;font-size:17px;font-weight:700;color:#1e293b;">${esc(opts.assignmentTitle)}</p>
         ${dueLine}
         ${opts.description ? `<p style="margin:8px 0 0;font-size:14px;color:#475569;">${esc(opts.description)}</p>` : ""}
       </div>
       <div style="margin-top:24px;text-align:center;"><a href="${opts.portalUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">View Assignment →</a></div>`
    )
  );
}

// ─── Overdue assignment (missed deadline, to student) ─────────────────────────

export async function sendOverdueAssignmentEmail(opts: {
  to: string;
  studentName: string;
  assignments: { title: string; courseTitle: string; dueDate: string }[];
  portalUrl: string;
}) {
  const count = opts.assignments.length;
  const items = opts.assignments
    .map(
      (a) =>
        `<li style="padding:8px 0;border-bottom:1px solid #fee2e2;font-size:14px;color:#1e293b;">
           <strong>${esc(a.title)}</strong><br>
           <span style="color:#64748b;font-size:13px;">${esc(a.courseTitle)} &mdash; was due ${new Date(a.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</span>
         </li>`
    )
    .join("");
  await send(
    opts.to,
    `Missed deadline: ${count} assignment${count !== 1 ? "s" : ""} past due`,
    wrap(
      `Missed Assignment${count !== 1 ? "s" : ""}`,
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.studentName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">You have ${count} assignment${count !== 1 ? "s" : ""} that ${count !== 1 ? "have" : "has"} passed the due date without a submission. Please log in and submit as soon as possible — late submissions may still be accepted at your professor's discretion.</p>
       <ul style="list-style:none;padding:0;margin:0 0 20px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;overflow:hidden;">${items}</ul>
       <a href="${opts.portalUrl}" style="display:inline-block;background:#d4af37;color:#14110c;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px;">Submit Now</a>`
    )
  );
}

// ─── Grading reminder (to professor) ─────────────────────────────────────────

export async function sendGradingReminderEmail(opts: {
  to: string;
  professorName: string;
  submissions: { studentName: string; assignmentTitle: string; courseTitle: string; submittedAt: string }[];
  portalUrl: string;
}) {
  const count = opts.submissions.length;
  const rows = opts.submissions
    .map(
      (s) =>
        `<tr>
           <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">${esc(s.studentName)}</td>
           <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">${esc(s.assignmentTitle)}</td>
           <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${esc(s.courseTitle)}</td>
           <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${new Date(s.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
         </tr>`
    )
    .join("");
  await send(
    opts.to,
    `Grading reminder — ${count} submission${count !== 1 ? "s" : ""} awaiting review`,
    wrap(
      "Submissions Awaiting Grading",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.professorName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">You have <strong>${count} submission${count !== 1 ? "s" : ""}</strong> that ${count !== 1 ? "have" : "has"} been waiting for grading for 3 or more days.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0;">
         <thead><tr style="background:#f8fafc;">
           <th style="padding:8px 12px;font-size:12px;color:#94a3b8;text-align:left;">Student</th>
           <th style="padding:8px 12px;font-size:12px;color:#94a3b8;text-align:left;">Assignment</th>
           <th style="padding:8px 12px;font-size:12px;color:#94a3b8;text-align:left;">Course</th>
           <th style="padding:8px 12px;font-size:12px;color:#94a3b8;text-align:left;">Submitted</th>
         </tr></thead>
         <tbody>${rows}</tbody>
       </table>
       <div style="margin-top:24px;text-align:center;"><a href="${opts.portalUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Grade Submissions →</a></div>`
    )
  );
}

// ─── Zoom session link sent to students ───────────────────────────────────────

export async function sendZoomLinkEmail(opts: {
  to: string;
  studentName: string;
  sessionTitle: string;
  description: string | null;
  zoomUrl: string;
  programName: string;
}) {
  await send(
    opts.to,
    `Class session: ${opts.sessionTitle}`,
    wrap(
      "Class Session",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.studentName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">Your upcoming class session for <strong>${esc(opts.programName)}</strong> is ready.</p>
       <div style="background:#eff6ff;border-radius:10px;padding:14px 18px;margin:16px 0;">
         <p style="margin:0;font-size:17px;font-weight:700;color:#1e293b;">${esc(opts.sessionTitle)}</p>
         ${opts.description ? `<p style="margin:8px 0 0;font-size:14px;color:#475569;">${esc(opts.description)}</p>` : ""}
       </div>
       <div style="margin-top:24px;text-align:center;">
         <a href="${opts.zoomUrl}" style="display:inline-block;background:#2D8CFF;color:white;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Join Zoom Session →</a>
       </div>
       <p style="margin-top:16px;font-size:13px;color:#94a3b8;text-align:center;">Click the button above to join your class. If the button doesn&apos;t work, copy this link: ${opts.zoomUrl}</p>`
    )
  );
}

// ─── Module file sent to students ─────────────────────────────────────────────

export async function sendModuleFileEmail(opts: {
  to: string;
  studentName: string;
  moduleTitle: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  senderName: string;
}) {
  await send(
    opts.to,
    `New module available: ${opts.moduleTitle}`,
    wrap(
      "New Module Available",
      `<p style="font-size:15px;color:#475569;">Hi <strong>${esc(opts.studentName)}</strong>,</p>
       <p style="font-size:15px;color:#475569;">A new module has been shared with you by <strong>${esc(opts.senderName)}</strong>.</p>
       <div style="background:#eff6ff;border-radius:10px;padding:14px 18px;margin:16px 0;">
         <p style="margin:0;font-size:17px;font-weight:700;color:#1e293b;">${esc(opts.moduleTitle)}</p>
         ${opts.description ? `<p style="margin:8px 0 0;font-size:14px;color:#475569;">${esc(opts.description)}</p>` : ""}
       </div>
       <div style="margin-top:24px;text-align:center;">
         <a href="${opts.fileUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Download ${esc(opts.fileName)} →</a>
       </div>
       <p style="margin-top:16px;font-size:13px;color:#94a3b8;text-align:center;">Click the button above to download your module PDF.</p>`
    )
  );
}

// ─── Student welcome email (sent on first account setup) ─────────────────────

const LEVEL_LABELS: Record<string, string> = {
  diploma: "Diploma Program",
  bachelors: "Bachelor's Degree Program",
  masters: "Master's Degree Program",
  doctorate: "Doctorate Program",
};

// Official RBC curriculum — used when no module files are uploaded yet
const CBS_COURSES = [
  "CBS-001 Who is God and the names of God",
  "CBS-002 Christology",
  "CBS-003 Bible Expository",
  "CBS-004 The Blood Covenant",
  "CBS-005 Gifts of the Holy Spirit",
  "CBS-006 Power of Praise and Worship",
  "CBS-007 Understanding and releasing your Potential",
  "CBS-008 School of Prayer",
  "CBS-009 Evangelism",
  "CBS-010 Foundation of Faith and Prayer",
];

const DCM_COURSES = [
  "DCM-009 Who is God?",
  "DCM-010 Christology",
  "DCM-011 Pneumatology",
  "DCM-012 Old and New Testament Survey",
  "DCM-013 Major and Minor Prophets",
  "DCM-014 Demonology",
  "DCM-015 Church History",
  "DCM-016 Dispensations",
  "DCM-017 Character and Personality",
  "DCM-018 Ministry of Prayer",
  "DCM-019 Ministry Gifts",
  "DCM-020 Ministry of Healing",
  "DCM-021 Church Management and Administration",
  "DCM-022 Pastoral Leadership",
  "DCM-023 Harmatiology",
  "DCM-024 Symbolisms",
  "DCM-025 Evangelism",
  "DCM-026 Praise and Worship",
];

const BTH_COURSES = [
  "BTH-025 World Religions",
  "BTH-026 Eschatology",
  "BTH-027 Doctrine of Angels",
  "BTH-028 Spirits and the Underworld — Altars",
  "BTH-029 Apocryphal Books",
  "BTH-030 Humanism Vs. The Godhead",
  "BTH-031 Customs of the Ancient and Geological Ages",
  "BTH-032 Ministerial Ethics and Church Ordinances",
  "BTH-033 Prophecy",
  "BTH-034 Leadership Skills",
  "BTH-035 Hermeneutics",
  "BTH-036 Apologetics",
  "BTH-037 The Art of Counselling",
  "BTH-038 Theology of Missions",
];

const MTH_COURSES = [
  "MTH-039 Anointing and the Royal Priesthood",
  "MTH-040 Apologetics",
  "MTH-041 Skillful Leadership",
  "MTH-042 Hermeneutics",
  "MTH-043 Church in the 21st Century",
  "MTH-044 Denominationalism Vs. Saints",
];

const DDD_COURSES = [
  "DDD-041 Traditions",
  "DDD-042 Revolution in World Missions",
  "DDD-043 Courageous Leadership",
];

const DISSERTATION_NOTE: Record<string, string> = {
  bachelors: "Dissertation: Any of these modules or a desired topic — 20,000 words",
  masters: "Dissertation: Any of these modules or a desired topic — 30,000 words",
  doctorate: "Dissertation: Any of these modules — 80,000 words",
};

function getDefaultCurriculum(programName: string, programLevel: string): string[] {
  const lower = programName.toLowerCase();
  if (lower.includes("certificate") || lower.includes("biblical studies")) return CBS_COURSES;
  if (lower.includes("bachelor")) return BTH_COURSES;
  if (lower.includes("master")) return MTH_COURSES;
  if (lower.includes("doctor") || lower.includes("divinity") || lower.includes("theology (th") || lower.includes("ministry (d")) return DDD_COURSES;
  // Fall back by level
  if (programLevel === "bachelors") return BTH_COURSES;
  if (programLevel === "masters") return MTH_COURSES;
  if (programLevel === "doctorate") return DDD_COURSES;
  // diploma level — distinguish Certificate vs Diploma
  if (lower.includes("christian ministry") || lower.includes("dcm")) return DCM_COURSES;
  return DCM_COURSES; // default diploma curriculum
}

export async function sendStudentWelcomeEmail(opts: {
  to: string;
  fullName: string;
  studentNumber: string | null;
  programName: string;
  programLevel: string;
  courses: string[];
  feeAmount: number | null;
  region: string;
  portalUrl: string;
}) {
  const { fullName, studentNumber, programName, programLevel, courses, feeAmount, region, portalUrl } = opts;
  const isUsa = region === "usa";
  const levelLabel = LEVEL_LABELS[programLevel] ?? "Program";
  const feeDisplay = feeAmount
    ? isUsa
      ? `$${feeAmount.toLocaleString()}`
      : `KSh ${feeAmount.toLocaleString()}`
    : null;

  const displayCourses = courses.length > 0 ? courses : getDefaultCurriculum(programName, programLevel);
  const dissertation = DISSERTATION_NOTE[programLevel] ?? null;
  const courseList = `<ul style="margin:10px 0 0;padding:0;list-style:none;">
      ${displayCourses.map(c => `<li style="padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;">✦ ${esc(c)}</li>`).join("")}
    </ul>
    ${dissertation ? `<p style="margin:12px 0 0;font-size:13px;color:#64748b;font-style:italic;">📝 ${esc(dissertation)}</p>` : ""}`;

  const paymentSection = isUsa
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:8px 0;">
         <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.07em;">How to Pay (USA)</p>
         <p style="margin:0 0 6px;font-size:14px;color:#1e293b;"><strong>Zelle:</strong> ${esc(ZELLE_CASHAPP)}</p>
         <p style="margin:0;font-size:14px;color:#1e293b;"><strong>Cash App:</strong> ${esc(ZELLE_CASHAPP)}</p>
       </div>`
    : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:8px 0;">
         <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.07em;">How to Pay (Kenya / International — M-Pesa)</p>
         <p style="margin:0 0 4px;font-size:14px;color:#1e293b;"><strong>Paybill Number:</strong> <span style="font-family:monospace;font-size:16px;">${esc(MPESA_PAYBILL)}</span></p>
         <p style="margin:0 0 4px;font-size:14px;color:#1e293b;"><strong>Account Number:</strong> <span style="font-family:monospace;font-size:16px;">${esc(MPESA_ACCOUNT)}</span></p>
         <p style="margin:8px 0 0;font-size:12px;color:#64748b;">Go to M-Pesa → Lipa na M-Pesa → Pay Bill. Enter Paybill, then Account Number, then amount.</p>
       </div>`;

  await send(
    opts.to,
    `Welcome to ${SCHOOL_NAME} — ${programName}`,
    wrap(
      `Welcome, ${esc(fullName)}! 🎓`,
      `<p style="font-size:15px;color:#475569;">We are thrilled to welcome you to <strong>${SCHOOL_NAME}</strong>. Your account is now active and you are officially enrolled. May this season of study deepen your faith and equip you for God's calling on your life.</p>

       ${studentNumber ? `<div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:10px 16px;margin:16px 0;font-size:14px;color:#92400e;"><strong>Your Student ID:</strong> ${esc(studentNumber)} — please include this as your payment reference.</div>` : ""}

       <!-- Program -->
       <p style="margin:20px 0 4px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">Your Program</p>
       <div style="background:#f8fafc;border-radius:10px;padding:14px 18px;">
         <p style="margin:0;font-size:17px;font-weight:700;color:#1e293b;">${esc(programName)}</p>
         <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${esc(levelLabel)}</p>
       </div>

       <!-- Courses -->
       <p style="margin:20px 0 4px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">What You Will Study</p>
       <div style="background:#f8fafc;border-radius:10px;padding:14px 18px;">
         ${courseList}
       </div>

       <!-- Fees -->
       <p style="margin:20px 0 4px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">Program Fees</p>
       ${feeDisplay
         ? `<div style="background:#f8fafc;border-radius:10px;padding:14px 18px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#1e293b;">${esc(feeDisplay)}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Total program fee — payment plans are available, please contact the office.</p>
            </div>`
         : `<p style="font-size:14px;color:#64748b;">Please contact the administrative office for your fee schedule.</p>`}

       <!-- Payment instructions -->
       <p style="margin:20px 0 4px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">Payment Instructions</p>
       ${paymentSection}
       <p style="font-size:13px;color:#64748b;margin:8px 0 0;">Once payment is made, please send your proof of payment to the admin office so your account can be updated.</p>

       <!-- CTA -->
       <div style="margin-top:28px;text-align:center;">
         <a href="${portalUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Go to My Portal →</a>
       </div>
       <p style="margin-top:16px;font-size:13px;color:#94a3b8;text-align:center;">God bless you on this journey. We are here if you need us.</p>`
    )
  );
}
