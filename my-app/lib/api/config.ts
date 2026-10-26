// Shared low-level pieces every other api/* module builds on:
//   - the API base URL (single env var, single fallback)
//   - localStorage / sessionStorage keys
//   - apiFetch (anonymous POST) and authedFetch (token-bearing) primitives
//   - session helpers (get/set/clear)
//
// Keeping these here means every endpoint module imports the same fetchers,
// so error shapes, 401 handling, and content-type defaults stay consistent.

const LOCAL_API_BASE_URL = 'http://localhost:3210/api'
const DEFAULT_API_BASE_URL = 'https://pica-project1.onrender.com/api'

function isLocalhost(hostname: string) {
	return (
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname === '::1' ||
		hostname === '[::1]'
	)
}

export function getApiBaseUrl() {
	if (
		typeof window !== 'undefined' &&
		isLocalhost(window.location.hostname.toLowerCase())
	) {
		return LOCAL_API_BASE_URL
	}

	return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
}

export const API_BASE_URL = getApiBaseUrl()

export const ACCESS_TOKEN_KEY = 'pica.accessToken'
export const REFRESH_TOKEN_KEY = 'pica.refreshToken'
export const USER_KEY = 'pica.user'
export const RESET_OTP_TOKEN_KEY = 'pica.resetOtpToken'
export const ADMIN_LOGIN_OTP_TOKEN_KEY = 'pica.adminLoginOtpToken'
export const EMAIL_VERIFY_OTP_TOKEN_KEY = 'pica.emailVerifyOtpToken'
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

function getRefreshToken(): string | null {
	if (typeof window === 'undefined') return null
	return (
		sessionStorage.getItem(REFRESH_TOKEN_KEY) ??
		localStorage.getItem(REFRESH_TOKEN_KEY)
	)
}

function setRefreshedTokens(accessToken: string, refreshToken: string) {
	if (typeof window === 'undefined') return
	const storage =
		sessionStorage.getItem(REFRESH_TOKEN_KEY) !== null
			? sessionStorage
			: localStorage
	storage.setItem(ACCESS_TOKEN_KEY, accessToken)
	storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function setSession(
	accessToken: string,
	refreshToken: string,
	user: AuthUser,
	remember = true,
) {
	if (typeof window === 'undefined') return
	const storage = remember ? localStorage : sessionStorage
	const otherStorage = remember ? sessionStorage : localStorage
	storage.setItem(ACCESS_TOKEN_KEY, accessToken)
	storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
	storage.setItem(USER_KEY, JSON.stringify(user))
	otherStorage.removeItem(ACCESS_TOKEN_KEY)
	otherStorage.removeItem(REFRESH_TOKEN_KEY)
	otherStorage.removeItem(USER_KEY)
	// Drop any anonymous free-scan pointer left in this browser by a previous
	// visitor. Without this, signing in with a different email on a shared
	// machine would load the prior user's Phase-1 scan (session bleed).
	localStorage.removeItem(LAST_SESSION_ID_KEY)
}

export function getAccessToken(): string | null {
	if (typeof window === 'undefined') return null
	return (
		sessionStorage.getItem(ACCESS_TOKEN_KEY) ??
		localStorage.getItem(ACCESS_TOKEN_KEY)
	)
}

export function setStoredUser(user: AuthUser) {
	if (typeof window === 'undefined') return
	const storage =
		sessionStorage.getItem(REFRESH_TOKEN_KEY) !== null
			? sessionStorage
			: localStorage
	storage.setItem(USER_KEY, JSON.stringify(user))
}

export function getStoredUser(): AuthUser | null {
	if (typeof window === 'undefined') return null
	const raw =
		sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY)
	if (!raw) return null
	try {
		return JSON.parse(raw) as AuthUser
	} catch {
		return null
	}
}

export function clearSession() {
	if (typeof window === 'undefined') return
	sessionStorage.removeItem(ACCESS_TOKEN_KEY)
	sessionStorage.removeItem(REFRESH_TOKEN_KEY)
	sessionStorage.removeItem(USER_KEY)
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

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
	refreshSubscribers.forEach((cb) => cb(token))
	refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
	refreshSubscribers.push(cb)
}

export async function authedFetch<T>(
	path: string,
	init: RequestInit = {},
): Promise<ApiResult<T>> {
	let token = getAccessToken()
	if (!token) {
		return { data: null, error: { message: 'Not authenticated' } }
	}
	try {
		let res = await fetch(`${API_BASE_URL}${path}`, {
			...init,
			headers: {
				'Content-Type': 'application/json',
				...(init.headers || {}),
				Authorization: `Bearer ${token}`,
			},
		})

		if (res.status === 401) {
			const refreshToken = getRefreshToken();
			if (refreshToken) {
				if (!isRefreshing) {
					isRefreshing = true;
					try {
						const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ refreshToken })
						});
						if (refreshRes.ok) {
							const data = await refreshRes.json();
							if (data.accessToken && data.refreshToken) {
								setRefreshedTokens(data.accessToken, data.refreshToken);
								token = data.accessToken;
								onRefreshed(data.accessToken);
							} else {
								onRefreshed('');
							}
						} else {
							onRefreshed('');
						}
					} catch (e) {
						onRefreshed('');
					} finally {
						isRefreshing = false;
					}
				} else {
					token = await new Promise<string>((resolve) => {
						addRefreshSubscriber((newToken: string) => {
							resolve(newToken);
						});
					});
				}

				if (token) {
					// Retry request
					res = await fetch(`${API_BASE_URL}${path}`, {
						...init,
						headers: {
							'Content-Type': 'application/json',
							...(init.headers || {}),
							Authorization: `Bearer ${token}`,
						},
					});
				}
			}
		}

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

let rawRefreshPromise: Promise<string | null> | null = null

async function refreshAccessTokenOnce(): Promise<string | null> {
	if (rawRefreshPromise) return rawRefreshPromise

	rawRefreshPromise = (async () => {
		if (typeof window === 'undefined') return null
		const refreshToken = getRefreshToken()
		if (!refreshToken) return null

		try {
			const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken }),
			})
			if (!res.ok) return null

			const data = await res.json()
			if (!data.accessToken || !data.refreshToken) return null

			setRefreshedTokens(data.accessToken, data.refreshToken)
			return data.accessToken as string
		} catch {
			return null
		}
	})()

	try {
		return await rawRefreshPromise
	} finally {
		rawRefreshPromise = null
	}
}

// Response-returning variant of authedFetch for callers that need to inspect
// status/body directly. Refreshes an expired access token once before retrying.
export async function authedFetchRaw(
	path: string,
	init: RequestInit = {},
): Promise<Response> {
	const run = (token: string | null) => {
		const headers = new Headers(init.headers || {})
		if (!headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/json')
		}
		if (token) headers.set('Authorization', `Bearer ${token}`)
		return fetch(`${API_BASE_URL}${path}`, { ...init, headers })
	}

	let res = await run(getAccessToken())

	if (res.status === 401) {
		const refreshed = await refreshAccessTokenOnce()
		if (refreshed) {
			res = await run(refreshed)
		}
	}

	if (res.status === 401) clearSession()
	return res
}

export type BusinessSize = 'SMALL' | 'MEDIUM'
