import { authedFetch, type BusinessSize } from './config'
import type { PricingRow } from './payment'

// PricingRow lives in ./payment and is surfaced through the lib/authClient
// barrel. Imported here only to define the admin-pricing response shapes.

// ── Pricing (pay-per-use plans) ────────────────────────────────────────────

export type AdminPricingResponse = {
	message: string
	prices: PricingRow[]
}

export type AdminPricingDetailResponse = {
	message: string
	price: PricingRow
}

export type PricingPlan = PricingRow['plan']

export type AdminPricingPayload = {
	plan: PricingPlan
	price: number
	pillarId?: string | null
	features?: string[]
}

export type AdminPricingUpdatePayload = {
	price?: number
	pillarId?: string | null
	// Feature bullets — whole-array replacement, not a partial merge. Send
	// `[]` to clear all bullets.
	features?: string[]
}

export type PillarMeta = {
	id: string
	code: string
	name: string
	description: string | null
	displayOrder: number
}

export type AllPillarsResponse = {
	message: string
	pillars: PillarMeta[]
}

export const getAdminPricing = async (params: {
	plan?: PricingPlan
	pillarId?: string
} = {}) => {
	const qs = new URLSearchParams()
	if (params.plan) qs.set('plan', params.plan)
	if (params.pillarId) qs.set('pillarId', params.pillarId)
	const query = qs.toString()

	return authedFetch<AdminPricingResponse>(
		`/admin/pricing${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export const createAdminPricing = async (payload: AdminPricingPayload) => {
	return authedFetch<AdminPricingDetailResponse>('/admin/pricing', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export const updateAdminPricing = async (
	id: string,
	payload: AdminPricingUpdatePayload,
) => {
	return authedFetch<AdminPricingDetailResponse>(`/admin/pricing/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(payload),
	})
}

export const deleteAdminPricing = async (id: string) => {
	return authedFetch<{ message: string }>(`/admin/pricing/${id}`, {
		method: 'DELETE',
	})
}

export const getAdminPillars = async () => {
	return authedFetch<AllPillarsResponse>('/admin/pillars', {
		method: 'GET',
	})
}

// ── Admin scoring page — pillar weights + score interpretation ─────────────

// /admin/pillars actually returns this superset of PillarMeta; the detailed
// shape backs the scoring page (weights, counts), while older consumers keep
// using the narrower PillarMeta view above.
export type AdminPillarDetailed = PillarMeta & {
	weight: number
	isActive: boolean
	activeQuestionCount: number
	totalQuestionCount: number
	// Active-question counts split by phase and business size — what a real
	// session actually delivers per pillar (activeQuestionCount sums all of them).
	counts: {
		phase2a: { SMALL: number; MEDIUM: number }
		phase2b: { SMALL: number; MEDIUM: number }
	}
}

export type AdminPillarsDetailedResponse = {
	message: string
	pillars: AdminPillarDetailed[]
}

export type ScoringSettings = {
	amberMin: number
	greenMin: number
	redLabel: string
	redDescription: string
	amberLabel: string
	amberDescription: string
	greenLabel: string
	greenDescription: string
	phase2aQuestionLimit: number
	phase2bQuestionLimit: number
	updatedAt: string
}

export type ScoringSettingsResponse = {
	message: string
	settings: ScoringSettings
}

export type UpdateScoringSettingsPayload = Partial<Omit<ScoringSettings, 'updatedAt'>>

export const getAdminPillarsDetailed = async () => {
	return authedFetch<AdminPillarsDetailedResponse>('/admin/pillars', {
		method: 'GET',
	})
}

export const saveAdminPillarWeights = async (
	weights: Array<{ pillarId: string; weight: number }>,
) => {
	return authedFetch<AdminPillarsDetailedResponse>('/admin/pillars/weights', {
		method: 'PATCH',
		body: JSON.stringify({ weights }),
	})
}

export const getScoringSettings = async () => {
	return authedFetch<ScoringSettingsResponse>('/admin/scoring-settings', {
		method: 'GET',
	})
}

export const updateScoringSettings = async (
	payload: UpdateScoringSettingsPayload,
) => {
	return authedFetch<ScoringSettingsResponse>('/admin/scoring-settings', {
		method: 'PATCH',
		body: JSON.stringify(payload),
	})
}

// ── Question bank ──────────────────────────────────────────────────────────

