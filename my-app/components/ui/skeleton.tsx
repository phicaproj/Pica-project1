// Section Q — Lightweight loading skeleton primitive shared across the
// dashboard list pages. The shape mirrors shadcn's pattern (one primitive
// + per-page compositions) so future migrations to a richer skeleton lib
// are a drop-in. Each list page builds its own composition out of these
// blocks because the right-shape skeleton (card grid vs row list vs
// hero+grid) lives with the page it belongs to.

import * as React from "react";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      // bg-white/5 reads as a soft grey on the #0d1117 dashboard surface;
      // animate-pulse handles the shimmer.
      className={`animate-pulse rounded-md bg-white/5 ${className}`}
      {...props}
    />
  );
}

// ── Per-page compositions ───────────────────────────────────────────────────

/**
 * Reports list — grid of 4 placeholder cards that match the eventual
 * report card layout (header strip + score block + 2 short lines).
 */
export function ReportsListSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#111827] border border-white/5 p-5 space-y-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Consultation bookings + tier picker — matches the two-column layout in
 * /dashboard/consultation: hero strip on top, bookings grid below, then
 * the request form with three tier cards on the right.
 */
export function ConsultationSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#111827] border border-white/5 p-4 flex items-center gap-4"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#111827] border border-white/5 p-6 space-y-3"
          >
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Subscription plans picker — three plan-card placeholders matching the
 * SubscriptionCard shape (badge slot, title, price, 4 quota lines, button).
 */
export function PlansSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#111827] border border-white/5 p-6 space-y-4"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-28" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 4 }).map((__, j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
            </div>
            <Skeleton className="h-11 w-full mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pay-per-use checkout picker — hero + 3 plan tile placeholders, matches
 * the layout of /dashboard/subscription when it first lands.
 */
export function SubscriptionPickerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#111827] border border-white/5 p-6 space-y-3"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-10 w-24" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 3 }).map((__, j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
