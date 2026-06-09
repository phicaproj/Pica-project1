import { z } from 'zod'
import { registry, errorResponse } from './registry'

// ----- Shared filter query ----------------------------------------------------
// Every /api/admin/reports/* endpoint accepts the same optional filter set.
// The export endpoint reuses it so the file always matches the page.

const reportFilterParams = {
	phase: z.enum(['PHASE1', 'PHASE2A', 'PHASE2B']).optional().openapi({ param: { name: 'phase', in: 'query' } }),
	dateFrom: z.string().optional().openapi({ param: { name: 'dateFrom', in: 'query' }, example: '2026-01-01', description: 'Inclusive start date (YYYY-MM-DD), applied to session start date.' }),
	dateTo: z.string().optional().openapi({ param: { name: 'dateTo', in: 'query' }, example: '2026-06-30', description: 'Inclusive end date (YYYY-MM-DD).' }),
	country: z.string().optional().openapi({ param: { name: 'country', in: 'query' }, description: 'Matched against the last comma-part of the session location.' }),
	state: z.string().optional().openapi({ param: { name: 'state', in: 'query' } }),
	status: z.enum(['IN_PROGRESS', 'COMPLETED', 'PAID', 'REPORT_GENERATED']).optional().openapi({ param: { name: 'status', in: 'query' } }),
	colorBand: z.enum(['RED', 'AMBER', 'GREEN']).optional().openapi({ param: { name: 'colorBand', in: 'query' }, description: 'Overall result band of the session.' }),
	businessSize: z.enum(['SMALL', 'MEDIUM']).optional().openapi({ param: { name: 'businessSize', in: 'query' } }),
	industry: z.string().optional().openapi({ param: { name: 'industry', in: 'query' } }),
}

const reportFiltersQuerySchema = z.object(reportFilterParams)

const adminErrors = {
	401: errorResponse('Missing or invalid token'),
	403: errorResponse('Forbidden: User is not an admin'),
}

// ----- Schemas ------------------------------------------------------------------

const ReportKpisSchema = registry.register(
	'ReportKpis',
	z
		.object({
			totalAssessments: z.number(),
			assessmentsByPhase: z.array(z.object({ phase: z.string(), count: z.number() })),
			avgTotalScore: z.number().nullable(),
			highRiskPct: z.number().nullable().openapi({
				description: '% of completed assessments where any knockout answer was selected.',
			}),
			revenue: z.object({
				total: z.number(),
				phase2a: z.number(),
				phase2b: z.number(),
				currency: z.string(),
			}),
		})
		.openapi('ReportKpis'),
)

const FunnelStepSchema = registry.register(
	'ReportFunnelStep',
	z
		.object({
			key: z.string(),
			label: z.string(),
			count: z.number(),
			pctOfPrevious: z.number().nullable(),
		})
		.openapi('ReportFunnelStep'),
)

const ProblemAreaSchema = registry.register(
	'ReportProblemArea',
	z
		.object({
			questionId: z.string().uuid(),
			questionCode: z.string(),
			questionText: z.string(),
			optionLabel: z.string(),
			observation: z.string(),
			pillarName: z.string(),
			riskType: z.enum(['RISK', 'KNOCKOUT']),
			affectedBusinesses: z.number(),
		})
		.openapi('ReportProblemArea'),
)

const ReportBreakdownsSchema = registry.register(
	'ReportBreakdowns',
	z
		.object({
			byPillar: z.array(
				z.object({
					pillarId: z.string().uuid(),
					pillarName: z.string(),
					displayOrder: z.number(),
					phase2bPurchases: z.number(),
					avgWeightedScore: z.number().nullable(),
				}),
			),
			byPhase: z.array(z.object({ phase: z.string(), count: z.number() })),
			byRegion: z.array(
				z.object({
					country: z.string(),
					count: z.number(),
					states: z.array(z.object({ state: z.string(), count: z.number() })),
				}),
			),
			byIndustry: z.array(
				z.object({ industry: z.string(), count: z.number(), avgScore: z.number().nullable() }),
			),
			byBusinessSize: z.array(z.object({ businessSize: z.string(), count: z.number() })),
			byColorBand: z.array(z.object({ colorBand: z.string(), count: z.number() })),
		})
		.openapi('ReportBreakdowns'),
)

const ReportSessionRowSchema = registry.register(
	'ReportSessionRow',
	z
		.object({
			id: z.string().uuid(),
			businessName: z.string(),
			email: z.string().nullable(),
			phase: z.string(),
			completedAt: z.string().datetime().nullable(),
			pillarBands: z.array(
				z.object({
					pillarName: z.string(),
					colorBand: z.enum(['RED', 'AMBER', 'GREEN']).nullable(),
					weightedScore: z.number().nullable(),
				}),
			),
			totalScore: z.number().nullable(),
			overallBand: z.enum(['RED', 'AMBER', 'GREEN']).nullable(),
			hasAnyKnockout: z.boolean(),
			status: z.string(),
			isPaid: z.boolean(),
			reportPdfUrl: z.string().nullable(),
		})
		.openapi('ReportSessionRow'),
)

