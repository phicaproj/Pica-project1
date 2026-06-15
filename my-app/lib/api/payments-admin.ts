import { authedFetch } from './config'

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
