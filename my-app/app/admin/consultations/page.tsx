"use client";

// Dedicated admin route for the Consultations Inbox. The component itself
// (booking list, status filter, confirm/cancel/attend modals) lives in
// /admin/subscription/_tabs.tsx where it was first authored — this page is
// a thin wrapper that hosts it at a top-level URL with its own sidebar slot.
//
// Why split it out: the original mount was a tab on /admin/subscription,
// alongside pricing tabs. That worked when the inbox felt like part of the
// subscription product, but operationally it's triage work — staff who
// confirm bookings don't care about ledger pricing and vice versa. Giving
// it its own route keeps each role's workflow one click away.

import { ConsultationsInboxTab } from "../subscription/_tabs";

export default function AdminConsultationsInboxPage() {
  return (
    <div className="mx-auto max-w-[1400px]">
      <ConsultationsInboxTab />
    </div>
  );
}