export type AdminQuestionPhase = 'PHASE1' | 'PHASE2A' | 'PHASE2B'
export type AdminRiskType = 'NORMAL' | 'RISK' | 'KNOCKOUT'

export type AdminQuestionOption = {
	id: string
	optionLabel: string
	optionText: string
	score: number
	riskType: AdminRiskType
	observation: string
	recommendation: string
	displayOrder: number
}

export type AdminQuestion = {
	id: string
	pillarId: string
	pillarCode: string
	questionCode: string
	questionText: string
	phase: AdminQuestionPhase
	businessSize: BusinessSize
	isPhase1Featured: boolean
	hasKnockoutOption: boolean
	isActive: boolean
	displayOrder: number
	options: AdminQuestionOption[]
}

export type AdminQuestionListResponse = {
	message: string
	total: number
	questions: AdminQuestion[]
}

export type AdminQuestionDetailResponse = {
	message: string
	question: AdminQuestion
}

export type AdminQuestionOptionPayload = {
	optionText: string
	score: number
	observation: string
	recommendation: string
}

export type CreateAdminQuestionPayload = {
	pillarId: string
	phase: AdminQuestionPhase
	businessSize: BusinessSize
	isPhase1Featured: boolean
	questionText: string
	options: AdminQuestionOptionPayload[]
}

export type UpdateAdminQuestionPayload = {
	questionText?: string
	phase?: AdminQuestionPhase
	businessSize?: BusinessSize
	isPhase1Featured?: boolean
	isActive?: boolean
}

export type UpdateAdminQuestionOptionPayload = Partial<AdminQuestionOptionPayload>

export const getAdminQuestions = async (params: {
	pillarId?: string
	phase?: AdminQuestionPhase
	businessSize?: BusinessSize
	search?: string
	includeInactive?: boolean
} = {}) => {
	const qs = new URLSearchParams()
	if (params.pillarId) qs.set('pillarId', params.pillarId)
	if (params.phase) qs.set('phase', params.phase)
	if (params.businessSize) qs.set('businessSize', params.businessSize)
	if (params.search) qs.set('search', params.search)
	if (params.includeInactive !== undefined) {
		qs.set('includeInactive', String(params.includeInactive))
	}
	const query = qs.toString()

	return authedFetch<AdminQuestionListResponse>(
		`/admin/questions${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export const createAdminQuestion = async (
	payload: CreateAdminQuestionPayload,
) => {
	return authedFetch<AdminQuestionDetailResponse>('/admin/questions', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export const updateAdminQuestion = async (
	id: string,
	payload: UpdateAdminQuestionPayload,
) => {
	return authedFetch<AdminQuestionDetailResponse>(`/admin/questions/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(payload),
	})
}

export const deleteAdminQuestion = async (id: string) => {
	return authedFetch<AdminQuestionDetailResponse>(`/admin/questions/${id}`, {
		method: 'DELETE',
	})
}

export const addAdminQuestionOption = async (
	questionId: string,
	payload: AdminQuestionOptionPayload,
) => {
	return authedFetch<AdminQuestionDetailResponse>(
		`/admin/questions/${questionId}/options`,
		{
			method: 'POST',
			body: JSON.stringify(payload),
		},
	)
}

export const updateAdminQuestionOption = async (
	optionId: string,
	payload: UpdateAdminQuestionOptionPayload,
) => {
	return authedFetch<AdminQuestionDetailResponse>(`/admin/options/${optionId}`, {
		method: 'PATCH',
		body: JSON.stringify(payload),
	})
}

export const deleteAdminQuestionOption = async (optionId: string) => {
	return authedFetch<AdminQuestionDetailResponse>(`/admin/options/${optionId}`, {
		method: 'DELETE',
	})
}

// ── Coupons ────────────────────────────────────────────────────────────────

export type AdminCoupon = {
	id: string
	code: string
	description: string | null
	amountOff: number
	percentOff: number
	isActive: boolean
	status: string
	maxUses: number
	usedCount: number
	// SUBSCRIPTION joined the set when monthly plans got coupon support. null
	// means the coupon is global (works on any paid plan).
	plan: 'PHASE2A' | 'PHASE2B_PILLAR' | 'SUBSCRIPTION' | null
	pillarId: string | null
	pillarCode: string | null
	pillarName: string | null
	// Tier-narrowing for SUBSCRIPTION coupons. Both null = applies to any
	// subscription tier. Set = only valid for that specific plan.
	subscriptionPlanId: string | null
	subscriptionPlanName: string | null
	userId: string | null
	userEmail: string | null
	createdAt: string
}

