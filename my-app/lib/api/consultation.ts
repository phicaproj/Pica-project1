import { API_BASE_URL, authedFetch } from './config'

// ──────────────────────────────────────────────────────────────────────────
// Wire types — mirror backend src/module/consultation/consultation.types.ts
// ──────────────────────────────────────────────────────────────────────────

export type ConsultationTierPublic = {
	id: string
	tier: number
	name: string
	description: string
	priceUsd: number
	durationMinutes: number
	displayOrder: number
	// PICA 2A bonus per confirmed booking. 0 hides the bonus chip.
	freeP2ARuns: number
	freeP2ACreditWindowDays: number
}

export type ConsultationTierAdmin = ConsultationTierPublic & {
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export type ConsultationBookingStatus =
	| 'REQUESTED'
	| 'CONFIRMED'
	| 'ATTENDED'
	| 'NO_SHOW'
	| 'CANCELLED'

export type CompletedResultOption = {
	sessionResultId: string
	sessionId: string
	phase: 'PHASE2A' | 'PHASE2B'
	pillarCode: string | null
	pillarName: string | null
	totalScore: number
	colorBand: string
	generatedAt: string | null
}

export type ConsultationBookingPayload = {
	id: string
	tier: ConsultationTierPublic
	status: ConsultationBookingStatus
	topic: string
	notes: string
	preferredTimes: string | null
	relatedResult: CompletedResultOption | null
	scheduledAt: string | null
	meetingLink: string | null
	coveredBySubscription: boolean
	payment: {
		reference: string
		status: string
		amount: number
		currency: string
		authorizationUrl: string | null
	} | null
	requestedAt: string
}

// ──────────────────────────────────────────────────────────────────────────
// USER endpoints
// ──────────────────────────────────────────────────────────────────────────

export type ListConsultationTiersResponse = {
	message: string
	currency: 'USD'
	usdToNgn: number
	tiers: ConsultationTierPublic[]
}

export const getConsultationTiers = async () => {
	try {
		const res = await fetch(`${API_BASE_URL}/consultation/tiers`, {
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
		return { data: json as ListConsultationTiersResponse, error: null }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Network error'
		return { data: null, error: { message } }
	}
}

export type MyCompletedResultsResponse = {
	message: string
	results: CompletedResultOption[]
}

export const getMyConsultationResults = async () => {
	return authedFetch<MyCompletedResultsResponse>('/consultation/me/results', {
		method: 'GET',
	})
}

export type MyConsultationsResponse = {
	message: string
	bookings: ConsultationBookingPayload[]
}

export const getMyConsultations = async () => {
	return authedFetch<MyConsultationsResponse>('/consultation/me', {
		method: 'GET',
	})
}

export type BookConsultationInput = {
	tierId: string
	topic: string
	notes?: string
	preferredTimes?: string
	relatedSessionResultId?: string
}

export type BookConsultationResponse = {
	message: string
	coveredBySubscription: boolean
	booking: ConsultationBookingPayload
}

export const bookConsultation = async (input: BookConsultationInput) => {
	return authedFetch<BookConsultationResponse>('/consultation/book', {
		method: 'POST',
		body: JSON.stringify(input),
	})
}

// ──────────────────────────────────────────────────────────────────────────
// ADMIN endpoints
// ──────────────────────────────────────────────────────────────────────────

export type AdminListConsultationTiersResponse = {
	message: string
	tiers: ConsultationTierAdmin[]
}

export type AdminConsultationTierResponse = {
	message: string
	tier: ConsultationTierAdmin
}

export const adminListConsultationTiers = async () => {
	return authedFetch<AdminListConsultationTiersResponse>(
		'/admin/consultation-tiers',
		{ method: 'GET' },
	)
}

export type CreateConsultationTierInput = {
	tier: number
	name: string
	description?: string
	priceUsd: number
	durationMinutes: number
	freeP2ARuns?: number
	freeP2ACreditWindowDays?: number
	isActive?: boolean
	displayOrder?: number
}

export const adminCreateConsultationTier = async (
	input: CreateConsultationTierInput,
) => {
	return authedFetch<AdminConsultationTierResponse>(
		'/admin/consultation-tiers',
		{
			method: 'POST',
			body: JSON.stringify(input),
		},
	)
}

export type UpdateConsultationTierInput = Partial<
	Omit<CreateConsultationTierInput, 'tier'>
>

export const adminUpdateConsultationTier = async (
	id: string,
	input: UpdateConsultationTierInput,
) => {
	return authedFetch<AdminConsultationTierResponse>(
		`/admin/consultation-tiers/${id}`,
		{
			method: 'PATCH',
			body: JSON.stringify(input),
		},
	)
}

export const adminDeleteConsultationTier = async (id: string) => {
	return authedFetch<{ message: string }>(
		`/admin/consultation-tiers/${id}`,
		{ method: 'DELETE' },
	)
}

export type AdminBookingRow = ConsultationBookingPayload & {
	user: {
		id: string
		email: string
		businessName: string | null
		firstName: string | null
		lastName: string | null
	}
}

export type AdminListBookingsResponse = {
	message: string
	page: number
	pageSize: number
	total: number
	totalPages: number
	bookings: AdminBookingRow[]
}

export const adminListConsultationBookings = async (params?: {
	status?: ConsultationBookingStatus
	page?: number
	pageSize?: number
}) => {
	const search = new URLSearchParams()
	if (params?.status) search.set('status', params.status)
	if (params?.page) search.set('page', String(params.page))
	if (params?.pageSize) search.set('pageSize', String(params.pageSize))
	const qs = search.toString()
	return authedFetch<AdminListBookingsResponse>(
		`/admin/consultation-bookings${qs ? `?${qs}` : ''}`,
		{ method: 'GET' },
	)
}

export type ConfirmBookingInput = {
	scheduledAt: string // ISO-8601
	meetingLink: string
}

export type AdminBookingResponse = {
	message: string
	booking: AdminBookingRow
}

export const adminConfirmConsultationBooking = async (
	id: string,
	input: ConfirmBookingInput,
) => {
	return authedFetch<AdminBookingResponse>(
		`/admin/consultation-bookings/${id}/confirm`,
		{
			method: 'PATCH',
			body: JSON.stringify(input),
		},
	)
}

export const adminUpdateConsultationBookingStatus = async (
	id: string,
	status: 'ATTENDED' | 'NO_SHOW' | 'CANCELLED',
) => {
	return authedFetch<AdminBookingResponse>(
		`/admin/consultation-bookings/${id}/status`,
		{
			method: 'PATCH',
			body: JSON.stringify({ status }),
		},
	)
}

// ──────────────────────────────────────────────────────────────────────────
// User — unconsumed PICA 2A credits granted by paid consultation bookings.
// Backs the strategic-scan CTA banner. Returns only unexpired, unconsumed.
// ──────────────────────────────────────────────────────────────────────────

export type MyPhase2ACreditPublic = {
	id: string
	expiresAt: string
	consultationBookingId: string
}

export type MyPhase2ACreditsResponse = {
	message: string
	credits: MyPhase2ACreditPublic[]
}

export const getMyPhase2ACredits = async () => {
	return authedFetch<MyPhase2ACreditsResponse>(
		'/consultation/phase2a-credits',
		{ method: 'GET' },
	)
}
