import { API_BASE_URL, authedFetch } from './config'

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
