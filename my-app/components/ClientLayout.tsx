"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import Navbar from "@/components/Navbar";
import { ThemeProvider, useTheme } from "@/components/ThemeContext";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/pages/about" },
  { label: "Free Scan", href: "/pages/freescan" },
  { label: "General Test", href: "/pages/generaltest" },
  { label: "Pricing", href: "/pages/pricing" },
];

// Animation patterns to cycle through for variety
const SECTION_ANIMS = ["anim-fade-up", "anim-fade-scale", "anim-zoom-bloom"];

function useScrollAnimations(containerRef: React.RefObject<HTMLElement | null>) {
  const pathname = usePathname();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Small delay so the DOM settles after route change
    const timeout = setTimeout(() => {
      // ── Sections: fade/scale/zoom on scroll ──
      const sections = container.querySelectorAll("section");
      sections.forEach((section) => {
        section.classList.add("anim-hidden");
      });

      // ── Grid children: staggered reveal ──
      const grids = container.querySelectorAll(
        ".grid > div, .grid > a, .grid > button, .space-y-3 > button, .space-y-3 > a"
      );
      grids.forEach((el) => {
        (el as HTMLElement).classList.add("anim-hidden");
      });

      // ── Cards with borders: hover lift ──
      const cards = container.querySelectorAll(
        ".rounded-2xl[class*='border'], .rounded-xl[class*='border'], .rounded-3xl[class*='border']"
      );
      cards.forEach((card) => {
        card.classList.add("anim-card-hover");
      });

      // ── Buttons with bg-[#f97316]: pulse on hover ──
      const buttons = container.querySelectorAll(
        "a[class*='bg-[#f97316]'], button[class*='bg-[#f97316]']"
      );
      buttons.forEach((btn) => {
        btn.classList.add("anim-btn-pulse");
      });

      // ── Intersection Observer for sections ──
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              el.classList.remove("anim-hidden");
              // Pick animation based on section index for variety
              const idx = Array.from(sections).indexOf(el);
              const animClass = SECTION_ANIMS[idx % SECTION_ANIMS.length];
              el.classList.add(animClass);
              sectionObserver.unobserve(el);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );

      sections.forEach((section) => sectionObserver.observe(section));

      // ── Intersection Observer for grid children (staggered) ──
      const gridObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement;
              // Find index among siblings for stagger
              const parent = el.parentElement;
              const siblings = parent
                ? Array.from(parent.children).filter((c) =>
                    c.classList.contains("anim-hidden")  || c.classList.contains("anim-fade-up")
                  )
                : [];
              const sibIdx = siblings.indexOf(el);
              const delay = Math.min(sibIdx, 5); // max 6 stagger levels

              el.classList.remove("anim-hidden");
              el.classList.add("anim-fade-up", `anim-delay-${delay + 1}`);
              gridObserver.unobserve(el);
            }
          });
        },
        { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
      );

      grids.forEach((el) => gridObserver.observe(el));

      return () => {
        sectionObserver.disconnect();
        gridObserver.disconnect();
      };
    }, 50);

    return () => clearTimeout(timeout);
  }, [pathname, containerRef]);
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { dark, setDark } = useTheme();
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement | null>(null);
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuth = pathname.startsWith("/Auth");

  useScrollAnimations(mainRef);

  // Dashboard has its own layout — skip the site Navbar
  if (isDashboard) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  // Auth pages render full-bleed with no site navbar
  if (isAuth) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div
      className={
        dark
          ? "bg-[#0d1117] text-white min-h-screen overflow-x-hidden"
          : "bg-white text-gray-900 min-h-screen overflow-x-hidden"
      }
    >
      <Navbar dark={dark} setDark={setDark} navItems={navItems} isFixed={true} />
      <main
        key={pathname}
        ref={mainRef}
        className="pt-[53px] animate-page-in"
      >
        {children}
      </main>

      {/* Floating dark/light mode toggle — bottom right on mobile */}
      <button
        onClick={() => setDark(!dark)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition md:hidden"
        style={{
          backgroundColor: dark ? "#1c2333" : "#f3f4f6",
          border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
          color: dark ? "#d1d5db" : "#374151",
        }}
      >
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <LayoutInner>{children}</LayoutInner>
    </ThemeProvider>
  );
}
