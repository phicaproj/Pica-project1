import {
	API_BASE_URL,
	authedFetch,
	clearSession,
	getAccessToken,
	type ApiResult,
	type BusinessSize,
} from './config'

export type ReportPhase = 'PHASE1' | 'PHASE2A' | 'PHASE2B'
export type ReportColorBand = 'RED' | 'AMBER' | 'GREEN'
export type ReportSessionStatus =
	| 'IN_PROGRESS'
	| 'COMPLETED'
	| 'PAID'
	| 'REPORT_GENERATED'

// Shared filter set — every /admin/reports/* endpoint (and the Excel export)
// accepts the same optional params so the page and the file always agree.
export type ReportFilters = {
	phase?: ReportPhase
	dateFrom?: string // YYYY-MM-DD
	dateTo?: string // YYYY-MM-DD
	country?: string
	state?: string
	status?: ReportSessionStatus
	colorBand?: ReportColorBand
	businessSize?: BusinessSize
	industry?: string
}

function reportFiltersToQuery(filters: ReportFilters): string {
	const qs = new URLSearchParams()
	for (const [key, value] of Object.entries(filters)) {
		if (value !== undefined && value !== null && value !== '') {
			qs.set(key, String(value))
		}
	}
	return qs.toString()
}

export type ReportKpisResponse = {
	message: string
	kpis: {
		totalAssessments: number
		assessmentsByPhase: { phase: ReportPhase; count: number }[]
		avgTotalScore: number | null
		highRiskPct: number | null
		revenue: {
			total: number
			phase2a: number
			phase2b: number
			currency: string
		}
	}
}

export type ReportFunnelStep = {
	key: string
	label: string
	count: number
	pctOfPrevious: number | null
}

export type ReportFunnelResponse = {
	message: string
	funnel: ReportFunnelStep[]
}

export type ReportProblemArea = {
	questionId: string
	questionCode: string
	questionText: string
	optionLabel: string
	observation: string
	pillarName: string
	riskType: 'RISK' | 'KNOCKOUT'
	affectedBusinesses: number
}

export type ReportProblemAreasResponse = {
	message: string
	problemAreas: ReportProblemArea[]
}

export type ReportBreakdownsResponse = {
	message: string
	breakdowns: {
		byPillar: {
			pillarId: string
			pillarName: string
			displayOrder: number
			phase2bPurchases: number
			avgWeightedScore: number | null
		}[]
		byPhase: { phase: ReportPhase; count: number }[]
		byRegion: {
			country: string
			count: number
			states: { state: string; count: number }[]
		}[]
		byIndustry: { industry: string; count: number; avgScore: number | null }[]
		byBusinessSize: { businessSize: string; count: number }[]
		byColorBand: { colorBand: ReportColorBand; count: number }[]
	}
}

export type ReportSessionRow = {
	id: string
	businessName: string
	email: string | null
	phase: ReportPhase
	completedAt: string | null
	pillarBands: {
		pillarName: string
		colorBand: ReportColorBand | null
		weightedScore: number | null
	}[]
	totalScore: number | null
	overallBand: ReportColorBand | null
	hasAnyKnockout: boolean
	status: ReportSessionStatus
	isPaid: boolean
	reportPdfUrl: string | null
}

export type ReportSessionsResponse = {
	message: string
	page: number
	pageSize: number
	total: number
	totalPages: number
	sessions: ReportSessionRow[]
}

export const getReportKpis = async (filters: ReportFilters = {}) => {
	const query = reportFiltersToQuery(filters)
	return authedFetch<ReportKpisResponse>(
		`/admin/reports/kpis${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export const getReportFunnel = async (filters: ReportFilters = {}) => {
	const query = reportFiltersToQuery(filters)
	return authedFetch<ReportFunnelResponse>(
		`/admin/reports/funnel${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export const getReportProblemAreas = async (filters: ReportFilters = {}) => {
	const query = reportFiltersToQuery(filters)
	return authedFetch<ReportProblemAreasResponse>(
		`/admin/reports/problem-areas${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export const getReportBreakdowns = async (filters: ReportFilters = {}) => {
	const query = reportFiltersToQuery(filters)
	return authedFetch<ReportBreakdownsResponse>(
		`/admin/reports/breakdowns${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export const getReportSessions = async (
	params: ReportFilters & { page?: number; pageSize?: number } = {},
) => {
	const { page, pageSize, ...filters } = params
	const qs = new URLSearchParams(reportFiltersToQuery(filters))
	if (page) qs.set('page', String(page))
	if (pageSize) qs.set('pageSize', String(pageSize))
	const query = qs.toString()
	return authedFetch<ReportSessionsResponse>(
		`/admin/reports/sessions${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

/**
 * Downloads the multi-sheet Excel export as a Blob. The response is a file
 * stream (not JSON), so this bypasses authedFetch. Returns the blob plus the
 * filename from Content-Disposition (fallback: pica-report-<today>.xlsx).
 */
export const downloadReportExcel = async (
	filters: ReportFilters = {},
): Promise<ApiResult<{ blob: Blob; filename: string }>> => {
	const token = getAccessToken()
	if (!token) {
		return { data: null, error: { message: 'Not authenticated' } }
	}
	try {
		const query = reportFiltersToQuery(filters)
		const res = await fetch(
			`${API_BASE_URL}/admin/reports/export${query ? `?${query}` : ''}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${token}` },
			},
		)
		if (!res.ok) {
			const json = (await res.json().catch(() => ({}))) as Record<
				string,
				unknown
			>
			const message =
				(typeof json.message === 'string' && json.message) ||
				`Export failed with status ${res.status}`
			if (res.status === 401) clearSession()
			return { data: null, error: { message } }
		}
		const blob = await res.blob()
		const disposition = res.headers.get('Content-Disposition') || ''
		const match = disposition.match(/filename="?([^";]+)"?/)
		const filename =
			match?.[1] ||
			`pica-report-${new Date().toISOString().slice(0, 10)}.xlsx`
		return { data: { blob, filename }, error: null }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Network error'
		return { data: null, error: { message } }
	}
}
