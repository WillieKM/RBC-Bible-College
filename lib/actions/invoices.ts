"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { sendInvoiceEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInvoice(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const studentId = String(formData.get("student_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const totalAmount = parseFloat(String(formData.get("total_amount") || "0"));
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!studentId || !title || isNaN(totalAmount) || totalAmount <= 0) return;

  const { data: invoice } = await supabase
    .from("invoices")
    .insert({ student_id: studentId, title, total_amount: totalAmount, notes })
    .select("id")
    .single();

  revalidatePath("/admin/invoices");
  if (invoice) redirect(`/admin/invoices/${invoice.id}`);
}

export async function addPayment(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const invoiceId = String(formData.get("invoice_id"));
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const paymentDate = String(formData.get("payment_date") || new Date().toISOString().slice(0, 10));
  const method = String(formData.get("method") || "cash");
  const reference = String(formData.get("reference") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!invoiceId || isNaN(amount) || amount <= 0) return;

  await supabase.from("payments").insert({ invoice_id: invoiceId, amount, payment_date: paymentDate, method, reference, notes });
  revalidatePath(`/admin/invoices/${invoiceId}`);
}

export async function deletePayment(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const invoiceId = String(formData.get("invoice_id"));
  await supabase.from("payments").delete().eq("id", id);
  revalidatePath(`/admin/invoices/${invoiceId}`);
}

export async function deleteInvoice(formData: FormData) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("invoices").delete().eq("id", id);
  revalidatePath("/admin/invoices");
  redirect("/admin/invoices");
}

export async function sendInvoice(formData: FormData) {
  await requireRole(["admin"]);
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
