// Shared low-level pieces every other api/* module builds on:
//   - the API base URL (single env var, single fallback)
//   - localStorage / sessionStorage keys
//   - apiFetch (anonymous POST) and authedFetch (token-bearing) primitives
//   - session helpers (get/set/clear)
//
// Keeping these here means every endpoint module imports the same fetchers,
// so error shapes, 401 handling, and content-type defaults stay consistent.

export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	'https://pica-project1.onrender.com/api'

export const ACCESS_TOKEN_KEY = 'pica.accessToken'
export const REFRESH_TOKEN_KEY = 'pica.refreshToken'
export const USER_KEY = 'pica.user'
export const RESET_OTP_TOKEN_KEY = 'pica.resetOtpToken'
export const ADMIN_LOGIN_OTP_TOKEN_KEY = 'pica.adminLoginOtpToken'
export const RESET_PASSWORD_TOKEN_KEY = 'pica.resetPasswordToken'
export const LAST_SESSION_ID_KEY = 'pica.lastSessionId'

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
	adminRoleName?: string | null
	permissions?: string[]
}

export interface ApiError {
	message: string
}

export interface ApiResult<T> {
	data: T | null
	error: ApiError | null
}

export async function apiFetch<T>(path: string, body: unknown): Promise<ApiResult<T>> {
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

export function setSession(accessToken: string, refreshToken: string, user: AuthUser) {
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

export async function authedFetch<T>(
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

export type BusinessSize = 'SMALL' | 'MEDIUM'
