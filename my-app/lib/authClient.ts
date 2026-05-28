const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	'https://pica-project1.onrender.com/api'

const ACCESS_TOKEN_KEY = 'pica.accessToken'
const REFRESH_TOKEN_KEY = 'pica.refreshToken'
const USER_KEY = 'pica.user'
const RESET_OTP_TOKEN_KEY = 'pica.resetOtpToken'
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
	businessName: string | null
	phone: string | null
	avatarUrl: string | null
	isVerified: boolean
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
			businessName: res.data.user.businessName,
			phone: res.data.user.phone,
			avatarUrl: res.data.user.avatarUrl,
			isVerified: res.data.user.isVerified,
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
	authorizationUrl: string
	accessCode: string
	reference: string
	paymentId: string
}

export type VerifyPaymentResponse = {
	message: string
	status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'ABANDONED' | 'REVERSED'
	paid: boolean
	reference: string
}

export const initPayment = async (payload: {
	plan: 'PHASE2A' | 'PHASE2B_PILLAR'
	amount: number
	sessionId?: string
	pillarId?: string
}) => {
	return authedFetch<InitPaymentResponse>('/payment/init', {
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

export const SignUp = async ({ payload }: { payload: SignUpPayload }) => {
	return apiFetch<{ message: string; user: AuthUser }>('/auth/register', {
		email: payload.email,
		password: payload.password,
		businessName: payload.businessName,
		phone: payload.phone,
	})
}

export const Login = async ({ payload }: { payload: LoginPayload }) => {
	const res = await apiFetch<{
		message: string
		user: AuthUser
		accessToken: string
		refreshToken: string
	}>('/auth/login', payload)

	if (res.data) {
		setSession(res.data.accessToken, res.data.refreshToken, res.data.user)
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

