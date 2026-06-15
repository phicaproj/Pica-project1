import {
	apiFetch,
	authedFetch,
	setSession,
	clearSession,
	ADMIN_LOGIN_OTP_TOKEN_KEY,
	RESET_OTP_TOKEN_KEY,
	RESET_PASSWORD_TOKEN_KEY,
	USER_KEY,
	type AuthUser,
	type BusinessSize,
} from './config'

// Sign-up + login payloads — kept narrow on purpose: they're the only two
// callers that need them, and the controller-side Zod schema decides what's
// required. The profile fields are optional at signup: anything missing here
// keeps `profileComplete` false and is later filled in via the dashboard
// profile-completion banner.
interface SignUpPayload {
	businessName: string
	email: string
	phone: string
	password: string
	staffSize?: string
	industry?: string
	country?: string
	state?: string
	operatingYears?: string
}

interface LoginPayload {
	email: string
	password: string
}

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
	// True once the user has supplied enough profile data to unlock paid
	// tests. Today the only hard requirement is businessSize (derived from
	// staffSize). Used by the dashboard to show the completion banner.
	profileComplete: boolean
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
			profileComplete: res.data.user.profileComplete,
		}
		localStorage.setItem(USER_KEY, JSON.stringify(stored))
	}
	return res
}

export const SignUp = async ({ payload }: { payload: SignUpPayload }) => {
	// Optional profile fields are forwarded only when filled. The backend
	// snapshots any matching Phase 1 session data for fields we don't send,
	// then leaves the rest null (and profileComplete=false).
	const body: Record<string, string> = {
		email: payload.email,
		password: payload.password,
		businessName: payload.businessName,
		phone: payload.phone,
	}
	if (payload.staffSize?.trim()) body.staffSize = payload.staffSize.trim()
	if (payload.industry?.trim()) body.industry = payload.industry.trim()
	if (payload.country?.trim()) body.country = payload.country.trim()
	if (payload.state?.trim()) body.state = payload.state.trim()
	if (payload.operatingYears?.trim())
		body.operatingYears = payload.operatingYears.trim()
	return apiFetch<{ message: string; user: AuthUser }>('/auth/register', body)
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

// Public — the invitee is not yet authenticated when they accept.
export const acceptInvite = async (payload: {
	token: string
	newPassword: string
}) => {
	return apiFetch<{ message: string }>('/auth/accept-invite', payload)
}
