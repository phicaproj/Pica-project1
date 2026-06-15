import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Slice 2 currency split:
// - Base prices flow as USD eventually; today the BE still serves NGN values
//   but tags them with `currency`. Callers should pass the row's currency,
//   not assume it.
// - Nigerian users see "₦1,800,000"; everyone else sees "$1,200".
// - `null`/`undefined`/non-finite amounts return "Not configured" to match
//   the existing "Not configured" copy that older pricing UI used.
export type Currency = "USD" | "NGN"

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  NGN: "₦",
}

export function formatMoney(
  amount: number | null | undefined,
  currency: Currency,
): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "Not configured"
  }
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `
  // toLocaleString without explicit fractional digits matches how prices are
  // displayed today (whole-number NGN, no trailing .00). USD prices in the
  // PICA catalogue are also whole-number ($1,200 / $2,400), so this is fine.
  return `${symbol}${Math.round(amount).toLocaleString()}`
}

// Pick the user's display currency from their stored `country`. Anyone in
// Nigeria sees NGN; everyone else sees USD. Used at the call site to flip
// between `price` (USD base) and `price * usdToNgn` (rendered NGN).
//
// Accepts the various ways the BE has spelled Nigeria across signup/lead
// capture so a stale uppercase or 2-letter value still resolves correctly.
const NIGERIA_ALIASES = new Set([
  "nigeria",
  "ng",
  "nga",
  "federal republic of nigeria",
])

export function resolveDisplayCurrency(
  country: string | null | undefined,
): Currency {
  if (!country) return "USD"
  return NIGERIA_ALIASES.has(country.trim().toLowerCase()) ? "NGN" : "USD"
}

// Converts a USD base amount to the user's display currency using the FX rate
// served by /payment/pricing. For NGN we multiply; for USD we pass through.
// Returns null when the input is missing so callers can render "Not configured"
// (same shape `formatMoney` accepts).
export function convertFromUsd(
  usdAmount: number | null | undefined,
  target: Currency,
  usdToNgn: number,
): number | null {
  if (usdAmount === null || usdAmount === undefined || !Number.isFinite(usdAmount)) {
    return null
  }
  if (target === "USD") return usdAmount
  return usdAmount * usdToNgn
}
