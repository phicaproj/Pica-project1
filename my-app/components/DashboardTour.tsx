"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Compass, X } from "lucide-react";
import { useTheme } from "@/components/ThemeContext";

const TOUR_KEY = "tourDashboard";

type TourStep = {
  id: string;
  route: string;
  target?: string;
  fallbackTarget?: string;
  eyebrow: string;
  title: string;
  body: string;
};

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard-nav",
    route: "/dashboard",
    target: "dashboard-sidebar",
    eyebrow: "Dashboard",
    title: "Your command center",
    body: "Use the navigation menu to move between your dashboard, Strategic Scan, Deep Dive, Consultation, Reports, Billing, and Settings.",
  },
  {
    id: "dashboard-score",
    route: "/dashboard",
    target: "dashboard-score",
    fallbackTarget: "dashboard-content",
    eyebrow: "Dashboard",
    title: "Overall score",
    body: "This is your latest business health score. It combines every pillar into one number and risk band so you can see where you stand at a glance.",
  },
  {
    id: "dashboard-pillars",
    route: "/dashboard",
    target: "dashboard-pillars",
    fallbackTarget: "dashboard-content",
    eyebrow: "Dashboard",
    title: "Pillar breakdown",
    body: "Each card shows how a single pillar scored. Spot your strongest areas and the ones that need attention before they become liabilities.",
  },
  {
    id: "dashboard-findings",
    route: "/dashboard",
    target: "dashboard-findings",
    fallbackTarget: "dashboard-content",
    eyebrow: "Dashboard",
    title: "Phase findings",
    body: "Review completed phases, their scores, and the number of findings. Click a phase to open the full report.",
  },
  {
    id: "strategic-scan",
    route: "/dashboard/strategic-scan",
    target: "strategic-scan-hero",
    eyebrow: "Strategic Scan",
    title: "Run your Strategic Scan",
    body: "The guided assessment walks you through calibrated questions across your pillars. Start a new scan here or resume one in progress — your answers save automatically.",
  },
  {
    id: "deep-dive-main",
    route: "/dashboard/deep-dive",
    target: "deep-dive-main",
    eyebrow: "Deep Dive",
    title: "Go deeper on one pillar",
    body: "Deep Dive modules focus on a single pillar for a more granular diagnostic. Start a new module here or continue an active one.",
  },
  {
    id: "deep-dive-pain-points",
    route: "/dashboard/deep-dive",
    target: "deep-dive-pain-points",
    eyebrow: "Deep Dive",
    title: "Critical pain points",
    body: "Your highest-risk Deep Dive findings surface here first. Open the full list when you want the complete picture.",
  },
  {
    id: "deep-dive-modules",
    route: "/dashboard/deep-dive",
    target: "deep-dive-modules",
    eyebrow: "Deep Dive",
    title: "Your modules",
    body: "Track purchased, in-progress, and completed modules. Each card takes you straight to the next action.",
  },
  {
    id: "consultation-overview",
    route: "/dashboard/consultation",
    target: "consultation-overview",
    eyebrow: "Consultation",
    title: "Expert guidance",
    body: "Consultations connect you with specialists who can turn your diagnostic findings into a practical plan.",
  },
  {
    id: "consultation-booking",
    route: "/dashboard/consultation",
    target: "consultation-booking",
    eyebrow: "Consultation",
    title: "Book a session",
    body: "Choose a package, pick a time, and share what you want to cover. Subscription credits are applied automatically when available.",
  },
  {
    id: "consultation-engagements",
    route: "/dashboard/consultation",
    target: "consultation-engagements",
    eyebrow: "Consultation",
    title: "Your engagements",
    body: "Upcoming sessions, meeting links, and past consultations live here so you always know what is next.",
  },
  {
    id: "reports-overview",
    route: "/dashboard/reports",
    target: "reports-overview",
    eyebrow: "Reports",
    title: "Your intelligence archive",
    body: "Reports keeps every assessment in one place, with your average health score, last assessment date, and score trend.",
  },
  {
    id: "reports-archive",
    route: "/dashboard/reports",
    target: "reports-archive",
    fallbackTarget: "reports-overview",
    eyebrow: "Reports",
    title: "Find any report",
    body: "Search by keyword or session ID, filter by scan type, score, or lock status, then open or download the report you need.",
  },
  {
    id: "plans-intro",
    route: "/dashboard/plans",
    target: "plans-intro",
    eyebrow: "Billing",
    title: "Subscription plans",
    body: "Compare monthly and annual plans. Each tier shows its monthly Strategic Scan, Deep Dive, and consultation allowances.",
  },
  {
    id: "plans-cards",
    route: "/dashboard/plans",
    target: "plans-cards",
    eyebrow: "Billing",
    title: "Choose your plan",
    body: "Pick the tier that matches your pace. Quotas reset each billing period, so choose based on how often you scan and consult.",
  },
  {
    id: "payperuse-intro",
    route: "/dashboard/subscription",
    target: "payperuse-intro",
    eyebrow: "Billing",
    title: "Pay-per-use scans",
    body: "No subscription? Buy a single Strategic Scan or Deep Dive module whenever you need one.",
  },
  {
    id: "payperuse-cards",
    route: "/dashboard/subscription",
    target: "payperuse-cards",
    eyebrow: "Billing",
    title: "One-off purchases",
    body: "Select a diagnostic, apply a coupon if you have one, and unlock it for your account.",
  },
  {
    id: "settings-tabs",
    route: "/dashboard/settings",
    target: "settings-tabs",
    eyebrow: "Settings",
    title: "Your account settings",
    body: "Use these tabs to manage your profile, business information, and billing details.",
  },
  {
    id: "settings-profile",
    route: "/dashboard/settings",
    target: "settings-profile",
    fallbackTarget: "settings-tabs",
    eyebrow: "Settings",
    title: "Profile",
    body: "Update your name, phone, avatar, and email verification. This is also where you can delete your account.",
  },
  {
    id: "settings-business",
    route: "/dashboard/settings?tab=Business%20Info",
    target: "settings-business",
    fallbackTarget: "settings-tabs",
    eyebrow: "Settings",
    title: "Business information",
    body: "Keep your business details current. Your staff size is especially important because it unlocks paid diagnostics.",
  },
  {
    id: "settings-billing",
    route: "/dashboard/settings?tab=Billing",
    target: "settings-billing",
    fallbackTarget: "settings-tabs",
    eyebrow: "Settings",
    title: "Billing",
    body: "View invoices, manage your subscription, and review your payment history in one place.",
  },
];

