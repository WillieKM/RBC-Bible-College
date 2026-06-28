"use server";

import { createClient } from "@/lib/supabase/server";
import { requireFinanceAccess } from "@/lib/auth";
import { sendInvoiceEmail, sendPaymentReceiptEmail } from "@/lib/email";
import { nextSequenceNumber } from "@/lib/sequences";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInvoice(formData: FormData) {
  const adminProfile = await requireFinanceAccess();
  const supabase = await createClient();

  const studentId = String(formData.get("student_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const totalAmount = parseFloat(String(formData.get("total_amount") || "0"));
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!studentId || !title || isNaN(totalAmount) || totalAmount <= 0) return;

  const year = new Date().getFullYear();
  const invSeq = await nextSequenceNumber(supabase, `invoice_number_${year}`);
  const invoiceNumber = `INV-${year}-${String(invSeq).padStart(4, "0")}`;

  const { data: invoice } = await supabase
    .from("invoices")
    .insert({ student_id: studentId, title, total_amount: totalAmount, notes, invoice_number: invoiceNumber })
    .select("id")
    .single();

  if (invoice) {
    void writeAuditLog({
      actorId: adminProfile.id,
      actorName: adminProfile.full_name,
      action: "create_invoice",
      targetType: "invoice",
      targetId: invoice.id,
      details: { student_id: studentId, title, total_amount: totalAmount, invoice_number: invoiceNumber },
    });
  }

  revalidatePath("/admin/invoices");
  if (invoice) redirect(`/admin/invoices/${invoice.id}`);
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
    void sendPaymentReceiptEmail({
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
