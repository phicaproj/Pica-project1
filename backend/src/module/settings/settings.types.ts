import { z } from 'zod';

// ============================================================
// ADMIN — app-wide settings (FX rate today)
// ============================================================
//
// The singleton `app_settings` row owns the USD→NGN exchange rate used when
// rendering or charging Nigerian users in Naira. Non-NG users continue to see
// the USD base price. The rate is admin-editable and audited via `updatedBy`.
//
// Rate bounds: a strict (0, 1_000_000] window catches typos (negative, zero,
// or wildly out-of-band values) without locking the admin out of any realistic
// future rate.

const fxRate = z
  .number()
  .gt(0, 'usdToNgn must be greater than 0')
  .max(1_000_000, 'usdToNgn looks unreasonably large')
  .refine((value) => Number.isFinite(value), { message: 'usdToNgn must be finite' });

export const updateAppSettingsSchema = z
  .object({
    usdToNgn: fxRate.optional(),
    // Section F — storefront toggles. The service additionally enforces the
    // "at least one section must stay live" invariant after merging the
    // incoming patch with the persisted row.
    payPerUseActive: z.boolean().optional(),
    subscriptionActive: z.boolean().optional(),
    // BE-1 — Phase 2B multi-pillar bundle discount. `pctPerPillar` is the % off
    // the bundle total per EXTRA pillar; `maxPillars` caps how many pillars
    // count toward the discount.
    phase2bDiscountPctPerPillar: z
      .number()
      .int('phase2bDiscountPctPerPillar must be an integer')
      .min(0, 'phase2bDiscountPctPerPillar cannot be negative')
      .max(100, 'phase2bDiscountPctPerPillar cannot exceed 100')
      .optional(),
    phase2bDiscountMaxPillars: z
      .number()
      .int('phase2bDiscountMaxPillars must be an integer')
      .min(1, 'phase2bDiscountMaxPillars must be at least 1')
      .max(7, 'phase2bDiscountMaxPillars cannot exceed 7')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsSchema>;

export type AppSettingsPayload = {
  usdToNgn: number;
  payPerUseActive: boolean;
  subscriptionActive: boolean;
  phase2bDiscountPctPerPillar: number;
  phase2bDiscountMaxPillars: number;
  updatedBy: string | null;
  updatedAt: string;
};

export type AppSettingsResponse = {
  message: string;
  settings: AppSettingsPayload;
};
