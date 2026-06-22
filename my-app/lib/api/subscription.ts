import { API_BASE_URL, authedFetch } from './config'

// ──────────────────────────────────────────────────────────────────────────
// Shared shapes — wire types mirror backend src/module/subscription/types
// ──────────────────────────────────────────────────────────────────────────

export type BillingInterval = 'MONTHLY' | 'ANNUAL'

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
	// Per-tier annual discount. `annualDiscountPct` of 0 means the tier has no
	// annual option — the FE Monthly/Annual toggle hides the annual side for
	// that card. `priceUsdAnnual` is the derived `priceUsd × 12 × (1 − pct/100)`.
	annualDiscountPct: number
	priceUsdAnnual: number
}

export type SubscriptionPlanAdmin = SubscriptionPlanPublic & {
	paystackPlanCodeUsd: string | null
	paystackPlanCodeNgn: string | null
	paystackPlanCodeUsdAnnual: string | null
	paystackPlanCodeNgnAnnual: string | null
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
	// USD→NGN rate captured at fetch time so the Billing card can render the
	// wire-currency amount (priceUsd * usdToNgn for NGN users) instead of
	// showing the ₦ symbol next to the unconverted USD figure.
	usdToNgn: number
	billingInterval: BillingInterval
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
	options: { couponCode?: string; interval?: BillingInterval } = {},
) => {
	return authedFetch<SubscribeResponse>('/subscription/subscribe', {
		method: 'POST',
		body: JSON.stringify({
			planId,
			...(options.interval ? { interval: options.interval } : {}),
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

// Section R-2 — cheap, read-only quota probe used by the dashboard checkout
// flow. The old path called initPayment just to learn whether the user's
// subscription covered the action; that created PENDING Payment rows for
// every paid outcome. This endpoint writes nothing and returns the same
// hasQuota verdict the assertSubscriptionQuota service already computes.
export type QuotaCheckKind = 'PHASE2A' | 'PHASE2B_PILLAR' | 'CONSULTATION'

export type QuotaCheckResponse = {
	message: string
	hasQuota: boolean
	kind: QuotaCheckKind
}

export const quotaCheck = async (kind: QuotaCheckKind) => {
	return authedFetch<QuotaCheckResponse>(
		`/subscription/quota-check?kind=${encodeURIComponent(kind)}`,
		{ method: 'GET' },
	)
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
	// 0–80 (%). 0 disables the annual option for this tier.
	annualDiscountPct?: number
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
