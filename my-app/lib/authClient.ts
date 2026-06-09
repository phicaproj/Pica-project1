const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	'https://pica-project1.onrender.com/api'

const ACCESS_TOKEN_KEY = 'pica.accessToken'
const REFRESH_TOKEN_KEY = 'pica.refreshToken'
const USER_KEY = 'pica.user'
const RESET_OTP_TOKEN_KEY = 'pica.resetOtpToken'
const ADMIN_LOGIN_OTP_TOKEN_KEY = 'pica.adminLoginOtpToken'
const RESET_PASSWORD_TOKEN_KEY = 'pica.resetPasswordToken'
const LAST_SESSION_ID_KEY = 'pica.lastSessionId'

interface SignUpPayload {
	businessName: string
	email: string
	phone: string
	password: string
}

interface LoginPayload {
	email: string
	password: string
}

export interface AuthUser {
	id: string
	email: string
	firstName: string | null
	lastName: string | null
	businessName: string | null
	phone: string | null
	avatarUrl: string | null
	isVerified: boolean
	role: string
}

export type BusinessSize = 'SMALL' | 'MEDIUM'

export interface MeUser extends AuthUser {
	businessSize: BusinessSize | null
	hasAnyPaidPhase2AResult: boolean
	hasPaidPhase2A: boolean
	staffSize: string | null
	industry: string | null
	country: string | null
	state: string | null
	operatingYears: string | null
	annualRevenue: string | null
}

interface ApiError {
	message: string
}

interface ApiResult<T> {
	data: T | null
	error: ApiError | null
}

