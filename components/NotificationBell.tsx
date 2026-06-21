"use client";

import { useState } from "react";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import type { Notification } from "@/lib/types";

export function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-slate-200"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-800">Notifications</p>
            {unread > 0 && (
              <form action={markAllNotificationsRead} onSubmit={() => setOpen(false)}>
                <button className="text-xs text-gold-dark hover:underline">Mark all read</button>
              </form>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={`border-b border-slate-50 px-4 py-3 ${n.read ? "" : "bg-gold/5"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                    <p className="mt-1 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.read && (
                    <form action={markNotificationRead}>
                      <input type="hidden" name="id" value={n.id} />
                      <button className="mt-0.5 h-2 w-2 rounded-full bg-gold hover:bg-gold-dark" title="Mark read" />
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