// ----- GET /api/admin/reports/kpis ----------------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/admin/reports/kpis',
	tags: ['Admin'],
	summary: 'Reports & Analytics KPI banner numbers',
	description:
		'Admin-only. Total assessments (split by phase), average total score, high-risk percentage, and SUCCESS-payment revenue split by plan. Respects the shared report filters.',
	security: [{ bearerAuth: [] }],
	request: { query: reportFiltersQuerySchema },
	responses: {
		200: {
			description: 'KPIs retrieved successfully',
			content: {
				'application/json': {
					schema: z.object({ message: z.string(), kpis: ReportKpisSchema }),
				},
			},
		},
		...adminErrors,
	},
})

// ----- GET /api/admin/reports/funnel ---------------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/admin/reports/funnel',
	tags: ['Admin'],
	summary: 'Drop-off funnel from free snapshot to paid report',
	description:
		'Admin-only. Five steps: Phase 1 completed → registered → Phase 2A started → Phase 2A completed → paid. Counts plus step-to-step percentages. The `phase`/`status` filters are ignored (the funnel spans phases); all other filters apply.',
	security: [{ bearerAuth: [] }],
	request: { query: reportFiltersQuerySchema },
	responses: {
		200: {
			description: 'Funnel retrieved successfully',
			content: {
				'application/json': {
					schema: z.object({ message: z.string(), funnel: z.array(FunnelStepSchema) }),
				},
			},
		},
		...adminErrors,
	},
})

// ----- GET /api/admin/reports/problem-areas --------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/admin/reports/problem-areas',
	tags: ['Admin'],
	summary: 'Most common risk / knockout findings',
	description:
		'Admin-only. Top ~10 RISK/KNOCKOUT answers across all filtered sessions, grouped by selected option, with the option observation text, pillar name, and affected-business count.',
	security: [{ bearerAuth: [] }],
	request: { query: reportFiltersQuerySchema },
	responses: {
		200: {
			description: 'Problem areas retrieved successfully',
			content: {
				'application/json': {
					schema: z.object({ message: z.string(), problemAreas: z.array(ProblemAreaSchema) }),
				},
			},
		},
		...adminErrors,
	},
})

// ----- GET /api/admin/reports/breakdowns -----------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/admin/reports/breakdowns',
	tags: ['Admin'],
	summary: 'Aggregation tables: pillars, phases, regions, industries, sizes, bands',
	description:
		'Admin-only. The breakdown tables backing the tabbed card on the Reports & Analytics page and the Breakdowns export sheet.',
	security: [{ bearerAuth: [] }],
	request: { query: reportFiltersQuerySchema },
	responses: {
		200: {
			description: 'Breakdowns retrieved successfully',
			content: {
				'application/json': {
					schema: z.object({ message: z.string(), breakdowns: ReportBreakdownsSchema }),
				},
			},
		},
		...adminErrors,
	},
})

// ----- GET /api/admin/reports/sessions -------------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/admin/reports/sessions',
	tags: ['Admin'],
	summary: 'Paginated assessment session list',
	description:
		'Admin-only. One row per session with the 7 pillar bands in display order (nulls for unscored pillars, e.g. Phase 2B deep dives), total score, overall band, knockout flag, paid status and PDF URL.',
	security: [{ bearerAuth: [] }],
	request: {
		query: reportFiltersQuerySchema.extend({
			page: z.coerce.number().int().min(1).default(1).openapi({ param: { name: 'page', in: 'query' } }),
			pageSize: z.coerce.number().int().min(1).max(100).default(20).openapi({ param: { name: 'pageSize', in: 'query' } }),
		}),
	},
	responses: {
		200: {
			description: 'Sessions retrieved successfully',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						page: z.number(),
						pageSize: z.number(),
						total: z.number(),
						totalPages: z.number(),
						sessions: z.array(ReportSessionRowSchema),
					}),
				},
			},
		},
		...adminErrors,
	},
})

// ----- GET /api/admin/reports/export ---------------------------------------------

registry.registerPath({
	method: 'get',
	path: '/api/admin/reports/export',
	tags: ['Admin'],
	summary: 'Download the multi-sheet Excel export',
	description:
		'Admin-only. Streams a single .xlsx workbook (Overview, Assessments, Answers, Breakdowns, Payments, Leads) respecting the same filters as the JSON endpoints. Responds with a file attachment named pica-report-YYYY-MM-DD.xlsx.',
	security: [{ bearerAuth: [] }],
	request: { query: reportFiltersQuerySchema },
	responses: {
		200: {
			description: 'Excel workbook stream',
			content: {
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
					schema: z.string().openapi({ format: 'binary' }),
				},
			},
		},
		...adminErrors,
	},
})
