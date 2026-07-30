"use server";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  // Only admins can use this
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Not an admin" }, { status: 403 });

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return NextResponse.json({ error: "GMAIL_USER or GMAIL_APP_PASSWORD not set in environment" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    const info = await transporter.sendMail({
      from: `"RBC Test" <${gmailUser}>`,
      to: gmailUser,
      subject: "RBC Email Test — if you see this it works!",
      text: `Email transport is working correctly.\n\nGMAIL_USER: ${gmailUser}\nTimestamp: ${new Date().toISOString()}`,
    });
    return NextResponse.json({ success: true, messageId: info.messageId, to: gmailUser });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      gmailUser,
    });
  }
}
