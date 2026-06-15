import { PaymentStatus, Phase, Plan, Prisma, RiskType, SessionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import { parseLocation } from '../../service/shared/location';
import type {
  FunnelStep,
  PillarBreakdownRow,
  ProblemArea,
  RegionBreakdownRow,
  ReportBreakdownsResponse,
  ReportFilters,
  ReportFunnelResponse,
  ReportKpisResponse,
  ReportProblemAreasResponse,
  ReportSessionRow,
  ReportSessionsQuery,
  ReportSessionsResponse,
  ResolvedFilters,
} from './report.types';

// Statuses that mean "the user finished answering" — sessions in these states
// have a SessionResult row and count as completed assessments.
const COMPLETED_STATUSES: SessionStatus[] = [
  SessionStatus.COMPLETED,
  SessionStatus.PAID,
  SessionStatus.REPORT_GENERATED,
];

const PROBLEM_AREAS_LIMIT = 10;

// ---------------------------------------------------------------------------
// Filter resolution
// ---------------------------------------------------------------------------

/**
 * Normalizes the parsed query filters into query-ready values. Dates are
 * interpreted as UTC calendar days: dateFrom = start of day, dateTo =
 * end of day (inclusive).
 */
export function resolveFilters(filters: ReportFilters): ResolvedFilters {
  return {
    ...filters,
    dateFromAt: filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00.000Z`) : undefined,
    dateToAt: filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999Z`) : undefined,
  };
}

/**
 * Builds the AssessmentSession where-clause every report query shares.
 *
 * Region filters match against the free-text `location` field using the same
 * "last comma part = country" convention as parseLocation (Option A — no
 * schema migration): country is an endsWith match, state a contains match.
 * The date range applies to `startedAt` so IN_PROGRESS sessions (no
 * completedAt) are still filterable.
 */
export function buildSessionWhere(f: ResolvedFilters): Prisma.AssessmentSessionWhereInput {
  return {
    ...(f.phase ? { phase: f.phase } : {}),
    ...(f.status ? { status: f.status } : {}),
    ...(f.businessSize ? { businessSize: f.businessSize } : {}),
    ...(f.industry ? { industry: { equals: f.industry, mode: 'insensitive' } } : {}),
    ...(f.country ? { location: { endsWith: f.country, mode: 'insensitive' } } : {}),
    ...(f.state ? { location: { contains: f.state, mode: 'insensitive' } } : {}),
    ...(f.colorBand ? { result: { colorBand: f.colorBand } } : {}),
    ...(f.dateFromAt || f.dateToAt
      ? {
          startedAt: {
            ...(f.dateFromAt ? { gte: f.dateFromAt } : {}),
            ...(f.dateToAt ? { lte: f.dateToAt } : {}),
          },
        }
      : {}),
  };
}

/**
 * Payment where-clause sharing the report filters where they translate.
 * Demographic filters (industry / size / region) apply via the paying user's
 * snapshotted profile. Session-only filters (status, colorBand) don't apply
 * to payments and are intentionally ignored.
 */
