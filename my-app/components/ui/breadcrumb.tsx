"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

type BreadcrumbItem = {
  label: string;
  href: string;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1 text-xs text-gray-500 md:text-sm"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.href}>
            {!isLast ? (
              <Link
                href={item.href}
                className="flex items-center gap-1 transition hover:text-teal-600 dark:hover:text-teal-400"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-700 dark:text-gray-300 font-medium" aria-current="page">
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-3 h-3" aria-hidden="true" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
