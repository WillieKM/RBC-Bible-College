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
      `<p style="font-size:15px;color:#475569;">Hi <strong>${opts.studentName}</strong>,</p>
       <p style="font-size:15px;color:#475569;">A new module is now available for you in your <strong>${opts.programName}</strong> program:</p>
       <div style="background:#eff6ff;border-radius:10px;padding:14px 18px;margin:16px 0;">
         <p style="margin:0;font-size:17px;font-weight:700;color:#1e293b;">${opts.moduleTitle}${opts.moduleCode ? ` <span style="font-size:14px;font-weight:400;color:#64748b;">(${opts.moduleCode})</span>` : ""}</p>
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
      `<p style="font-size:15px;color:#475569;">Dear <strong>${opts.fullName}</strong>,</p>
       <p style="font-size:15px;color:#475569;">Thank you for applying to <strong>${SCHOOL_NAME}</strong>. We have successfully received your application for:</p>
       <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:16px 0;">
         <p style="margin:0;font-size:16px;font-weight:700;color:#1e293b;">${opts.program}</p>
         ${regionLabel ? `<p style="margin:6px 0 0;font-size:13px;color:#64748b;">${regionLabel}</p>` : ""}
       </div>
       <p style="font-size:15px;color:#475569;">Our admissions team will review your application and be in touch with you by email. You will receive a further email once a decision has been made on your application.</p>
       <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:16px 0;">
         <p style="margin:0;font-size:13px;color:#854d0e;">📬 <strong>Please check your spam or junk folder</strong> if you do not see our emails in your inbox. Add <strong>${process.env.GMAIL_USER ?? "our address"}</strong> to your contacts to make sure future emails reach you.</p>
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
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569;">${p.payment_date}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569;text-transform:capitalize;">${p.method}${p.reference ? ` — ${p.reference}` : ""}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#16a34a;font-weight:600;text-align:right;">${fmt(p.amount)}</td>
        </tr>`
      ).join("")
    : `<tr><td colspan="3" style="padding:12px;font-size:13px;color:#94a3b8;text-align:center;">No payments recorded yet</td></tr>`;

  await send(opts.to, `Invoice: ${opts.invoiceTitle} — ${SCHOOL_NAME}`,
    wrap(`Invoice — ${opts.invoiceTitle}`,
      `<p style="font-size:15px;color:#475569;">Dear <strong>${opts.studentName}</strong>,</p>
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

       ${opts.notes ? `<p style="margin-top:16px;font-size:13px;color:#64748b;font-style:italic;">${opts.notes}</p>` : ""}

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
      `<p style="font-size:15px;color:#475569;">Dear <strong>${opts.studentName}</strong>,</p>
       <p style="font-size:15px;color:#475569;">Congratulations! You have successfully completed all requirements for the <strong>${opts.programName}</strong> program.</p>
       ${opts.studentNumber ? `<p style="font-size:15px;color:#475569;">Student ID: <strong>${opts.studentNumber}</strong></p>` : ""}
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
  const html = wrap(opts.title, `<p style="font-size:15px;color:#475569;white-space:pre-wrap;">${opts.body}</p>`);
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
      `<p style="font-size:15px;color:#475569;">Hi <strong>${opts.fullName}</strong>,</p>
       <p style="font-size:15px;color:#475569;">An account has been created for you at ${SCHOOL_NAME} as a <strong>${opts.role}</strong>. Check your inbox for a separate email from Supabase to set your password, then log in below.</p>
       <div style="margin-top:24px;text-align:center;"><a href="${opts.loginUrl}" style="display:inline-block;background:${SCHOOL_ACCENT};color:${SCHOOL_COLOR};padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;">Go to Login →</a></div>`
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
        `<tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">${inv.title}</td>
         <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#dc2626;text-align:right;">${inv.currency}${inv.balance.toFixed(2)}</td></tr>`
    )
    .join("");

  await send(
    opts.to,
    `Payment reminder — ${opts.currency}${opts.totalBalance.toFixed(2)} outstanding`,
    wrap(
      "Payment Reminder",
      `<p style="margin:0 0 16px;font-size:15px;color:#334155;">Dear ${opts.studentName},</p>
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
           <strong>${a.title}</strong><br>
           <span style="color:#64748b;font-size:13px;">${a.courseTitle} &mdash; due ${new Date(a.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</span>
         </li>`
    )
    .join("");

  const count = opts.assignments.length;
  await send(
    opts.to,
    `Reminder: ${count} assignment${count !== 1 ? "s" : ""} due tomorrow`,
    wrap(
      `Assignment${count !== 1 ? "s" : ""} Due Tomorrow`,
      `<p style="margin:0 0 16px;font-size:15px;color:#334155;">Dear ${opts.studentName},</p>
       <p style="margin:0 0 16px;font-size:15px;color:#334155;">You have ${count} assignment${count !== 1 ? "s" : ""} due tomorrow. Don&rsquo;t forget to submit!</p>
       <ul style="list-style:none;padding:0;margin:0 0 20px;">${items}</ul>
       <a href="${opts.portalUrl}" style="display:inline-block;background:#d4af37;color:#14110c;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;font-size:14px;">Go to My Courses</a>`
    )
  );
}