export type AdminCouponListResponse = {
	message: string
	total: number
	coupons: AdminCoupon[]
}

export type AdminCouponDetailResponse = {
	message: string
	coupon: AdminCoupon
}

export type CreateAdminCouponPayload = {
	code?: string
	description?: string
	amountOff?: number
	percentOff?: number
	isActive: boolean
	userId?: string
	plan?: 'PHASE2A' | 'PHASE2B_PILLAR' | 'SUBSCRIPTION' | null
	pillarId?: string | null
	// Optional tier-narrowing for SUBSCRIPTION coupons. null/omitted = any
	// tier. The backend rejects this field on non-SUBSCRIPTION plans.
	subscriptionPlanId?: string | null
	// How many distinct users may redeem the code. Backend defaults to 1;
	// forced to 1 when userId is set.
	maxUses?: number
}

export type UpdateAdminCouponPayload = {
	description?: string
	isActive?: boolean
	maxUses?: number
}

export const getAdminCoupons = async (params: {
	userId?: string
	isActive?: boolean
	plan?: 'PHASE2A' | 'PHASE2B_PILLAR' | 'SUBSCRIPTION'
	pillarId?: string
} = {}) => {
	const qs = new URLSearchParams()
	if (params.userId) qs.set('userId', params.userId)
	if (params.isActive !== undefined) qs.set('isActive', String(params.isActive))
	if (params.plan) qs.set('plan', params.plan)
	if (params.pillarId) qs.set('pillarId', params.pillarId)
	const query = qs.toString()

	return authedFetch<AdminCouponListResponse>(
		`/admin/coupons${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export const createAdminCoupon = async (payload: CreateAdminCouponPayload) => {
	return authedFetch<AdminCouponDetailResponse>('/admin/coupons', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export const updateAdminCoupon = async (
	id: string,
	payload: UpdateAdminCouponPayload,
) => {
	return authedFetch<AdminCouponDetailResponse>(`/admin/coupons/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(payload),
	})
}

export const deleteAdminCoupon = async (id: string) => {
	return authedFetch<{ message: string }>(`/admin/coupons/${id}`, {
		method: 'DELETE',
	})
}

// ── Admin: users list + per-user detail + status ───────────────────────────

export type AdminUserStatus = 'ACTIVE' | 'DISABLED'

export type AdminUserRow = {
	id: string
	firstName: string | null
	lastName: string | null
	email: string
	phone: string | null
	avatarUrl: string | null
	businessName: string | null
	businessSize: BusinessSize | null
	industry: string | null
	subscriptionPlan: 'PHASE2A' | 'PHASE2B_PILLAR' | null
	isActive: boolean
	lastSeenAt: string | null
	// Account standing — DISABLED means suspended (login + tokens blocked).
	status: AdminUserStatus
	adminRoleId?: string | null
	adminRole?: {
		id: string
		name: string
		permissions: string[]
	} | null
	// Per-person admin access (source of truth for new admins).
	department?: string | null
	permissions?: string[]
	createdAt: string
}

export type ListUsersResponse = {
	message: string
	page: number
	pageSize: number
	total: number
	users: AdminUserRow[]
}

