import {
	API_BASE_URL,
	authedFetch,
	getAccessToken,
	type AuthUser,
} from './config'
import type { MeUser } from './auth'

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

// Avatar upload goes through multipart/form-data so we can't use authedFetch
// (which forces application/json). Build the request inline.
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