export function buildPaymentWhere(f: ResolvedFilters): Prisma.PaymentWhereInput {
  // Phase filter → plan filter. PHASE1 has no payments, so force an empty match.
  const planFilter: Prisma.PaymentWhereInput =
    f.phase === Phase.PHASE1
      ? { id: { in: [] } }
      : f.phase === Phase.PHASE2A
        ? { plan: Plan.PHASE2A }
        : f.phase === Phase.PHASE2B
          ? { plan: Plan.PHASE2B_PILLAR }
          : {};

  const userFilter: Prisma.UserWhereInput = {
    ...(f.businessSize ? { businessSize: f.businessSize } : {}),
    ...(f.industry ? { industry: { equals: f.industry, mode: 'insensitive' } } : {}),
    ...(f.country ? { country: { equals: f.country, mode: 'insensitive' } } : {}),
    ...(f.state ? { state: { equals: f.state, mode: 'insensitive' } } : {}),
  };

  return {
    ...planFilter,
    ...(Object.keys(userFilter).length > 0 ? { user: userFilter } : {}),
    ...(f.dateFromAt || f.dateToAt
      ? {
          createdAt: {
            ...(f.dateFromAt ? { gte: f.dateFromAt } : {}),
            ...(f.dateToAt ? { lte: f.dateToAt } : {}),
          },
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

export async function getReportKpisService(filters: ReportFilters): Promise<ReportKpisResponse> {
  const f = resolveFilters(filters);
  const where = buildSessionWhere(f);
  const resultWhere: Prisma.SessionResultWhereInput = { session: where };

  const [byPhase, total, scoreAgg, completedCount, knockoutCount, revenueByPlan] =
    await Promise.all([
      prisma.assessmentSession.groupBy({
        by: ['phase'],
        where,
        _count: { _all: true },
      }),
      prisma.assessmentSession.count({ where }),
      prisma.sessionResult.aggregate({ _avg: { totalScore: true }, where: resultWhere }),
      prisma.sessionResult.count({ where: resultWhere }),
      prisma.sessionResult.count({ where: { ...resultWhere, hasAnyKnockout: true } }),
      prisma.payment.groupBy({
        by: ['plan'],
        where: { ...buildPaymentWhere(f), status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),
    ]);

  const phase2a = revenueByPlan.find((r) => r.plan === Plan.PHASE2A)?._sum.amount?.toNumber() ?? 0;
  const phase2b =
    revenueByPlan.find((r) => r.plan === Plan.PHASE2B_PILLAR)?._sum.amount?.toNumber() ?? 0;

  return {
    message: 'Report KPIs fetched successfully',
    kpis: {
      totalAssessments: total,
      assessmentsByPhase: byPhase.map((row) => ({ phase: row.phase, count: row._count._all })),
      avgTotalScore: scoreAgg._avg.totalScore
        ? Number(scoreAgg._avg.totalScore.toNumber().toFixed(1))
        : null,
      // High-risk % = completed sessions with any knockout / completed sessions.
      highRiskPct:
        completedCount > 0 ? Number(((knockoutCount / completedCount) * 100).toFixed(1)) : null,
      revenue: {
        total: phase2a + phase2b,
        phase2a,
        phase2b,
        currency: 'NGN',
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Funnel
// ---------------------------------------------------------------------------

export async function getReportFunnelService(
  filters: ReportFilters
): Promise<ReportFunnelResponse> {
  const f = resolveFilters(filters);
  // The funnel inherently spans phases, so the `phase` filter is ignored here;
  // the demographic/date/status-agnostic filters still apply to every step.
  const base = buildSessionWhere({ ...f, phase: undefined, status: undefined });

  const phase1Completed: Prisma.AssessmentSessionWhereInput = {
    ...base,
    phase: Phase.PHASE1,
    status: { in: COMPLETED_STATUSES },
  };

  const [p1Completed, registered, p2aStarted, p2aCompleted, paid] = await Promise.all([
    prisma.assessmentSession.count({ where: phase1Completed }),
    // Registration links the Phase 1 session to the new user (userId set) —
    // no email re-matching needed.
    prisma.assessmentSession.count({ where: { ...phase1Completed, userId: { not: null } } }),
    prisma.assessmentSession.count({ where: { ...base, phase: Phase.PHASE2A } }),
    prisma.assessmentSession.count({
      where: { ...base, phase: Phase.PHASE2A, status: { in: COMPLETED_STATUSES } },
    }),
    prisma.assessmentSession.count({
      where: { ...base, phase: Phase.PHASE2A, result: { isPaid: true } },
    }),
  ]);

  const steps: { key: FunnelStep['key']; label: string; count: number }[] = [
    { key: 'phase1Completed', label: 'Free Snapshot completed', count: p1Completed },
    { key: 'registered', label: 'Created an account', count: registered },
    { key: 'phase2aStarted', label: 'Full Diagnostic started', count: p2aStarted },
    { key: 'phase2aCompleted', label: 'Full Diagnostic completed', count: p2aCompleted },
    { key: 'paid', label: 'Paid for report', count: paid },
  ];

  const funnel: FunnelStep[] = steps.map((step, i) => ({
    ...step,
    pctOfPrevious:
      i === 0
        ? null
        : steps[i - 1].count > 0
          ? Number(((step.count / steps[i - 1].count) * 100).toFixed(1))
          : null,
  }));

  return { message: 'Report funnel fetched successfully', funnel };
}

// ---------------------------------------------------------------------------
// Problem areas
// ---------------------------------------------------------------------------

export async function getReportProblemAreasService(
  filters: ReportFilters
): Promise<ReportProblemAreasResponse> {
  const f = resolveFilters(filters);
  const where = buildSessionWhere(f);

  // One answer per question per session (@@unique[sessionId, questionId]), so
  // grouping responses by the selected option counts affected sessions directly.
  const grouped = await prisma.sessionResponse.groupBy({
    by: ['selectedOptionId'],
    where: {
      riskTypeAtTime: { in: [RiskType.RISK, RiskType.KNOCKOUT] },
      session: where,
    },
    _count: { _all: true },
    orderBy: { _count: { selectedOptionId: 'desc' } },
    take: PROBLEM_AREAS_LIMIT,
  });

  if (grouped.length === 0) {
    return { message: 'Report problem areas fetched successfully', problemAreas: [] };
  }

  const options = await prisma.questionOption.findMany({
    where: { id: { in: grouped.map((g) => g.selectedOptionId) } },
    select: {
      id: true,
      optionLabel: true,
      observation: true,
      riskType: true,
      question: {
        select: {
          id: true,
          questionCode: true,
          questionText: true,
          pillar: { select: { name: true } },
        },
      },
    },
  });
  const optionById = new Map(options.map((o) => [o.id, o]));

  const problemAreas: ProblemArea[] = grouped.flatMap((g) => {
    const option = optionById.get(g.selectedOptionId);
    if (!option) return [];
    return [
      {
        questionId: option.question.id,
        questionCode: option.question.questionCode,
        questionText: option.question.questionText,
        optionLabel: option.optionLabel,
        observation: option.observation,
        pillarName: option.question.pillar.name,
        // The current option riskType could have been edited since the answer;
        // responses snapshot riskTypeAtTime, but for display the current value
        // is close enough and KNOCKOUT/RISK only.
        riskType: option.riskType === RiskType.KNOCKOUT ? 'KNOCKOUT' : 'RISK',
        affectedBusinesses: g._count._all,
      },
    ];
  });

  return { message: 'Report problem areas fetched successfully', problemAreas };
}

// ---------------------------------------------------------------------------
// Breakdowns
// ---------------------------------------------------------------------------

export async function getReportBreakdownsService(
  filters: ReportFilters
): Promise<ReportBreakdownsResponse> {
  const f = resolveFilters(filters);
  const where = buildSessionWhere(f);

  const [
    pillars,
    pillarScoreAvgs,
    phase2bPurchases,
    byPhase,
    locations,
    industryResults,
    bySize,
    byBand,
  ] = await Promise.all([
    prisma.pillar.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, name: true, displayOrder: true },
    }),
    prisma.sessionPillarScore.groupBy({
      by: ['pillarId'],
      where: { session: where },
      _avg: { weightedScore: true },
    }),
    prisma.payment.groupBy({
      by: ['pillarId'],
      where: {
        ...buildPaymentWhere(f),
        status: PaymentStatus.SUCCESS,
        plan: Plan.PHASE2B_PILLAR,
      },
      _count: { _all: true },
    }),
    prisma.assessmentSession.groupBy({ by: ['phase'], where, _count: { _all: true } }),
    // Region: location is free text, so fetch + parse with the shared helper.
    prisma.assessmentSession.findMany({ where, select: { location: true } }),
    // Industry avg score needs the session→result join, which groupBy can't
    // express — fetch the narrow pair and aggregate in memory.
    prisma.sessionResult.findMany({
      where: { session: where },
      select: { totalScore: true, session: { select: { industry: true } } },
    }),
    prisma.assessmentSession.groupBy({ by: ['businessSize'], where, _count: { _all: true } }),
    prisma.sessionResult.groupBy({
      by: ['colorBand'],
      where: { session: where },
      _count: { _all: true },
    }),
  ]);

  const avgByPillar = new Map(
    pillarScoreAvgs.map((row) => [row.pillarId, row._avg.weightedScore?.toNumber() ?? null])
  );
  const purchasesByPillar = new Map(
    phase2bPurchases
      .filter((row) => row.pillarId !== null)
      .map((row) => [row.pillarId as string, row._count._all])
  );

  const byPillar: PillarBreakdownRow[] = pillars.map((pillar) => {
    const avg = avgByPillar.get(pillar.id) ?? null;
    return {
      pillarId: pillar.id,
      pillarName: pillar.name,
      displayOrder: pillar.displayOrder,
      phase2bPurchases: purchasesByPillar.get(pillar.id) ?? 0,
      avgWeightedScore: avg !== null ? Number(avg.toFixed(1)) : null,
    };
  });

  // Region: country → state counts.
  const regionMap = new Map<string, { count: number; states: Map<string, number> }>();
  for (const row of locations) {
    const { country, state } = parseLocation(row.location);
    if (!country) continue;
    const key = country.toLowerCase();
    const entry = regionMap.get(key) ?? { count: 0, states: new Map<string, number>() };
    entry.count += 1;
    if (state) entry.states.set(state, (entry.states.get(state) ?? 0) + 1);
    regionMap.set(key, entry);
  }
  // Preserve a display-cased country name (first occurrence wins).
  const displayCountry = new Map<string, string>();
  for (const row of locations) {
    const { country } = parseLocation(row.location);
    if (country && !displayCountry.has(country.toLowerCase())) {
      displayCountry.set(country.toLowerCase(), country);
    }
  }
  const byRegion: RegionBreakdownRow[] = [...regionMap.entries()]
    .map(([key, entry]) => ({
      country: displayCountry.get(key) ?? key,
      count: entry.count,
      states: [...entry.states.entries()]
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.count - a.count);

  // Industry: counts from sessions, avg score from results.
  const industryCounts = await prisma.assessmentSession.groupBy({
    by: ['industry'],
    where,
    _count: { _all: true },
  });
  const industryScores = new Map<string, { sum: number; n: number }>();
  for (const row of industryResults) {
    const industry = row.session.industry;
    const entry = industryScores.get(industry) ?? { sum: 0, n: 0 };
    entry.sum += row.totalScore.toNumber();
    entry.n += 1;
    industryScores.set(industry, entry);
  }
  const byIndustry = industryCounts
    .map((row) => {
      const scores = industryScores.get(row.industry);
      return {
        industry: row.industry,
        count: row._count._all,
        avgScore: scores && scores.n > 0 ? Number((scores.sum / scores.n).toFixed(1)) : null,
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    message: 'Report breakdowns fetched successfully',
    breakdowns: {
      byPillar,
      byPhase: byPhase.map((row) => ({ phase: row.phase, count: row._count._all })),
      byRegion,
      byIndustry,
      byBusinessSize: bySize.map((row) => ({
        businessSize: row.businessSize ?? 'UNKNOWN',
        count: row._count._all,
      })),
      byColorBand: byBand.map((row) => ({ colorBand: row.colorBand, count: row._count._all })),
    },
  };
}

// ---------------------------------------------------------------------------
// Sessions list
// ---------------------------------------------------------------------------

// Narrow select shared by the sessions endpoint and the export's Assessments
// sheet so both render identical rows.
export const sessionRowSelect = {
  id: true,
  businessName: true,
  leadEmail: true,
  phase: true,
  status: true,
  startedAt: true,
  completedAt: true,
  user: { select: { email: true } },
  result: {
    select: {
      totalScore: true,
      colorBand: true,
      hasAnyKnockout: true,
      isPaid: true,
      reportPdfUrl: true,
    },
  },
  pillarScores: {
    select: {
      pillarId: true,
      weightedScore: true,
      colorBand: true,
    },
  },
} satisfies Prisma.AssessmentSessionSelect;

type SessionRowRecord = Prisma.AssessmentSessionGetPayload<{ select: typeof sessionRowSelect }>;

export function toSessionRow(
  session: SessionRowRecord,
  pillars: { id: string; name: string }[]
): ReportSessionRow {
  const scoreByPillar = new Map(session.pillarScores.map((s) => [s.pillarId, s]));
  return {
    id: session.id,
    businessName: session.businessName,
    email: session.leadEmail ?? session.user?.email ?? null,
    phase: session.phase,
    completedAt: session.completedAt,
    // All 7 pillars in display order; unscored pillars (e.g. the other 6 on a
    // Phase 2B deep-dive) come back null so the FE renders empty dots.
    pillarBands: pillars.map((pillar) => {
      const score = scoreByPillar.get(pillar.id);
      return {
        pillarName: pillar.name,
        colorBand: score?.colorBand ?? null,
        weightedScore: score ? Number(score.weightedScore.toNumber().toFixed(1)) : null,
      };
    }),
    totalScore: session.result ? Number(session.result.totalScore.toNumber().toFixed(1)) : null,
    overallBand: session.result?.colorBand ?? null,
    hasAnyKnockout: session.result?.hasAnyKnockout ?? false,
    status: session.status,
    isPaid: session.result?.isPaid ?? false,
    reportPdfUrl: session.result?.reportPdfUrl ?? null,
  };
}

export async function getOrderedPillars(): Promise<{ id: string; name: string }[]> {
  return prisma.pillar.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true },
  });
}

export async function getReportSessionsService(
  query: ReportSessionsQuery
): Promise<ReportSessionsResponse> {
  const { page, pageSize, ...filters } = query;
  const f = resolveFilters(filters);
  const where = buildSessionWhere(f);

  const [total, rows, pillars] = await Promise.all([
    prisma.assessmentSession.count({ where }),
    prisma.assessmentSession.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { startedAt: 'desc' },
      select: sessionRowSelect,
    }),
    getOrderedPillars(),
  ]);

  return {
    message: 'Report sessions fetched successfully',
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    sessions: rows.map((row) => toSessionRow(row, pillars)),
  };
}
