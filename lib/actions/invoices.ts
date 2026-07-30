"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireFinanceAccess, requireRole } from "@/lib/auth";
import { sendInvoiceEmail, sendPaymentReceiptEmail, sendPaymentProofNotification } from "@/lib/email";
import { nextSequenceNumber } from "@/lib/sequences";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";

export async function createInvoice(formData: FormData) {
  const adminProfile = await requireFinanceAccess();
  const adminDb = createAdminClient();

  const studentId = String(formData.get("student_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const totalAmount = parseFloat(String(formData.get("total_amount") || "0"));
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!studentId || !title || isNaN(totalAmount) || totalAmount <= 0) return;

  const year = new Date().getFullYear();
  const invSeq = await nextSequenceNumber(adminDb, `invoice_number_${year}`);
  const invoiceNumber = `INV-${year}-${String(invSeq).padStart(4, "0")}`;

  const { data: invoice, error: invoiceError } = await adminDb
    .from("invoices")
    .insert({ student_id: studentId, title, total_amount: totalAmount, notes, invoice_number: invoiceNumber })
    .select("id")
    .single();

  console.log("[createInvoice] insert result:", { invoice, error: invoiceError?.message });

  if (invoice) {
    void writeAuditLog({
      actorId: adminProfile.id,
      actorName: adminProfile.full_name,
      action: "create_invoice",
      targetType: "invoice",
      targetId: invoice.id,
      details: { student_id: studentId, title, total_amount: totalAmount, invoice_number: invoiceNumber },
    });

    const { data: studentProfile } = await adminDb
      .from("profiles")
      .select("full_name, email")
      .eq("id", studentId)
      .maybeSingle();

    // Fall back to auth user email if profile email is null
    let recipientEmail = studentProfile?.email ?? null;
    if (!recipientEmail) {
      const { data: authUser } = await adminDb.auth.admin.getUserById(studentId);
      recipientEmail = authUser?.user?.email ?? null;
    }
    const recipientName = studentProfile?.full_name ?? "Student";

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const emailTo = recipientEmail;
    const emailName = recipientName;
    const capturedInvoiceId = invoice.id;
    const capturedTitle = title;
    const capturedActorId = adminProfile.id;
    const capturedActorName = adminProfile.full_name;

    after(async () => {
      if (!emailTo) {
        void writeAuditLog({ actorId: capturedActorId, actorName: capturedActorName, action: "invoice_email_skipped", targetType: "invoice", targetId: capturedInvoiceId, details: { reason: "no_email_found", profile: JSON.stringify(studentProfile) } });
        return;
      }
      try {
        await sendInvoiceEmail({
          to: emailTo,
          studentName: emailName,
          invoiceTitle: capturedTitle,
          invoiceId: capturedInvoiceId,
          totalAmount,
          amountPaid: 0,
          balance: totalAmount,
          payments: [],
          notes,
          portalUrl: `${baseUrl}/student/invoices`,
        });
        void writeAuditLog({ actorId: capturedActorId, actorName: capturedActorName, action: "invoice_email_sent", targetType: "invoice", targetId: capturedInvoiceId, details: { to: emailTo } });
      } catch (err) {
        void writeAuditLog({ actorId: capturedActorId, actorName: capturedActorName, action: "invoice_email_failed", targetType: "invoice", targetId: capturedInvoiceId, details: { to: emailTo, error: err instanceof Error ? err.message : String(err) } });
      }
    });

    revalidatePath("/admin/invoices");
    redirect(`/admin/invoices/${invoice.id}`);
  }

  revalidatePath("/admin/invoices");
}

export async function addPayment(formData: FormData) {
  const adminProfile = await requireFinanceAccess();
  const supabase = await createClient();

  const invoiceId = String(formData.get("invoice_id"));
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const paymentDate = String(formData.get("payment_date") || new Date().toISOString().slice(0, 10));
  const method = String(formData.get("method") || "cash");
  const reference = String(formData.get("reference") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!invoiceId || isNaN(amount) || amount <= 0) return;

  // Guard against double-submission (e.g. double-clicking Save Payment) —
  // an identical amount on the same invoice recorded in the last 10 seconds
  // is treated as a duplicate rather than a genuine second payment.
  const { data: recentDuplicate } = await supabase
    .from("payments")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("amount", amount)
    .gte("created_at", new Date(Date.now() - 10_000).toISOString())
    .maybeSingle();

  if (recentDuplicate) {
    revalidatePath(`/admin/invoices/${invoiceId}`);
    return;
  }

  const { data: payment } = await supabase
    .from("payments")
    .insert({ invoice_id: invoiceId, amount, payment_date: paymentDate, method, reference, notes })
    .select("id")
    .single();

  if (payment) {
    void writeAuditLog({
      actorId: adminProfile.id,
      actorName: adminProfile.full_name,
      action: "record_payment",
      targetType: "payment",
      targetId: payment.id,
      details: { invoice_id: invoiceId, amount, method, reference },
    });
  }

  // Send receipt email to student
  const { data: invoice } = await supabase
    .from("invoices")
    .select("title, total_amount, student_id, profiles(full_name, email, region), payments(amount)")
    .eq("id", invoiceId)
    .single();

  if (invoice?.profiles) {
    const profile = invoice.profiles as unknown as { full_name: string; email: string; region: string | null };
    const totalPaid = ((invoice.payments ?? []) as { amount: number }[]).reduce((s, p) => s + p.amount, 0);
    const balance = invoice.total_amount - totalPaid;
    const currency = profile.region === "usa" ? "$" : "KSh";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    await sendPaymentReceiptEmail({
      to: profile.email,
      studentName: profile.full_name,
      invoiceTitle: invoice.title,
      amount,
      currency,
      balance,
      method,
      reference,
      paymentDate,
      portalUrl: `${baseUrl}/student/invoices`,
    });
  }

  revalidatePath(`/admin/invoices/${invoiceId}`);
}

export async function deletePayment(formData: FormData) {
  const adminProfile = await requireFinanceAccess();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const invoiceId = String(formData.get("invoice_id"));

  const { data: payment } = await supabase.from("payments").select("amount").eq("id", id).maybeSingle();
  await supabase.from("payments").delete().eq("id", id);

  void writeAuditLog({
    actorId: adminProfile.id,
    actorName: adminProfile.full_name,
    action: "delete_payment",
    targetType: "payment",
    targetId: id,
    details: { invoice_id: invoiceId, amount: payment?.amount ?? null },
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
}

export async function deleteInvoice(formData: FormData) {
  const adminProfile = await requireFinanceAccess();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { data: invoice } = await supabase.from("invoices").select("title, student_id, total_amount").eq("id", id).maybeSingle();
  await supabase.from("invoices").delete().eq("id", id);

  void writeAuditLog({
    actorId: adminProfile.id,
    actorName: adminProfile.full_name,
    action: "delete_invoice",
    targetType: "invoice",
    targetId: id,
    details: { title: invoice?.title ?? null, student_id: invoice?.student_id ?? null, total_amount: invoice?.total_amount ?? null },
  });

  revalidatePath("/admin/invoices");
  redirect("/admin/invoices");
}

export async function submitPaymentProof(formData: FormData) {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const invoiceId = String(formData.get("invoice_id") || "").trim();
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const reference = String(formData.get("reference") || "").trim();
  const paymentDate = String(formData.get("payment_date") || new Date().toISOString().slice(0, 10));

  if (!invoiceId || isNaN(amount) || amount <= 0 || !reference) {
    redirect(`/student/invoices?proof_error=${encodeURIComponent("Please fill in the amount, date, and M-Pesa transaction code.")}`);
  }

  // Verify the invoice belongs to this student
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, title, student_id, profiles(full_name, email, region)")
    .eq("id", invoiceId)
    .eq("student_id", profile.id)
    .single();

  if (!invoice) redirect("/student/invoices?proof_error=Invoice+not+found.");

  const studentProfile = invoice.profiles as unknown as { full_name: string; email: string; region: string | null } | null;
  const currency = studentProfile?.region === "usa" ? "$" : "KSh";

  // Upload screenshot if provided
  let screenshotUrl: string | null = null;
  const screenshot = formData.get("screenshot");
  if (screenshot instanceof File && screenshot.size > 0) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const ext = screenshot.name.split(".").pop() || "jpg";
    const path = `payment-proofs/${invoiceId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("application-photos")
      .upload(path, screenshot, { contentType: screenshot.type });
    if (!uploadError) {
      const { data: urlData } = admin.storage.from("application-photos").getPublicUrl(path);
      screenshotUrl = urlData.publicUrl;
    }
  }

  // Save proof record to DB for admin inbox
  await supabase.from("payment_proofs").insert({
    invoice_id: invoiceId,
    student_id: profile.id,
    amount,
    reference,
    payment_date: paymentDate,
    screenshot_url: screenshotUrl,
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  void sendPaymentProofNotification({
    studentName: studentProfile?.full_name ?? profile.full_name,
    studentEmail: studentProfile?.email ?? profile.email ?? "",
    invoiceTitle: invoice.title,
    invoiceId: invoice.id,
    amount,
    currency,
    reference,
    paymentDate,
    screenshotUrl,
    adminPortalUrl: `${baseUrl}/admin/invoices/${invoice.id}`,
  });

  redirect("/student/invoices?proof_sent=1");
}

export async function markProofReviewed(formData: FormData) {
  await requireFinanceAccess();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase
    .from("payment_proofs")
    .update({ reviewed: true, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/invoices/proofs");
}

export async function sendInvoice(formData: FormData) {
  await requireFinanceAccess();
  const supabase = await createClient();
  const invoiceId = String(formData.get("invoice_id"));

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, profiles(full_name, email), payments(*)")
    .eq("id", invoiceId)
    .single();

  if (!invoice || !invoice.profiles) return;

  const payments = (invoice.payments ?? []) as {
    payment_date: string; amount: number; method: string; reference: string | null;
  }[];
  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = invoice.total_amount - amountPaid;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  await sendInvoiceEmail({
    to: invoice.profiles.email,
    studentName: invoice.profiles.full_name,
    invoiceTitle: invoice.title,
    invoiceId: invoice.id,
    totalAmount: invoice.total_amount,
    amountPaid,
    balance,
    payments,
    notes: invoice.notes,
    portalUrl: `${baseUrl}/student/invoices`,
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
}