export const getAllUsers = async (params: {
	page?: number
	pageSize?: number
	search?: string
	businessSize?: BusinessSize
	plan?: 'PHASE2A' | 'PHASE2B_PILLAR' | 'FREE'
	active?: boolean
	role?: 'USER' | 'ADMIN'
} = {}) => {
	const qs = new URLSearchParams()
	if (params.page) qs.set('page', String(params.page))
	if (params.pageSize) qs.set('pageSize', String(params.pageSize))
	if (params.search) qs.set('search', params.search)
	if (params.businessSize) qs.set('businessSize', params.businessSize)
	if (params.plan) qs.set('plan', params.plan)
	if (params.active !== undefined) qs.set('active', String(params.active))
	if (params.role) qs.set('role', params.role)

	const query = qs.toString()
	return authedFetch<ListUsersResponse>(
		`/admin/users${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export type AdminUserDetails = AdminUserRow & {
	recentSessions: {
		id: string
		status: 'IN_PROGRESS' | 'COMPLETED' | 'PAID' | 'REPORT_GENERATED'
		updatedAt: string
		phase: 'PHASE1' | 'PHASE2A' | 'PHASE2B'
		pillarId: string | null
		pillarName: string | null
		reportPdfUrl: string | null
	}[]
	recentPayments: {
		id: string
		amount: number
		plan: 'PHASE2A' | 'PHASE2B_PILLAR'
		status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'ABANDONED' | 'REVERSED'
		currency: string
		reference: string
		paidAt: string | null
		updatedAt: string
	}[]
	totalSpent: number
	totalSessions: number
	completedSessions: number
	totalSuccessfulPayments: number
}

export type ShowUserResponse = {
	message: string
	user: AdminUserDetails
}

export const getAdminUserDetails = async (id: string) => {
	return authedFetch<ShowUserResponse>(`/admin/users/${id}`, {
		method: 'GET',
	})
}

export const updateAdminUserStatus = async (
	id: string,
	status: AdminUserStatus,
) => {
	return authedFetch<{
		message: string
		user: { id: string; status: AdminUserStatus }
	}>(`/admin/users/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ status }),
	})
}

// ─── Admin: per-user paginated histories + session detail ──────────────────

export type AdminUserSessionRow = AdminUserDetails['recentSessions'][number] & {
	startedAt: string
	completedAt: string | null
	totalScore: number | null
	colorBand: 'RED' | 'AMBER' | 'GREEN' | null
}

export type AdminUserSessionsResponse = {
	message: string
	page: number
	pageSize: number
	total: number
	totalPages: number
	sessions: AdminUserSessionRow[]
}

export type AdminUserPaymentsResponse = {
	message: string
	page: number
	pageSize: number
	total: number
	totalPages: number
	payments: AdminUserDetails['recentPayments']
}

export type AdminSessionPillarScore = {
	pillarId: string
	pillarCode: string
	pillarName: string
	rawScore: number
	maxPossibleScore: number
	weightedScore: number
	hasKnockout: boolean
	colorBand: 'RED' | 'AMBER' | 'GREEN'
	insightRuleApplied: 'KNOCKOUT' | 'BOTH_RISK' | 'ONE_RISK' | 'BOTH_NORMAL'
}

export type AdminSessionResponseRow = {
	questionId: string
	pillarCode: string
	pillarName: string
	questionCode: string
	questionText: string
	selectedLabel: string
	selectedText: string
	scoreAtTime: number
	maxScore: number
	riskTypeAtTime: 'NORMAL' | 'RISK' | 'KNOCKOUT'
	answeredAt: string
}

export type AdminSessionDetail = {
	id: string
	phase: 'PHASE1' | 'PHASE2A' | 'PHASE2B'
	status: 'IN_PROGRESS' | 'COMPLETED' | 'PAID' | 'REPORT_GENERATED'
	businessSize: BusinessSize | null
	pillarId: string | null
	pillarName: string | null
	startedAt: string
	completedAt: string | null
	user: {
		id: string | null
		name: string | null
		email: string | null
	}
	result: {
		totalScore: number
		colorBand: 'RED' | 'AMBER' | 'GREEN'
		hasAnyKnockout: boolean
		isPaid: boolean
		reportPdfUrl: string | null
	} | null
	pillarScores: AdminSessionPillarScore[]
	responses: AdminSessionResponseRow[]
}

export type AdminSessionDetailResponse = {
	message: string
	session: AdminSessionDetail
}

