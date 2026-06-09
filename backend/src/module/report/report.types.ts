import z from 'zod';
import type { ColorBand, Phase, PaymentStatus, SessionStatus } from '@prisma/client';

/**
 * Shared filter set for every /api/admin/reports/* endpoint.
 *
 * All fields are optional — an empty query means "all data". The same parsed
 * object drives the JSON endpoints AND the Excel export so the downloaded
 * file always matches what the page is showing.
 */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date formatted as YYYY-MM-DD');

export const reportFiltersQuery = z.object({
  phase: z.enum(['PHASE1', 'PHASE2A', 'PHASE2B']).optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  country: z.string().trim().min(1).max(100).optional(),
  state: z.string().trim().min(1).max(100).optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'PAID', 'REPORT_GENERATED']).optional(),
  colorBand: z.enum(['RED', 'AMBER', 'GREEN']).optional(),
  businessSize: z.enum(['SMALL', 'MEDIUM']).optional(),
  industry: z.string().trim().min(1).max(100).optional(),
});

export const reportSessionsQuery = reportFiltersQuery.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReportFilters = z.infer<typeof reportFiltersQuery>;
export type ReportSessionsQuery = z.infer<typeof reportSessionsQuery>;

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

export type ReportKpisResponse = {
  message: string;
  kpis: {
    totalAssessments: number;
    assessmentsByPhase: { phase: Phase; count: number }[];
    // Average SessionResult.totalScore across completed sessions (null when none).
    avgTotalScore: number | null;
    // % of completed sessions (sessions with a result row) where hasAnyKnockout.
    highRiskPct: number | null;
    revenue: {
      total: number;
      phase2a: number;
      phase2b: number;
      currency: string;
    };
  };
};

export type FunnelStep = {
  key: 'phase1Completed' | 'registered' | 'phase2aStarted' | 'phase2aCompleted' | 'paid';
  label: string;
  count: number;
  // % of the previous step (null for the first step).
  pctOfPrevious: number | null;
};

export type ReportFunnelResponse = {
  message: string;
  funnel: FunnelStep[];
};

export type ProblemArea = {
  questionId: string;
  questionCode: string;
  questionText: string;
  optionLabel: string;
  observation: string;
  pillarName: string;
  riskType: 'RISK' | 'KNOCKOUT';
  affectedBusinesses: number;
};

export type ReportProblemAreasResponse = {
  message: string;
  problemAreas: ProblemArea[];
};

export type PillarBreakdownRow = {
  pillarId: string;
  pillarName: string;
  displayOrder: number;
  phase2bPurchases: number;
  avgWeightedScore: number | null;
};

export type RegionBreakdownRow = {
  country: string;
  count: number;
  states: { state: string; count: number }[];
};

export type ReportBreakdownsResponse = {
  message: string;
  breakdowns: {
    byPillar: PillarBreakdownRow[];
    byPhase: { phase: Phase; count: number }[];
    byRegion: RegionBreakdownRow[];
    byIndustry: { industry: string; count: number; avgScore: number | null }[];
    byBusinessSize: { businessSize: string; count: number }[];
    byColorBand: { colorBand: ColorBand; count: number }[];
  };
};

export type ReportSessionRow = {
  id: string;
  businessName: string;
  email: string | null;
  phase: Phase;
  completedAt: Date | null;
  // Ordered by pillar displayOrder; null band = pillar not scored (e.g. 2B rows
  // only score one pillar).
  pillarBands: { pillarName: string; colorBand: ColorBand | null; weightedScore: number | null }[];
  totalScore: number | null;
  overallBand: ColorBand | null;
  hasAnyKnockout: boolean;
  status: SessionStatus;
  isPaid: boolean;
  reportPdfUrl: string | null;
};

export type ReportSessionsResponse = {
  message: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sessions: ReportSessionRow[];
};

// Internal: a parsed/normalized filter object the service queries with.
export type ResolvedFilters = ReportFilters & {
  dateFromAt?: Date;
  dateToAt?: Date;
};

export type PaymentExportRow = {
  date: Date | null;
  customerEmail: string;
  customerBusinessName: string | null;
  plan: string;
  pillarName: string | null;
  amount: number;
  couponCode: string | null;
  discountAmount: number | null;
  status: PaymentStatus;
  reference: string;
};