const MOBILE_TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard-nav-toggle",
    route: "/dashboard",
    target: "dashboard-nav-toggle",
    eyebrow: "Dashboard",
    title: "Open the menu",
    body: "Tap the menu icon to open your dashboard navigation. You can use it to reach every part of the platform.",
  },
  ...TOUR_STEPS,
];

function readTourState() {
  try {
    return localStorage.getItem(TOUR_KEY);
  } catch {
    return null;
  }
}

function writeTourState(showAgain: boolean) {
  try {
    localStorage.setItem(TOUR_KEY, showAgain ? "true" : "false");
  } catch {
    // Storage can be unavailable in private browsing; the tour still works for this session.
  }
}

export default function DashboardTour() {
  const router = useRouter();
  const pathname = usePathname();
  const { dark } = useTheme();
  const d = dark;
  const [hydrated, setHydrated] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardPlacement, setCardPlacement] = useState<"top" | "bottom">("bottom");
  const targetRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const steps = isMobile ? MOBILE_TOUR_STEPS : TOUR_STEPS;
  const activeIndex = Math.min(stepIndex, steps.length - 1);
  const step = steps[activeIndex];
  const isLastStep = activeIndex === steps.length - 1;
  const progress = ((activeIndex + 1) / steps.length) * 100;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const updateViewport = () => setIsMobile(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);

    setHydrated(true);
    if (readTourState() !== "false") {
      writeTourState(true);
      setVisible(true);
    }

    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    setStepIndex((current) => Math.min(current, steps.length - 1));
  }, [steps.length]);

  const closeTour = useCallback(
    (completed: boolean) => {
      writeTourState(!completed && !dontShowAgain);
      setVisible(false);
      setTargetRect(null);
      setCardPlacement("bottom");
      targetRef.current = null;
    },
    [dontShowAgain],
  );

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTour(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, closeTour]);

  const isNavStep = step?.id === "dashboard-nav";

  useEffect(() => {
    if (!visible || !isMobile) return;

    window.dispatchEvent(
      new CustomEvent("pica:tour-sidebar", { detail: { open: isNavStep } }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("pica:tour-sidebar", { detail: { open: false } }),
      );
    };
  }, [visible, isMobile, isNavStep]);

  useEffect(() => {
    if (!visible || !step) return;

    const currentRoute = `${window.location.pathname}${window.location.search}`;
    if (currentRoute !== step.route) {
      router.push(step.route);
    }

    setTargetRect(null);
    targetRef.current = null;
    let cancelled = false;
    let pollId: number | undefined;

    const updateRect = () => {
      const element = targetRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const inViewport =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.right > 0 &&
        rect.left < window.innerWidth &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight;
      setTargetRect(
        inViewport
          ? {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }
          : null,
      );
    };

    const startedAt = Date.now();

    const findVisibleTarget = (name?: string) => {
      if (!name) return null;
      const matches = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
      for (const element of Array.from(matches)) {
        const rect = element.getBoundingClientRect();
        if (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.right > 0 &&
          rect.left < window.innerWidth
        ) {
          return element;
        }
      }
      return null;
    };

    const attachTarget = (element: HTMLElement) => {
      if (targetRef.current === element) return;
      targetRef.current = element;
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      window.setTimeout(updateRect, 350);
    };

    const findTarget = () => {
      if (cancelled) return;

      const primary = findVisibleTarget(step.target);
      if (primary) {
        attachTarget(primary);
        return;
      }

      if (step.fallbackTarget && Date.now() - startedAt > 1500) {
        const fallback = findVisibleTarget(step.fallbackTarget);
        if (fallback) attachTarget(fallback);
      }

      if (Date.now() - startedAt > 6000) return;
      pollId = window.setTimeout(findTarget, 150);
    };

    const startId = window.setTimeout(findTarget, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(startId);
      if (pollId) window.clearTimeout(pollId);
      targetRef.current = null;
    };
  }, [visible, stepIndex, pathname, router, step]);

  useEffect(() => {
    if (!visible) return;

    const update = () => {
      const element = targetRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const inViewport =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.right > 0 &&
        rect.left < window.innerWidth &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight;
      setTargetRect(
        inViewport
          ? {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }
          : null,
      );
    };

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const interval = window.setInterval(update, 500);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      window.clearInterval(interval);
    };
  }, [visible, stepIndex]);

  useEffect(() => {
    if (!visible) return;

    const updatePlacement = () => {
      const card = cardRef.current;
      if (!card || !targetRect) {
        setCardPlacement("bottom");
        return;
      }

      const margin = window.innerWidth >= 640 ? 24 : 16;
      const cardHeight = card.offsetHeight;
      const bottomCardTop = window.innerHeight - margin - cardHeight;
      const topCardBottom = margin + cardHeight;
      const targetTop = targetRect.top - 6;
      const targetBottom = targetRect.top + targetRect.height + 6;

      const overlapsBottom =
        targetBottom > bottomCardTop && targetTop < window.innerHeight - margin;
      const overlapsTop = targetTop < topCardBottom && targetBottom > margin;

      if (overlapsBottom && !overlapsTop) {
        setCardPlacement("top");
      } else if (overlapsTop && !overlapsBottom) {
        setCardPlacement("bottom");
      } else if (overlapsBottom && overlapsTop) {
        const spaceAbove = Math.max(0, targetTop);
        const spaceBelow = Math.max(0, window.innerHeight - targetBottom);
        setCardPlacement(spaceAbove > spaceBelow ? "top" : "bottom");
      } else {
        setCardPlacement("bottom");
      }
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);

    return () => window.removeEventListener("resize", updatePlacement);
  }, [visible, targetRect, activeIndex]);

  if (!hydrated || !visible || !step) return null;

  const goNext = () => {
    if (isLastStep) {
      closeTour(true);
      return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  return (
    <>
      {targetRect && (
        <div
          className="pointer-events-none fixed z-[100] rounded-xl border-2 border-orange-400 transition-all duration-200"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.62)",
          }}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-label="Dashboard tour"
        className={`fixed inset-x-4 z-[110] mx-auto w-auto max-w-md overflow-hidden rounded-2xl border shadow-2xl transition-all duration-200 ${
          cardPlacement === "top" ? "top-4 sm:top-6" : "bottom-4 sm:bottom-6"
        } ${
          d
            ? "border-white/10 bg-[#111827] text-white shadow-black/50"
            : "border-gray-200 bg-white text-gray-900 shadow-gray-400/30"
        }`}
      >
        <div className={`h-1 ${d ? "bg-white/5" : "bg-gray-100"}`}>
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-orange-500 to-teal-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  d ? "bg-orange-500/15 text-orange-400" : "bg-orange-50 text-orange-600"
                }`}
              >
                <Compass className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                  {step.eyebrow}
                </p>
                <p className={`text-[10px] ${d ? "text-gray-500" : "text-gray-500"}`}>
                  Step {activeIndex + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => closeTour(false)}
              aria-label="Close tour"
              className={`rounded-lg p-1.5 transition ${
                d
                  ? "text-gray-500 hover:bg-white/5 hover:text-white"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2 className={`text-lg font-bold ${d ? "text-white" : "text-gray-900"}`}>
            {step.title}
          </h2>
          <p className={`mt-2 text-sm leading-relaxed ${d ? "text-gray-400" : "text-gray-600"}`}>
            {step.body}
          </p>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <button
                type="button"
                onClick={() => closeTour(false)}
                className={`text-xs font-semibold transition ${
                  d
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Skip tour
              </button>

              <label
                className={`flex cursor-pointer items-center gap-2 text-[11px] ${
                  d ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(event) => setDontShowAgain(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 accent-orange-500"
                />
                Don&apos;t show again
              </label>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {activeIndex > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  aria-label="Previous step"
                  title="Previous step"
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                    d
                      ? "border-white/10 text-gray-300 hover:bg-white/5"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                aria-label={isLastStep ? "Finish tour" : "Next step"}
                title={isLastStep ? "Finish tour" : "Next step"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600"
              >
                {isLastStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