export const getAdminUserSessions = async (
	userId: string,
	params: { page?: number; pageSize?: number } = {},
) => {
	const qs = new URLSearchParams()
	if (params.page) qs.set('page', String(params.page))
	if (params.pageSize) qs.set('pageSize', String(params.pageSize))
	const query = qs.toString()

	return authedFetch<AdminUserSessionsResponse>(
		`/admin/users/${userId}/sessions${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export const getAdminUserPayments = async (
	userId: string,
	params: { page?: number; pageSize?: number } = {},
) => {
	const qs = new URLSearchParams()
	if (params.page) qs.set('page', String(params.page))
	if (params.pageSize) qs.set('pageSize', String(params.pageSize))
	const query = qs.toString()

	return authedFetch<AdminUserPaymentsResponse>(
		`/admin/users/${userId}/payments${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export const getAdminSessionDetails = async (sessionId: string) => {
	return authedFetch<AdminSessionDetailResponse>(`/admin/sessions/${sessionId}`, {
		method: 'GET',
	})
}

// ── Admin roles ────────────────────────────────────────────────────────────

export type AdminRoleRow = {
	id: string
	name: string
	description: string | null
	permissions: string[]
	_count: {
		users: number
	}
	createdAt: string
	updatedAt: string
}

export const listAdminRoles = async () => {
	return authedFetch<{ message: string; roles: AdminRoleRow[] }>(
		'/admin/roles',
		{ method: 'GET' },
	)
}

export const createAdminRole = async (payload: {
	name: string
	description?: string
	permissions: string[]
}) => {
	return authedFetch<{ message: string; role: AdminRoleRow }>(
		'/admin/roles',
		{ method: 'POST', body: JSON.stringify(payload) },
	)
}

export const updateAdminRole = async (
	id: string,
	payload: {
		name?: string
		description?: string
		permissions?: string[]
	},
) => {
	return authedFetch<{ message: string; role: AdminRoleRow }>(
		`/admin/roles/${id}`,
		{ method: 'PATCH', body: JSON.stringify(payload) },
	)
}

export const deleteAdminRole = async (id: string) => {
	return authedFetch<{ message: string }>(
		`/admin/roles/${id}`,
		{ method: 'DELETE' },
	)
}

export const assignAdminRole = async (
	userId: string,
	adminRoleId: string | null,
) => {
	return authedFetch<{ message: string; user: any }>(
		`/admin/users/${userId}/role`,
		{ method: 'PATCH', body: JSON.stringify({ adminRoleId }) },
	)
}

// ── Admin onboarding (invite staff) ────────────────────────────────────────

export type InvitedAdmin = {
	id: string
	email: string
	department: string | null
	permissions: string[]
}

export const inviteAdmin = async (payload: {
	email: string
	department: string
	permissions: string[]
}) => {
	return authedFetch<{ message: string; admin: InvitedAdmin }>(
		'/admin/invite',
		{ method: 'POST', body: JSON.stringify(payload) },
	)
}

// Edit an existing admin's department + per-person permissions.
export const updateAdminAccess = async (
	userId: string,
	payload: { department?: string; permissions?: string[] },
) => {
	return authedFetch<{ message: string; user: any }>(
		`/admin/users/${userId}/access`,
		{ method: 'PATCH', body: JSON.stringify(payload) },
	)
}

// ── Admin self-service profile (personal info) ─────────────────────────────

export type AdminProfile = {
	id: string
	email: string
	firstName: string | null
	lastName: string | null
	phone: string | null
	businessName: string | null
	avatarUrl: string | null
}

export const getMyAdminProfile = async () => {
	return authedFetch<{ message: string; profile: AdminProfile }>(
		'/admin/me',
		{ method: 'GET' },
	)
}

export const updateMyAdminProfile = async (payload: {
	firstName?: string
	lastName?: string
	phone?: string
	businessName?: string
}) => {
	return authedFetch<{ message: string; profile: AdminProfile }>(
		'/admin/me',
		{ method: 'PATCH', body: JSON.stringify(payload) },
	)
}

// ──────────────────────────────────────────────────────────────────────────
// App settings — singleton holding the USD→NGN FX rate used to convert USD
// catalogue prices into NGN at charge time / display time for Nigerian users.
// Only `settings:read`/`settings:write` admins can touch this.
// ──────────────────────────────────────────────────────────────────────────

export type AppSettingsPayload = {
	usdToNgn: number
	// Section F — storefront section toggles. BE enforces "at least one
	// section must stay live" on PATCH; the FE additionally disables the
	// toggle that would zero everything so the user can't even try.
	payPerUseActive: boolean
	subscriptionActive: boolean
	updatedBy: string | null
	updatedAt: string
}

export type AppSettingsResponse = {
	message: string
	settings: AppSettingsPayload
}

export const getAdminAppSettings = async () => {
	return authedFetch<AppSettingsResponse>('/admin/app-settings', { method: 'GET' })
}

export const updateAdminAppSettings = async (input: {
	usdToNgn?: number
	payPerUseActive?: boolean
	subscriptionActive?: boolean
}) => {
	return authedFetch<AppSettingsResponse>('/admin/app-settings', {
		method: 'PATCH',
		body: JSON.stringify(input),
	})
}
