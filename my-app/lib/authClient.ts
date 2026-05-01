const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const ACCESS_TOKEN_KEY = 'pica.accessToken'
const REFRESH_TOKEN_KEY = 'pica.refreshToken'
const USER_KEY = 'pica.user'
const RESET_OTP_TOKEN_KEY = 'pica.resetOtpToken'
const RESET_PASSWORD_TOKEN_KEY = 'pica.resetPasswordToken'

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
	isVerified: boolean
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