async function apiFetch<T>(path: string, body: unknown): Promise<ApiResult<T>> {
	try {
		const res = await fetch(`${API_BASE_URL}${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})

		const json = (await res.json().catch(() => ({}))) as Record<
			string,
			unknown
		>

		if (!res.ok) {
			const message =
				(typeof json.message === 'string' && json.message) ||
				`Request failed with status ${res.status}`
			return { data: null, error: { message } }
		}

		return { data: json as T, error: null }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Network error'
		return { data: null, error: { message } }
	}
}

function setSession(accessToken: string, refreshToken: string, user: AuthUser) {
	if (typeof window === 'undefined') return
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
	localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
	localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getAccessToken(): string | null {
	if (typeof window === 'undefined') return null
	return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
	if (typeof window === 'undefined') return null
	const raw = localStorage.getItem(USER_KEY)
	if (!raw) return null
	try {
		return JSON.parse(raw) as AuthUser
	} catch {
		return null
	}
}

export function clearSession() {
	if (typeof window === 'undefined') return
	localStorage.removeItem(ACCESS_TOKEN_KEY)
	localStorage.removeItem(REFRESH_TOKEN_KEY)
	localStorage.removeItem(USER_KEY)
	localStorage.removeItem(LAST_SESSION_ID_KEY)
}

export function setLastSessionId(sessionId: string) {
	if (typeof window === 'undefined') return
	localStorage.setItem(LAST_SESSION_ID_KEY, sessionId)
}

export function getLastSessionId(): string | null {
	if (typeof window === 'undefined') return null
	return localStorage.getItem(LAST_SESSION_ID_KEY)
}

export function clearLastSessionId() {
	if (typeof window === 'undefined') return
	localStorage.removeItem(LAST_SESSION_ID_KEY)
}

export function getAdminLoginOtpToken(): string | null {
	if (typeof window === 'undefined') return null
	return sessionStorage.getItem(ADMIN_LOGIN_OTP_TOKEN_KEY)
}

export function clearAdminLoginOtpToken() {
	if (typeof window === 'undefined') return
	sessionStorage.removeItem(ADMIN_LOGIN_OTP_TOKEN_KEY)
}

async function authedFetch<T>(
	path: string,
	init: RequestInit = {},
): Promise<ApiResult<T>> {
	const token = getAccessToken()
	if (!token) {
		return { data: null, error: { message: 'Not authenticated' } }
	}
	try {
		const res = await fetch(`${API_BASE_URL}${path}`, {
			...init,
			headers: {
				'Content-Type': 'application/json',
				...(init.headers || {}),
				Authorization: `Bearer ${token}`,
			},
		})
		const json = (await res.json().catch(() => ({}))) as Record<
			string,
			unknown
		>
		if (!res.ok) {
			const message =
				(typeof json.message === 'string' && json.message) ||
				`Request failed with status ${res.status}`
			if (res.status === 401) clearSession()
			return { data: null, error: { message } }
		}
		return { data: json as T, error: null }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Network error'
		return { data: null, error: { message } }
	}
}

export const getMe = async () => {
	const res = await authedFetch<{ message: string; user: MeUser }>(
		'/auth/me',
		{ method: 'GET' },
	)
	if (res.data && typeof window !== 'undefined') {
		// Mirror the canonical user fields back into local storage so the
		// rest of the app stays in sync.
		const stored: any = {
			id: res.data.user.id,
			email: res.data.user.email,
			firstName: res.data.user.firstName,
			lastName: res.data.user.lastName,
			businessName: res.data.user.businessName,
			phone: res.data.user.phone,
			avatarUrl: res.data.user.avatarUrl,
			isVerified: res.data.user.isVerified,
			role: res.data.user.role,
			staffSize: res.data.user.staffSize,
			industry: res.data.user.industry,
			country: res.data.user.country,
			state: res.data.user.state,
			operatingYears: res.data.user.operatingYears,
			annualRevenue: res.data.user.annualRevenue,
			businessSize: res.data.user.businessSize,
			hasAnyPaidPhase2AResult: res.data.user.hasAnyPaidPhase2AResult,
			hasPaidPhase2A: res.data.user.hasAnyPaidPhase2AResult || res.data.user.hasPaidPhase2A,
		}
		localStorage.setItem(USER_KEY, JSON.stringify(stored))
	}
	return res
}

export type InitPaymentResponse = {
	message: string
	// True when a 100%-off coupon covered the full amount — the payment is
	// already SUCCESS and there is no Paystack checkout to open.
	free: boolean
	authorizationUrl: string | null
	accessCode: string | null
	reference: string
	paymentId: string
	amount: number
	baseAmount: number
	discountAmount: number
	currency: string
	couponCode: string | null
}

export type VerifyPaymentResponse = {
	message: string
	status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'ABANDONED' | 'REVERSED'
	paid: boolean
	reference: string
}

export const initPayment = async (payload: {
	plan: 'PHASE2A' | 'PHASE2B_PILLAR'
	sessionId?: string
	pillarId?: string
	couponCode?: string
}) => {
	return authedFetch<InitPaymentResponse>('/payment/init', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export type CouponPricing = {
	code: string
	basePrice: number
	discountAmount: number
	finalAmount: number
}

export type ValidateCouponResponse = {
	message: string
	pricing: CouponPricing
}

export const validateCoupon = async (payload: {
	code: string
	basePrice: number
	plan: 'PHASE2A' | 'PHASE2B_PILLAR'
	pillarId?: string
}) => {
	return authedFetch<ValidateCouponResponse>('/coupon/validate', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export const verifyPayment = async (reference: string) => {
	return authedFetch<VerifyPaymentResponse>(
		`/payment/verify/${encodeURIComponent(reference)}`,
		{ method: 'GET' },
	)
}

export type PricingRow = {
	id: string
	plan: 'PHASE2A' | 'PHASE2B_PILLAR'
	pillarId: string | null
	pillarCode: string | null
	pillarName: string | null
	price: number
	currency: 'NGN'
	createdAt: string
	updatedAt: string
}

export type PublicPricingResponse = {
	message: string
	currency: 'NGN'
	phase2A: PricingRow | null
	phase2B: PricingRow[]
}

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
}

export type AdminPricingUpdatePayload = {
	price?: number
	pillarId?: string | null
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

export const getPublicPricing = async () => {
	try {
		const res = await fetch(`${API_BASE_URL}/payment/pricing`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		})
		const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
		if (!res.ok) {
			const message =
				(typeof json.message === 'string' && json.message) ||
				`Request failed with status ${res.status}`
			return { data: null, error: { message } }
		}
		return { data: json as PublicPricingResponse, error: null }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Network error'
		return { data: null, error: { message } }
	}
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
	plan: 'PHASE2A' | 'PHASE2B_PILLAR' | null
	pillarId: string | null
	pillarCode: string | null
	pillarName: string | null
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
	plan?: 'PHASE2A' | 'PHASE2B_PILLAR' | null
	pillarId?: string | null
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
	plan?: 'PHASE2A' | 'PHASE2B_PILLAR'
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

export const SignUp = async ({ payload }: { payload: SignUpPayload }) => {
	return apiFetch<{ message: string; user: AuthUser }>('/auth/register', {
		email: payload.email,
		password: payload.password,
		businessName: payload.businessName,
		phone: payload.phone,
	})
}

export type LoginResponse =
	| {
			message: string
			requiresOtp: false
			user: AuthUser
			accessToken: string
			refreshToken: string
	  }
	| {
			message: string
			requiresOtp: true
			otpToken: string
			role: 'ADMIN'
			email: string
	  }

export type VerifyAdminOtpResponse = {
	message: string
	user: AuthUser
	accessToken: string
	refreshToken: string
}

export const Login = async ({ payload }: { payload: LoginPayload }) => {
	const res = await apiFetch<LoginResponse>('/auth/login', payload)

	if (res.data?.requiresOtp) {
		if (typeof window !== 'undefined') {
			sessionStorage.setItem(ADMIN_LOGIN_OTP_TOKEN_KEY, res.data.otpToken)
		}
	} else if (res.data) {
		setSession(res.data.accessToken, res.data.refreshToken, res.data.user)
	}

	return res
}

export const verifyAdminOtp = async ({ code }: { code: string }) => {
	const loginToken =
		typeof window !== 'undefined'
			? sessionStorage.getItem(ADMIN_LOGIN_OTP_TOKEN_KEY)
			: null

	if (!loginToken) {
		return {
			data: null,
			error: { message: 'Admin login session expired. Please log in again.' },
		}
	}

	const res = await apiFetch<VerifyAdminOtpResponse>('/auth/admin/verify-otp', {
		loginToken,
		code,
	})

	if (res.data && typeof window !== 'undefined') {
		setSession(res.data.accessToken, res.data.refreshToken, res.data.user)
		sessionStorage.removeItem(ADMIN_LOGIN_OTP_TOKEN_KEY)
	}

	return res
}

export const forgotPassword = async ({ email }: { email: string }) => {
	const res = await apiFetch<{ message: string; otpToken: string }>(
		'/auth/forgot-password',
		{ email },
	)

	if (res.data && typeof window !== 'undefined') {
		sessionStorage.setItem(RESET_OTP_TOKEN_KEY, res.data.otpToken)
	}

	return res
}

export const verifyResetOtp = async ({
	email,
	code,
}: {
	email: string
	code: string
}) => {
	const otpToken =
		typeof window !== 'undefined'
			? sessionStorage.getItem(RESET_OTP_TOKEN_KEY)
			: null

	if (!otpToken) {
		return {
			data: null,
			error: { message: 'Reset session expired. Please start over.' },
		}
	}

	const res = await apiFetch<{ message: string; passwordToken: string }>(
		'/auth/verify-reset-otp',
		{ email, code, otpToken },
	)

	if (res.data && typeof window !== 'undefined') {
		sessionStorage.setItem(RESET_PASSWORD_TOKEN_KEY, res.data.passwordToken)
		sessionStorage.removeItem(RESET_OTP_TOKEN_KEY)
	}

	return res
}

export const resetPassword = async ({
	newPassword,
}: {
	newPassword: string
}) => {
	const passwordToken =
		typeof window !== 'undefined'
			? sessionStorage.getItem(RESET_PASSWORD_TOKEN_KEY)
			: null

	if (!passwordToken) {
		return {
			data: null,
			error: { message: 'Reset session expired. Please start over.' },
		}
	}

	const res = await apiFetch<{ message: string }>('/auth/reset-password', {
		passwordToken,
		newPassword,
	})

	if (res.data && typeof window !== 'undefined') {
		sessionStorage.removeItem(RESET_PASSWORD_TOKEN_KEY)
	}

	return res
}

export type Phase2BPillarStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'

export interface Phase2BPillarSession {
	pillarId: string
	pillarCode: string
	pillarName: string
	sessionId: string | null
	status: Phase2BPillarStatus
	unlockedAt: string
}

export const getMyPhase2BPillars = async () => {
	return authedFetch<{ message: string; pillars: Phase2BPillarSession[] }>(
		'/assessment/phase2b/me',
		{ method: 'GET' }
	)
}

export const startPhase2B = async (payload: { pillarId: string }) => {
	return authedFetch<{ message: string; sessionId: string }>(
		'/assessment/phase2b/start',
		{ method: 'POST', body: JSON.stringify(payload) }
	)
}

export const fetchPhase2BQuestions = async (pillarId: string) => {
	// For now using `any` as the return type for questions until we have a Question type defined globally
	return authedFetch<any>(
		`/questions/phase2b?pillarId=${pillarId}`,
		{ method: 'GET' }
	)
}

export const getAllPillars = async () => {
	return authedFetch<any>(
		'/questions/pillars',
		{ method: 'GET' }
	)
}

export const getMyCompletedResults = async () => {
	return authedFetch<any>(
		'/result/me',
		{ method: 'GET' }
	)
}

export const getSessionResponses = async (sessionId: string) => {
	return authedFetch<{
		message: string;
		answeredCount: number;
		totalCount: number;
		responses: { questionId: string; selectedOptionId: string }[];
	}>(`/assessment/${sessionId}/responses`, { method: 'GET' })
}

export const updateUserProfile = async (payload: {
	firstName?: string
	lastName?: string
	businessName?: string
	phone?: string
	email?: string
}) => {
	return authedFetch<{ message: string; user: AuthUser }>('/user/profile', {
		method: 'PATCH',
		body: JSON.stringify(payload),
	})
}

export const updateUserBusiness = async (payload: {
	businessName?: string
	industry?: string
	country?: string
	state?: string | null
	operatingYears?: string
	staffSize?: string
	annualRevenue?: string
}) => {
	return authedFetch<{ message: string; user: MeUser }>('/user/business', {
		method: 'PATCH',
		body: JSON.stringify(payload),
	})
}

export const verifyUserEmail = async () => {
	return authedFetch<{ message: string; user: AuthUser }>('/user/verify-email', {
		method: 'POST',
	})
}

export const uploadAvatar = async (file: File) => {
	const token = getAccessToken()
	if (!token) {
		return { data: null, error: { message: 'Not authenticated' } }
	}

	try {
		const formData = new FormData()
		formData.append('avatar', file)

		const res = await fetch(`${API_BASE_URL}/user/avatar`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		})

		const json = (await res.json().catch(() => ({}))) as Record<string, any>
		if (!res.ok) {
			const message = json.message || `Upload failed with status ${res.status}`
			return { data: null, error: { message } }
		}

		return { data: json as { message: string; avatarUrl: string; user: AuthUser }, error: null }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Network error'
		return { data: null, error: { message } }
	}
}

export const getMyBillingHistory = async (page = 1, limit = 10) => {
	return authedFetch<{
		message: string
		page: number
		limit: number
		total: number
		totalPages: number
		payments: any[]
	}>(`/payment/history?page=${page}&limit=${limit}`, { method: 'GET' })
}

// ─── Admin: list all users ────────────────────────────────────
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
} = {}) => {
	const qs = new URLSearchParams()
	if (params.page) qs.set('page', String(params.page))
	if (params.pageSize) qs.set('pageSize', String(params.pageSize))
	if (params.search) qs.set('search', params.search)
	if (params.businessSize) qs.set('businessSize', params.businessSize)
	if (params.plan) qs.set('plan', params.plan)
	if (params.active !== undefined) qs.set('active', String(params.active))

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

// ---------------------------------------------------------------------------
// Reports & Analytics (admin)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Payments (admin)
// ---------------------------------------------------------------------------

export type PaymentStatusValue =
	| 'PENDING'
	| 'SUCCESS'
	| 'FAILED'
	| 'ABANDONED'
	| 'REVERSED'

export type AdminPaymentRow = {
	id: string
	reference: string
	businessName: string | null
	email: string
	plan: 'PHASE2A' | 'PHASE2B_PILLAR'
	provider: string
	amount: number
	currency: string
	paymentMethod: string | null
	status: PaymentStatusValue
	paidAt: string | null
	createdAt: string
}

export type AdminPaymentListResponse = {
	message: string
	page: number
	pageSize: number
	total: number
	totalPages: number
	payments: AdminPaymentRow[]
}

export type AdminPaymentStats = {
	totalRevenue: number
	revenueThisMonth: number
	revenueLastMonth: number
	revenueGrowthPct: number | null
	pendingAmount: number
	pendingCount: number
	successRatePct: number | null
	countByStatus: { status: PaymentStatusValue; count: number }[]
	monthlyRevenue: { monthLabel: string; year: number; amount: number; count: number }[]
}

export type AdminPaymentDetail = AdminPaymentRow & {
	userId: string
	sessionId: string | null
	pillarId: string | null
	pillarName: string | null
	baseAmount: number
	couponCode: string | null
	discountAmount: number | null
	failureReason: string | null
	authorizationUrl: string | null
	updatedAt: string
	resultIsPaid: boolean | null
	unlock: {
		id: string
		unlockedAt: string
		consumedAt: string | null
		sessionId: string | null
	} | null
	webhookEvents: {
		id: string
		eventType: string
		processingStatus: string
		processingError: string | null
		receivedAt: string
	}[]
}

export type AdminCheckPaymentResponse = {
	message: string
	checkedVia: 'database' | 'paystack'
	status: PaymentStatusValue
	paid: boolean
	reference: string
	gatewayResponse: string | null
}

export const getAdminPayments = async (params: {
	page?: number
	pageSize?: number
	status?: PaymentStatusValue
	plan?: 'PHASE2A' | 'PHASE2B_PILLAR'
	search?: string
	method?: string
	dateFrom?: string
	dateTo?: string
} = {}) => {
	const qs = new URLSearchParams()
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null && value !== '') {
			qs.set(key, String(value))
		}
	}
	const query = qs.toString()
	return authedFetch<AdminPaymentListResponse>(
		`/admin/payments${query ? `?${query}` : ''}`,
		{ method: 'GET' },
	)
}

export const getAdminPaymentStats = async () => {
	return authedFetch<{ message: string; stats: AdminPaymentStats }>(
		'/admin/payments/stats',
		{ method: 'GET' },
	)
}

export const getAdminPaymentDetail = async (id: string) => {
	return authedFetch<{ message: string; payment: AdminPaymentDetail }>(
		`/admin/payments/${id}`,
		{ method: 'GET' },
	)
}

// "Check payment": backend answers from its records when the payment is
// already settled, otherwise falls back to re-verifying with Paystack.
export const checkAdminPayment = async (id: string) => {
	return authedFetch<AdminCheckPaymentResponse>(
		`/admin/payments/${id}/check`,
		{ method: 'POST' },
	)
}

export const updateAdminPaymentStatus = async (
	id: string,
	payload: { status: PaymentStatusValue; reason: string },
) => {
	return authedFetch<{ message: string; payment: AdminPaymentDetail }>(
		`/admin/payments/${id}/status`,
		{ method: 'PATCH', body: JSON.stringify(payload) },
	)
}
