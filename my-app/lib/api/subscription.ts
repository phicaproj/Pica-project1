import { API_BASE_URL, authedFetch } from './config'

// ──────────────────────────────────────────────────────────────────────────
// Shared shapes — wire types mirror backend src/module/subscription/types
// ──────────────────────────────────────────────────────────────────────────

export type SubscriptionPlanPublic = {
	id: string
	tier: number
	name: string
	description: string
	priceUsd: number
	phase2aPerMonth: number
	phase2bPerMonth: number
	consultationsPerMonth: number
	features: string[]
	displayOrder: number
}

export type SubscriptionPlanAdmin = SubscriptionPlanPublic & {
	paystackPlanCodeUsd: string | null
	paystackPlanCodeNgn: string | null
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export type CardOnFile = {
	last4: string
	brand: string | null
	bank: string | null
	expMonth: string | null
	expYear: string | null
}

export type SubscriptionStatus =
	| 'ACTIVE'
	| 'PAST_DUE'
	| 'CANCELLED'
	| 'EXPIRED'

export type MySubscriptionPayload = {
	id: string
	status: SubscriptionStatus
	plan: SubscriptionPlanPublic
	currency: 'USD' | 'NGN'
	currentPeriodStart: string
	currentPeriodEnd: string
	cancelAtPeriodEnd: boolean
	card: CardOnFile | null
	usage: {
		phase2aUsed: number
		phase2bUsed: number
		consultationsUsed: number
	}
}

// ──────────────────────────────────────────────────────────────────────────
// Public catalogue — no auth, used by landing/marketing too
// ──────────────────────────────────────────────────────────────────────────

export type ListPlansResponse = {
	message: string
	currency: 'USD'
	usdToNgn: number
	// Section F — storefront on/off toggles. When `subscription` is false the
	// BE returns an empty `plans` array; the FE should additionally hide the
	// picker so a cached response never leaks the disabled section.
	sections: {
		payPerUse: boolean
		subscription: boolean
	}
	plans: SubscriptionPlanPublic[]
}

export const getSubscriptionPlans = async () => {
	try {
		const res = await fetch(`${API_BASE_URL}/subscription/plans`, {
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
		return { data: json as ListPlansResponse, error: null }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Network error'
		return { data: null, error: { message } }
	}
}

// ──────────────────────────────────────────────────────────────────────────
// User — me / subscribe / cancel
// ──────────────────────────────────────────────────────────────────────────

export type MySubscriptionResponse = {
	message: string
	subscription: MySubscriptionPayload | null
}

export const getMySubscription = async () => {
	return authedFetch<MySubscriptionResponse>('/subscription/me', {
		method: 'GET',
	})
}

// Shape mirrors InitPaymentResponse so the FE can reuse the same coupon UI
// across pay-per-use and subscription checkout. When `free` is true, the BE
// already settled the subscription via a 100%-off coupon and the FE should
// jump straight to verify/success — no Paystack widget.
export type SubscribeResponse = {
	message: string
	free: boolean
	authorizationUrl: string | null
	accessCode: string | null
	reference: string
	amount: number
	baseAmount: number
	discountAmount: number
	currency: 'USD' | 'NGN'
	couponCode: string | null
}

export const subscribeToPlan = async (
	planId: string,
	options: { couponCode?: string } = {},
) => {
	return authedFetch<SubscribeResponse>('/subscription/subscribe', {
		method: 'POST',
		body: JSON.stringify({
			planId,
			...(options.couponCode ? { couponCode: options.couponCode } : {}),
		}),
	})
}

export type CancelSubscriptionResponse = {
	message: string
	cancelAtPeriodEnd: boolean
	currentPeriodEnd: string
}

export const cancelMySubscription = async () => {
	return authedFetch<CancelSubscriptionResponse>('/subscription/cancel', {
		method: 'POST',
	})
}

// ──────────────────────────────────────────────────────────────────────────
// Admin — tier CRUD (gated by hasPermission('ledger:*') on the server)
// ──────────────────────────────────────────────────────────────────────────

export type AdminListPlansResponse = {
	message: string
	plans: SubscriptionPlanAdmin[]
}

export type AdminPlanResponse = {
	message: string
	plan: SubscriptionPlanAdmin
}

export const adminListSubscriptionPlans = async () => {
	return authedFetch<AdminListPlansResponse>('/admin/subscription-plans', {
		method: 'GET',
	})
}

export type CreateSubscriptionPlanInput = {
	tier: number
	name: string
	description?: string
	priceUsd: number
	phase2aPerMonth: number
	phase2bPerMonth: number
	consultationsPerMonth: number
	features?: string[]
	isActive?: boolean
	displayOrder?: number
}

export const adminCreateSubscriptionPlan = async (
	input: CreateSubscriptionPlanInput,
) => {
	return authedFetch<AdminPlanResponse>('/admin/subscription-plans', {
		method: 'POST',
		body: JSON.stringify(input),
	})
}

export type UpdateSubscriptionPlanInput = Partial<
	Omit<CreateSubscriptionPlanInput, 'tier'>
>

export const adminUpdateSubscriptionPlan = async (
	id: string,
	input: UpdateSubscriptionPlanInput,
) => {
	return authedFetch<AdminPlanResponse>(`/admin/subscription-plans/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(input),
	})
}

export const adminDeleteSubscriptionPlan = async (id: string) => {
	return authedFetch<{ message: string }>(`/admin/subscription-plans/${id}`, {
		method: 'DELETE',
	})
}
