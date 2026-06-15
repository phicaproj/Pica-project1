import type { Response } from 'express';
import ExcelJS from 'exceljs';
import { Phase, Prisma, RiskType, SessionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import { parseLocation } from '../../service/shared/location';
import {
  buildPaymentWhere,
  buildSessionWhere,
  getOrderedPillars,
  getReportBreakdownsService,
  getReportFunnelService,
  getReportKpisService,
  resolveFilters,
  sessionRowSelect,
  toSessionRow,
} from './report.service';
import type { ReportFilters } from './report.types';

// Rows fetched per findMany page while streaming sheets. Keeps memory flat on
// unbounded date ranges.
const CHUNK_SIZE = 500;

// ---------------------------------------------------------------------------
// Plain-English label maps — the client is non-technical, so enum values never
// reach the spreadsheet.
// ---------------------------------------------------------------------------

const PHASE_LABELS: Record<Phase, string> = {
  PHASE1: 'Free Snapshot',
  PHASE2A: 'Full Diagnostic',
  PHASE2B: 'Deep Dive',
};

const STATUS_LABELS: Record<SessionStatus, string> = {
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  PAID: 'Paid',
  REPORT_GENERATED: 'Report ready',
};

const BAND_LABELS: Record<string, string> = {
  RED: 'Red (urgent attention)',
  AMBER: 'Amber (needs work)',
  GREEN: 'Green (healthy)',
};

const RISK_LABELS: Record<RiskType, string> = {
  NORMAL: 'Normal',
  RISK: 'Risk',
  KNOCKOUT: 'High-risk',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  SUCCESS: 'Successful',
  FAILED: 'Failed',
  ABANDONED: 'Abandoned',
  REVERSED: 'Refunded/Reversed',
};

const PLAN_LABELS: Record<string, string> = {
  PHASE2A: 'Full Diagnostic',
  PHASE2B_PILLAR: 'Deep Dive (per pillar)',
};

const SIZE_LABELS: Record<string, string> = {
  SMALL: 'Small business',
  MEDIUM: 'Medium business',
  UNKNOWN: 'Not captured',
};

function bandLabel(band: string | null | undefined): string {
  return band ? (BAND_LABELS[band] ?? band) : '';
}

function dateCell(value: Date | null | undefined): Date | '' {
  return value ?? '';
}

function describeFilters(filters: ReportFilters): string {
  const parts: string[] = [];
  if (filters.phase) parts.push(`Assessment type: ${PHASE_LABELS[filters.phase]}`);
  if (filters.dateFrom && filters.dateTo)
    parts.push(`Date range: ${filters.dateFrom} to ${filters.dateTo}`);
  else if (filters.dateFrom) parts.push(`From: ${filters.dateFrom}`);
  else if (filters.dateTo) parts.push(`Up to: ${filters.dateTo}`);
  if (filters.country) parts.push(`Country: ${filters.country}`);
  if (filters.state) parts.push(`State/Region: ${filters.state}`);
  if (filters.status) parts.push(`Status: ${STATUS_LABELS[filters.status]}`);
  if (filters.colorBand) parts.push(`Overall result: ${bandLabel(filters.colorBand)}`);
  if (filters.businessSize) parts.push(`Business size: ${SIZE_LABELS[filters.businessSize]}`);
  if (filters.industry) parts.push(`Industry: ${filters.industry}`);
  return parts.length > 0 ? parts.join(' • ') : 'No filters applied — this file covers all data.';
}

function styleHeaderRow(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.commit();
}

/**
 * Pages through a findMany in CHUNK_SIZE batches via skip/take, invoking
 * `handle` per batch. Keeps only one chunk in memory at a time.
 */
async function forEachChunk<T>(
  fetchPage: (skip: number, take: number) => Promise<T[]>,
  handle: (rows: T[]) => void
): Promise<void> {
  let skip = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await fetchPage(skip, CHUNK_SIZE);
    if (rows.length === 0) break;
    handle(rows);
    if (rows.length < CHUNK_SIZE) break;
    skip += CHUNK_SIZE;
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Streams a multi-sheet .xlsx straight into the HTTP response using the
 * ExcelJS streaming WorkbookWriter — no temp files, no full workbook in
 * memory. Sheet rows are committed as they are written.
 */
export async function streamReportExcelService(
  filters: ReportFilters,
  res: Response
): Promise<void> {
  const f = resolveFilters(filters);
  const where = buildSessionWhere(f);

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: false,
  });

  // ---- Sheet 1: Overview --------------------------------------------------
  const [kpis, funnel, breakdowns, pillars] = await Promise.all([
    getReportKpisService(filters),
    getReportFunnelService(filters),
    getReportBreakdownsService(filters),
    getOrderedPillars(),
  ]);

  const overview = workbook.addWorksheet('Overview');
  overview.columns = [{ width: 42 }, { width: 24 }, { width: 18 }];
  // Style BEFORE committing — streamed rows are flushed and can't be touched
  // afterwards (getRow on a committed row throws and truncates the download).
  const titleRow = overview.addRow(['PICA — Reports & Analytics export']);
  titleRow.font = { bold: true, size: 14 };
  titleRow.commit();
  overview.addRow([describeFilters(filters)]).commit();
  overview.addRow([]).commit();

  overview.addRow(['Key numbers']).commit();
  overview.addRow(['Total assessments', kpis.kpis.totalAssessments]).commit();
  for (const row of kpis.kpis.assessmentsByPhase) {
    overview.addRow([`  …of which ${PHASE_LABELS[row.phase]}`, row.count]).commit();
  }
  overview
    .addRow(['Average score (completed assessments)', kpis.kpis.avgTotalScore ?? 'No data'])
    .commit();
  overview.addRow(['High-risk assessments (%)', kpis.kpis.highRiskPct ?? 'No data']).commit();
  overview.addRow(['Total revenue (NGN)', kpis.kpis.revenue.total]).commit();
  overview.addRow(['  …from Full Diagnostic', kpis.kpis.revenue.phase2a]).commit();
  overview.addRow(['  …from Deep Dives', kpis.kpis.revenue.phase2b]).commit();
  overview.addRow([]).commit();

  overview.addRow(['Where users drop off', 'Count', '% of previous step']).commit();
  for (const step of funnel.funnel) {
    overview
      .addRow([
        step.label,
        step.count,
        step.pctOfPrevious !== null ? `${step.pctOfPrevious}%` : '—',
      ])
      .commit();
  }
  overview.commit();

  // ---- Sheet 2: Assessments ----------------------------------------------
  const assessments = workbook.addWorksheet('Assessments');
  assessments.columns = [
    { header: 'Business name', width: 28 },
    { header: 'Email', width: 30 },
    { header: 'Industry', width: 20 },
    { header: 'Country', width: 16 },
    { header: 'State/Region', width: 18 },
    { header: 'Business size', width: 16 },
    { header: 'Years operating', width: 14 },
    { header: 'Assessment type', width: 18 },
    { header: 'Started', width: 20 },
    { header: 'Completed', width: 20 },
    { header: 'Total score', width: 12 },
    { header: 'Overall result', width: 22 },
    { header: 'High-risk?', width: 10 },
    { header: 'Status', width: 14 },
    { header: 'Paid?', width: 8 },
    ...pillars.map((p) => ({ header: `${p.name} — score`, width: 18 })),
    ...pillars.map((p) => ({ header: `${p.name} — result`, width: 22 })),
  ];
  styleHeaderRow(assessments);

  const assessmentSelect = {
    ...sessionRowSelect,
    industry: true,
    location: true,
    businessSize: true,
    operatingYears: true,
    startedAt: true,
  } satisfies Prisma.AssessmentSessionSelect;

  await forEachChunk(
    (skip, take) =>
      prisma.assessmentSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take,
        select: assessmentSelect,
      }),
    (rows) => {
      for (const session of rows) {
        const row = toSessionRow(session, pillars);
        const { country, state } = parseLocation(session.location);
        assessments
          .addRow([
            row.businessName,
            row.email ?? '',
            session.industry,
            country ?? '',
            state ?? '',
            SIZE_LABELS[session.businessSize ?? 'UNKNOWN'],
            session.operatingYears,
            PHASE_LABELS[row.phase],
            dateCell(session.startedAt),
            dateCell(row.completedAt),
            row.totalScore ?? '',
            bandLabel(row.overallBand),
            row.hasAnyKnockout ? 'Yes' : 'No',
            STATUS_LABELS[row.status],
            row.isPaid ? 'Yes' : 'No',
            ...row.pillarBands.map((band) => band.weightedScore ?? ''),
            ...row.pillarBands.map((band) => bandLabel(band.colorBand)),
          ])
          .commit();
      }
    }
  );
  assessments.commit();

  // ---- Sheet 3: Answers ---------------------------------------------------
  const answers = workbook.addWorksheet('Answers');
  answers.columns = [
    { header: 'Assessment ref', width: 38 },
    { header: 'Business name', width: 28 },
    { header: 'Pillar', width: 24 },
    { header: 'Question code', width: 14 },
    { header: 'Question', width: 60 },
    { header: 'Chosen answer', width: 8 },
    { header: 'Answer text', width: 60 },
    { header: 'Score', width: 8 },
    { header: 'Risk level', width: 12 },
    { header: 'Answered on', width: 20 },
  ];
  styleHeaderRow(answers);

  await forEachChunk(
    (skip, take) =>
      prisma.sessionResponse.findMany({
        where: { session: where },
        orderBy: { answeredAt: 'desc' },
        skip,
        take,
        select: {
          sessionId: true,
          scoreAtTime: true,
          riskTypeAtTime: true,
          answeredAt: true,
          session: { select: { businessName: true } },
          question: {
            select: {
              questionCode: true,
              questionText: true,
              pillar: { select: { name: true } },
            },
          },
          selectedOption: { select: { optionLabel: true, optionText: true } },
        },
      }),
    (rows) => {
      for (const response of rows) {
        answers
          .addRow([
            response.sessionId,
            response.session.businessName,
            response.question.pillar.name,
            response.question.questionCode,
            response.question.questionText,
            response.selectedOption.optionLabel,
            response.selectedOption.optionText,
            response.scoreAtTime,
            RISK_LABELS[response.riskTypeAtTime],
            dateCell(response.answeredAt),
          ])
          .commit();
      }
    }
  );
  answers.commit();

  // ---- Sheet 4: Breakdowns ------------------------------------------------
  const breakdownSheet = workbook.addWorksheet('Breakdowns');
  breakdownSheet.columns = [{ width: 30 }, { width: 22 }, { width: 22 }];
  const b = breakdowns.breakdowns;

  breakdownSheet.addRow(['By pillar', 'Deep Dive purchases', 'Average score']).commit();
  for (const row of b.byPillar) {
    breakdownSheet
      .addRow([row.pillarName, row.phase2bPurchases, row.avgWeightedScore ?? 'No data'])
      .commit();
  }
  breakdownSheet.addRow([]).commit();

  breakdownSheet.addRow(['By assessment type', 'Assessments']).commit();
  for (const row of b.byPhase) {
    breakdownSheet.addRow([PHASE_LABELS[row.phase], row.count]).commit();
  }
  breakdownSheet.addRow([]).commit();

  breakdownSheet.addRow(['By region', 'Assessments']).commit();
  for (const region of b.byRegion) {
    breakdownSheet.addRow([region.country, region.count]).commit();
    for (const state of region.states) {
      breakdownSheet.addRow([`  ${state.state}`, state.count]).commit();
    }
  }
  breakdownSheet.addRow([]).commit();

  breakdownSheet.addRow(['By industry', 'Assessments', 'Average score']).commit();
  for (const row of b.byIndustry) {
    breakdownSheet.addRow([row.industry, row.count, row.avgScore ?? 'No data']).commit();
  }
  breakdownSheet.addRow([]).commit();

  breakdownSheet.addRow(['By business size', 'Assessments']).commit();
  for (const row of b.byBusinessSize) {
    breakdownSheet.addRow([SIZE_LABELS[row.businessSize] ?? row.businessSize, row.count]).commit();
  }
  breakdownSheet.addRow([]).commit();

  breakdownSheet.addRow(['By overall result', 'Assessments']).commit();
  for (const row of b.byColorBand) {
    breakdownSheet.addRow([bandLabel(row.colorBand), row.count]).commit();
  }
  breakdownSheet.commit();

  // ---- Sheet 5: Payments --------------------------------------------------
  // All statuses (audit view) — the Overview revenue numbers are SUCCESS-only.
  const payments = workbook.addWorksheet('Payments');
  payments.columns = [
    { header: 'Date', width: 20 },
    { header: 'Customer email', width: 30 },
    { header: 'Business name', width: 28 },
    { header: 'Plan', width: 22 },
    { header: 'Pillar (Deep Dive)', width: 24 },
    { header: 'Amount (NGN)', width: 14 },
    { header: 'Coupon code', width: 16 },
    { header: 'Discount (NGN)', width: 14 },
    { header: 'Status', width: 18 },
    { header: 'Payment reference', width: 28 },
  ];
  styleHeaderRow(payments);

  // Payments use their own filter translation (plan ← phase, demographics via
  // the paying user) so the sheet respects the same filters as the page.
  const paymentWhere = buildPaymentWhere(f);

  await forEachChunk(
    (skip, take) =>
      prisma.payment.findMany({
        where: paymentWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          createdAt: true,
          paidAt: true,
          customerEmail: true,
          customerBusinessName: true,
          plan: true,
          amount: true,
          appliedCouponCode: true,
          discountAmount: true,
          status: true,
          providerReference: true,
          pillar: { select: { name: true } },
        },
      }),
    (rows) => {
      for (const payment of rows) {
        payments
          .addRow([
            dateCell(payment.paidAt ?? payment.createdAt),
            payment.customerEmail,
            payment.customerBusinessName ?? '',
            PLAN_LABELS[payment.plan] ?? payment.plan,
            payment.pillar?.name ?? '',
            payment.amount.toNumber(),
            payment.appliedCouponCode ?? '',
            payment.discountAmount?.toNumber() ?? '',
            PAYMENT_STATUS_LABELS[payment.status] ?? payment.status,
            payment.providerReference,
          ])
          .commit();
      }
    }
  );
  payments.commit();

  // ---- Sheet 6: Leads -----------------------------------------------------
  // One row per Phase 1 session: how far did this lead get down the funnel?
  const leads = workbook.addWorksheet('Leads');
  leads.columns = [
    { header: 'Email', width: 30 },
    { header: 'Business name', width: 28 },
    { header: 'Industry', width: 20 },
    { header: 'Country', width: 16 },
    { header: 'State/Region', width: 18 },
    { header: 'Business size', width: 16 },
    { header: 'Started', width: 20 },
    { header: 'Completed free snapshot?', width: 22 },
    { header: 'Created an account?', width: 18 },
    { header: 'Started Full Diagnostic?', width: 22 },
    { header: 'Paid?', width: 8 },
  ];
  styleHeaderRow(leads);

  const leadsWhere: Prisma.AssessmentSessionWhereInput = {
    ...buildSessionWhere({ ...f, phase: undefined }),
    phase: Phase.PHASE1,
  };

  await forEachChunk(
    (skip, take) =>
      prisma.assessmentSession.findMany({
        where: leadsWhere,
        orderBy: { startedAt: 'desc' },
        skip,
        take,
        select: {
          leadEmail: true,
          businessName: true,
          industry: true,
          location: true,
          businessSize: true,
          startedAt: true,
          status: true,
          user: {
            select: {
              sessions: {
                where: { phase: Phase.PHASE2A },
                select: { status: true, result: { select: { isPaid: true } } },
              },
            },
          },
        },
      }),
    (rows) => {
      for (const lead of rows) {
        const { country, state } = parseLocation(lead.location);
        const phase2aSessions = lead.user?.sessions ?? [];
        leads
          .addRow([
            lead.leadEmail ?? '',
            lead.businessName,
            lead.industry,
            country ?? '',
            state ?? '',
            SIZE_LABELS[lead.businessSize ?? 'UNKNOWN'],
            dateCell(lead.startedAt),
            lead.status !== SessionStatus.IN_PROGRESS ? 'Yes' : 'No',
            lead.user ? 'Yes' : 'No',
            phase2aSessions.length > 0 ? 'Yes' : 'No',
            phase2aSessions.some((s) => s.result?.isPaid) ? 'Yes' : 'No',
          ])
          .commit();
      }
    }
  );
  leads.commit();

  await workbook.commit();
}
