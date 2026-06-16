'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
// Link is used below to gate paid-test entry on profile completion.
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	CheckCircle,
	Loader,
	Radar,
	Save,
} from 'lucide-react'
import { getAccessToken, getMe, setLastSessionId, type MeUser } from '@/lib/authClient'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	'https://pica-project1.onrender.com/api'

type ScanState = 'landing' | 'questions' | 'processing'

type ColorBand = 'RED' | 'AMBER' | 'GREEN'

interface QuestionOption {
	id: string
	optionLabel: string
	optionText: string
	displayOrder: number
}

interface Phase2AQuestion {
	id: string
	questionCode: string
	questionText: string
	displayOrder: number
	answered: boolean
	selectedOptionId: string | null
	options: QuestionOption[]
}

interface Phase2APillar {
	id: string
	code: string
	name: string
	description: string | null
	displayOrder: number
	questions: Phase2AQuestion[]
}

interface FlatQuestion {
	question: Phase2AQuestion
}

interface PillarMeta {
	id: string
	code: string
	name: string
	description: string | null
	displayOrder: number
}

interface Finding {
	optionId: string
	questionText: string
	selectedLabel: string
	observation: string
	recommendation: string
	riskType: string
	score: number
}

interface PillarScore {
	id: string
	pillarId: string
	rawScore: number
	maxPossibleScore: number
	weightedScore: number
	hasKnockout: boolean
	colorBand: ColorBand
	insightRuleApplied: string
	findings: Finding[]
	pillar: PillarMeta
}

interface ResultPayload {
	id: string
	sessionId: string
	totalScore: number
	colorBand: ColorBand
	hasAnyKnockout: boolean
	knockoutQuestionIds: string[]
	insightPayload: unknown
	reportPdfUrl: string | null
	generatedAt: string | null
	createdAt: string
	updatedAt: string
	pillarScores: PillarScore[]
}

interface GetResultResponse {
	message: string
	paywalled: boolean
	result: ResultPayload
}

const COLOR_BAND_TO_STATUS: Record<
	ColorBand,
	{ label: string; bar: string; pill: string }
> = {
	GREEN: {
		label: 'Optimized',
		bar: 'bg-emerald-400',
		pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
	},
	AMBER: {
		label: 'Active',
		bar: 'bg-amber-400',
		pill: 'bg-amber-500/15 text-amber-300 border-amber-400/20',
	},
	RED: {
		label: 'Attention',
		bar: 'bg-rose-400',
		pill: 'bg-rose-500/15 text-rose-300 border-rose-400/20',
	},
}

const COLOR_BAND_TO_RING: Record<ColorBand, string> = {
	GREEN: 'from-emerald-400 to-teal-300',
	AMBER: 'from-amber-400 to-orange-300',
	RED: 'from-rose-400 to-orange-300',
}

function normalizeColorBand(value: unknown): ColorBand {
	if (typeof value !== 'string') return 'AMBER'
	const normalized = value.trim().toUpperCase()
	if (
		normalized === 'GREEN' ||
		normalized === 'AMBER' ||
		normalized === 'RED'
	) {
		return normalized
	}
	if (normalized === 'YELLOW') return 'AMBER'
	return 'AMBER'
}

function isResultResponse(value: unknown): value is GetResultResponse {
	if (!value || typeof value !== 'object') return false
	const candidate = value as {
		message?: unknown
		paywalled?: unknown
		result?: { pillarScores?: unknown; totalScore?: unknown } | null
	}

	return (
		typeof candidate.message === 'string' &&
		typeof candidate.paywalled === 'boolean' &&
		!!candidate.result &&
		typeof candidate.result.totalScore === 'number' &&
		Array.isArray(candidate.result.pillarScores)
	)
}

function formatRelativeTime(iso: string | null) {
	if (!iso) return 'Recently updated'
	const ms = new Date(iso).getTime()
	if (Number.isNaN(ms)) return 'Recently updated'
	const diffMinutes = Math.max(1, Math.round((Date.now() - ms) / 60000))
	if (diffMinutes < 60) {
		return `Last updated ${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`
	}
	const diffHours = Math.round(diffMinutes / 60)
	if (diffHours < 24) {
		return `Last updated ${diffHours} hr${diffHours === 1 ? '' : 's'} ago`
	}
	const diffDays = Math.round(diffHours / 24)
	return `Last updated ${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

async function authFetch(path: string, init?: RequestInit) {
	const token = getAccessToken()
	const headers = new Headers(init?.headers || {})
	headers.set('Content-Type', 'application/json')
	if (token) headers.set('Authorization', `Bearer ${token}`)
	return fetch(`${API_BASE}${path}`, { ...init, headers })
}

function flattenPillars(pillars: Phase2APillar[]): FlatQuestion[] {
	const flat: FlatQuestion[] = []
	pillars
		.slice()
		.sort((a, b) => a.displayOrder - b.displayOrder)
		.forEach((pillar) => {
			pillar.questions
				.slice()
				.sort((a, b) => a.displayOrder - b.displayOrder)
				.forEach((question) => {
					flat.push({ question })
				})
		})
	return flat
}

// ─── Landing State ──────────────────────────────────────────────────────────
function LandingState({
	onStart,
	loading,
	error,
	profileIncomplete,
}: {
	onStart: () => void
	loading: boolean
	error: string | null
	// Paid tests (Phase 2A) require a resolved businessSize, which depends on
	// staffSize. When that's missing we keep the Start button disabled and
	// point the user at /dashboard/settings — same gate the backend enforces.
	profileIncomplete: boolean
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.5 }}
			className='space-y-8 max-w-full'
		>
			<div className='relative rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 overflow-hidden'>
				<div className='absolute right-0 top-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none' />
				<div className='absolute left-1/3 bottom-0 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl pointer-events-none' />

				<div className='relative z-10 flex flex-col lg:flex-row gap-8 p-6 md:p-10'>
					<div className='flex-1 min-w-0'>
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.1 }}
							className='inline-block px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider mb-6'
						>
							System Ready
						</motion.span>

						<motion.h1
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className='text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6'
						>
							<span className='bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent'>
								Initiate Your
							</span>
							<br />
							<span className='bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent'>
								Strategic
							</span>
							<br />
							<span className='bg-gradient-to-r from-orange-400 via-yellow-400 to-teal-400 bg-clip-text text-transparent'>
								Scan.
							</span>
						</motion.h1>

						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3 }}
							className='text-gray-400 text-sm md:text-base max-w-lg mb-8'
						>
							Unfold the mathematical architecture of your
							business through a guided diagnostic. Your progress
							is saved automatically, so you can leave any time
							and resume right where you stopped.
						</motion.p>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
							className='flex flex-wrap gap-3 mb-8'
						>
							{[
								'Guided assessment flow',
								'Auto-save enabled',
								'Secure session tracking',
							].map((item) => (
								<div
									key={item}
									className='px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-gray-300'
								>
									{item}
								</div>
							))}
						</motion.div>

						{error && (
							<div className='mb-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300'>
								{error}
							</div>
						)}

						{profileIncomplete && (
							<div className='mb-6 px-4 py-3 rounded-xl border border-orange-500/30 bg-orange-500/10 text-sm text-orange-200 flex flex-col sm:flex-row sm:items-center gap-3'>
								<span className='flex-1'>
									Finish your business profile to unlock the
									Strategic Scan — we need your staff size first.
								</span>
								<Link
									href='/dashboard/settings'
									className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap'
								>
									Complete profile <ArrowRight className='w-3 h-3' />
								</Link>
							</div>
						)}

						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.5 }}
							className='flex flex-wrap items-center gap-6'
						>
							<motion.button
								whileHover={
									!profileIncomplete ? { scale: 1.02 } : {}
								}
								whileTap={
									!profileIncomplete ? { scale: 0.98 } : {}
								}
								onClick={onStart}
								disabled={loading || profileIncomplete}
								title={
									profileIncomplete
										? 'Complete your business profile first'
										: undefined
								}
								className='inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition shadow-lg shadow-orange-500/20'
							>
								{loading ? (
									<>
										<Loader className='w-4 h-4 animate-spin' />
										Preparing Scan...
									</>
								) : (
									<>
										Start New Scan
										<ArrowRight className='w-4 h-4' />
									</>
								)}
							</motion.button>
							<p className='text-xs text-gray-500 uppercase tracking-widest'>
								Resume is available whenever you return.
							</p>
						</motion.div>
					</div>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.3 }}
						className='hidden lg:flex flex-col items-center gap-4 w-72'
					>
						<div className='rounded-xl bg-[#0d1117] border border-teal-500/20 px-4 py-2 flex items-center gap-2 self-end'>
							<span className='w-2 h-2 rounded-full bg-green-400' />
							<span className='text-xs text-gray-300 font-mono'>
								CORE_OS V.4.2
							</span>
						</div>

						<div className='flex-1 flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-[#0f1a2e] to-[#0d1117] border border-teal-500/10 p-6 w-full'>
							<div className='w-24 h-24 rounded-2xl border-2 border-teal-500/30 bg-teal-500/10 flex items-center justify-center mb-4'>
								<Radar className='w-10 h-10 text-teal-400' />
							</div>
							<h4 className='text-sm font-bold text-white mb-1'>
								Neural Link Active
							</h4>
							<p className='text-xs text-gray-500 text-center'>
								Save-and-continue is enabled. Your answers
								persist across sessions.
							</p>
						</div>
					</motion.div>
				</div>
			</div>
		</motion.div>
	)
}

// ─── Questions State ────────────────────────────────────────────────────────
function QuestionsState({
	flat,
	currentIndex,
	selectedOptionId,
	saving,
	submitting,
	error,
	onSelect,
	onPrev,
	onNext,
	onSaveAndExit,
}: {
	flat: FlatQuestion[]
	currentIndex: number
	selectedOptionId: string | null
	saving: boolean
	submitting: boolean
	error: string | null
	onSelect: (optionId: string) => void
	onPrev: () => void
	onNext: () => void
	onSaveAndExit: () => void
}) {
	const total = flat.length
	const current = flat[currentIndex]
	const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0
	const isLast = currentIndex === total - 1

	if (!current) return null

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='space-y-6 max-w-full'
		>
			<div className='rounded-2xl bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border border-white/5 p-6 md:p-10'>
				<div className='flex flex-wrap items-start justify-between gap-4 mb-2'>
					<div>
						<p className='text-[10px] font-bold uppercase tracking-widest text-teal-400 mb-1'>
							Strategic Scan
						</p>
						<p className='text-xl font-bold text-white'>
							Assessment in progress
						</p>
					</div>
					<div className='text-right'>
						<p className='text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1'>
							Progress
						</p>
						<p className='text-sm text-gray-300'>
							<span className='font-bold text-orange-400'>
								{Math.round(progress)}%
							</span>{' '}
							complete
						</p>
					</div>
				</div>

				<div className='h-1 rounded-full bg-white/10 mb-8 overflow-hidden'>
					<motion.div
						className='h-full rounded-full bg-gradient-to-r from-blue-500 via-teal-400 to-teal-300 transition-all duration-500'
						animate={{ width: `${progress}%` }}
					/>
				</div>

				<AnimatePresence mode='wait'>
					<motion.div
						key={current.question.id}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<h2 className='text-2xl md:text-3xl font-bold text-white leading-tight mb-8'>
							{current.question.questionText}
						</h2>

						<div className='space-y-3 mb-8'>
							{current.question.options
								.slice()
								.sort((a, b) => a.displayOrder - b.displayOrder)
								.map((opt) => {
									const isSelected =
										selectedOptionId === opt.id
									return (
										<motion.button
											whileHover={
												!saving && !submitting
													? { scale: 1.01 }
													: {}
											}
											whileTap={
												!saving && !submitting
													? { scale: 0.99 }
													: {}
											}
											key={opt.id}
											onClick={() => onSelect(opt.id)}
											disabled={saving || submitting}
											className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition disabled:cursor-not-allowed ${
												isSelected
													? 'border-teal-400 bg-teal-400/10'
													: 'border-white/10 bg-[#161b22] hover:border-white/20'
											}`}
										>
											<span
												className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
													isSelected
														? 'bg-teal-400 text-gray-900'
														: 'bg-[#243044] text-gray-400'
												}`}
											>
												{opt.optionLabel}
											</span>
											<span
												className={`text-sm font-medium ${
													isSelected
														? 'text-white font-bold'
														: 'text-gray-300'
												}`}
											>
												{opt.optionText}
											</span>
											{isSelected && (
												<CheckCircle className='w-5 h-5 text-teal-400 ml-auto flex-shrink-0' />
											)}
										</motion.button>
									)
								})}
						</div>
					</motion.div>
				</AnimatePresence>

				{error && (
					<div className='mb-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300'>
						{error}
					</div>
				)}

				<div className='flex flex-wrap items-center justify-between gap-3'>
					<button
						onClick={onPrev}
						disabled={currentIndex === 0 || saving || submitting}
						className='flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-white/10 text-white hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed'
					>
						<ArrowLeft className='w-4 h-4' /> Previous
					</button>

					<button
						onClick={onSaveAndExit}
						disabled={saving || submitting}
						className='flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-white/10 text-gray-300 hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed'
					>
						<Save className='w-4 h-4' /> Save &amp; Exit
					</button>

					<button
						onClick={onNext}
						disabled={!selectedOptionId || saving || submitting}
						className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition ${
							selectedOptionId && !saving && !submitting
								? 'bg-orange-500 hover:bg-orange-600 text-white'
								: 'bg-orange-500/40 text-gray-300 cursor-not-allowed'
						}`}
					>
						{submitting ? (
							<>
								<Loader className='w-4 h-4 animate-spin' />{' '}
								Submitting...
							</>
						) : saving ? (
							<>
								<Loader className='w-4 h-4 animate-spin' />{' '}
								Saving...
							</>
						) : isLast ? (
							<>
								Submit Assessment{' '}
								<CheckCircle className='w-4 h-4' />
							</>
						) : (
							<>
								Next Question <ArrowRight className='w-4 h-4' />
							</>
						)}
					</button>
				</div>
			</div>
		</motion.div>
	)
}

// ─── Processing State ───────────────────────────────────────────────────────
function ProcessingState() {
	const [progress, setProgress] = useState(0)

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((prev) => (prev >= 100 ? 100 : prev + 0.5))
		}, 50)
		return () => clearInterval(interval)
	}, [])

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className='space-y-6 max-w-full'
		>
			<div className='relative rounded-2xl bg-gradient-to-b from-[#0a1628] via-[#0d1117] to-[#0d1117] border border-white/5 overflow-hidden min-h-[60vh] flex flex-col items-center justify-center p-6 md:p-10'>
				<div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
					<div className='w-64 h-64 rounded-full bg-teal-500/10 blur-3xl animate-pulse' />
				</div>

				<div className='relative z-10 flex flex-col items-center mb-8'>
					<div className='relative w-48 h-48 md:w-56 md:h-56'>
						<div className='absolute inset-0 rounded-full border-2 border-dashed border-teal-500/20 animate-[spin_20s_linear_infinite]' />
						<div className='absolute inset-6 rounded-full bg-gradient-to-br from-teal-900/50 via-blue-900/50 to-purple-900/50 border border-teal-500/20 flex items-center justify-center'>
							<div className='w-16 h-16 rounded-full bg-gradient-to-br from-teal-400/30 to-blue-500/30 flex items-center justify-center'>
								<Radar className='w-8 h-8 text-white animate-pulse' />
							</div>
						</div>
					</div>
					<p className='text-[10px] text-teal-400 uppercase tracking-widest mt-2 font-mono'>
						Synthesizing Diagnostic
					</p>
				</div>

				<div className='relative z-10 text-center max-w-lg'>
					<h2 className='text-2xl md:text-3xl font-bold text-white mb-2'>
						Strategic Scan
					</h2>
					<p className='text-gray-400 text-sm mb-6'>
						Routing you to the next step...
					</p>
					<div className='h-2 rounded-full bg-white/5 mb-2 overflow-hidden'>
						<motion.div
							className='h-full rounded-full bg-gradient-to-r from-blue-500 via-teal-400 to-teal-300'
							animate={{ width: `${progress}%` }}
							transition={{ duration: 0.1 }}
						/>
					</div>
					<div className='flex justify-between text-xs'>
						<span className='text-gray-500 font-mono'>
							PROCESSING
						</span>
						<span className='text-teal-400 font-mono'>
							{progress.toFixed(0)}% COMPLETE
						</span>
					</div>
				</div>
			</div>
		</motion.div>
	)
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function StrategicScanPage() {
	const router = useRouter()
	const [scanState, setScanState] = useState<ScanState>('landing')
	const [sessionId, setSessionId] = useState<string | null>(null)
	const [pillars, setPillars] = useState<Phase2APillar[]>([])
	const [answers, setAnswers] = useState<Record<string, string>>({})
	const [currentIndex, setCurrentIndex] = useState(0)
	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [resultData, setResultData] = useState<GetResultResponse | null>(null)
	// `me.profileComplete` tells us whether the user has a resolved businessSize
	// (today: staffSize set). The backend refuses Phase 2A start without it; we
	// mirror that in the UI so the CTA reads as gated rather than failing late.
	const [me, setMe] = useState<MeUser | null>(null)

	const flat = useMemo(() => flattenPillars(pillars), [pillars])

	useEffect(() => {
		let cancelled = false
		;(async () => {
			const res = await getMe()
			if (cancelled) return
			if (res.data) setMe(res.data.user)
		})()
		return () => {
			cancelled = true
		}
	}, [])

	const loadResult = useCallback(async (id: string) => {
		const res = await authFetch(`/result/${id}`)
		const data = await res.json().catch(() => ({}))

		if (res.status === 409) {
			return { status: 409 as const, data: null }
		}

		if (!res.ok) {
			throw new Error(data.message || 'Failed to load diagnostic result')
		}

		if (!isResultResponse(data)) {
			throw new Error('Diagnostic result payload is incomplete.')
		}

		return { status: 200 as const, data }
	}, [])

	const waitForResult = useCallback(
		async (id: string) => {
			for (let attempt = 0; attempt < 20; attempt += 1) {
				const response = await loadResult(id)
				if (response.status === 200 && response.data) {
					return response.data
				}
				await new Promise((resolve) => {
					setTimeout(resolve, 1200)
				})
			}
			throw new Error(
				'Your diagnostic is still processing. Please reopen Strategic Scan shortly.',
			)
		},
		[loadResult],
	)

	const loadQuestions = useCallback(async (id: string) => {
		const res = await authFetch(`/questions/phase2a?sessionId=${id}`)
		const data = await res.json().catch(() => ({}))
		if (!res.ok) {
			throw new Error(data.message || 'Failed to load Phase 2A questions')
		}

		const loadedPillars = (data.pillars || []) as Phase2APillar[]
		setPillars(loadedPillars)

		const seeded: Record<string, string> = {}
		loadedPillars.forEach((pillar) => {
			pillar.questions.forEach((q) => {
				if (q.answered && q.selectedOptionId) {
					seeded[q.id] = q.selectedOptionId
				}
			})
		})
		setAnswers(seeded)

		const flatQuestions = flattenPillars(loadedPillars)
		const firstUnansweredIndex = flatQuestions.findIndex(
			(item) => !seeded[item.question.id],
		)
		setCurrentIndex(firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex)
	}, [])

	const handleStart = useCallback(async () => {
		setError(null)

		if (!getAccessToken()) {
			setError('You need to be signed in to start the full diagnostic.')
			router.push('/Auth/login')
			return
		}

		// Mirror the BE gate — see assessment.service Phase 2A start.
		if (me && !me.profileComplete) {
			setError(
				'Complete your business profile (staff size) before starting Phase 2A.',
			)
			return
		}

		setLoading(true)
		try {
			const startRes = await authFetch('/assessment/phase2a/start', {
				method: 'POST',
				body: JSON.stringify({}),
			})
			const startData = await startRes.json().catch(() => ({}))
			if (!startRes.ok) {
				throw new Error(
					startData.message || 'Failed to start Phase 2A session',
				)
			}

			const newSessionId = startData.sessionId as string
			setSessionId(newSessionId)
			setLastSessionId(newSessionId)

			await loadQuestions(newSessionId)
			setScanState('questions')
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Something went wrong',
			)
		} finally {
			setLoading(false)
		}
	}, [loadQuestions, me, router])

	const handleSelect = useCallback(
		async (optionId: string) => {
			if (!sessionId) return
			const current = flat[currentIndex]
			if (!current) return

			const previous = answers[current.question.id]
			setAnswers((prev) => ({ ...prev, [current.question.id]: optionId }))
			setError(null)
			setSaving(true)

			try {
				const res = await authFetch(`/assessment/${sessionId}/answer`, {
					method: 'POST',
					body: JSON.stringify({
						questionId: current.question.id,
						selectedOptionId: optionId,
					}),
				})
				const data = await res.json().catch(() => ({}))
				if (!res.ok) {
					throw new Error(data.message || 'Failed to save answer')
				}
			} catch (err) {
				setAnswers((prev) => {
					const next = { ...prev }
					if (previous) {
						next[current.question.id] = previous
					} else {
						delete next[current.question.id]
					}
					return next
				})
				setError(
					err instanceof Error
						? err.message
						: 'Failed to save answer',
				)
			} finally {
				setSaving(false)
			}
		},
		[answers, currentIndex, flat, sessionId],
	)

	const handlePrev = useCallback(() => {
		setCurrentIndex((idx) => Math.max(0, idx - 1))
		setError(null)
	}, [])

	const handleSubmit = useCallback(async () => {
		if (!sessionId) return
		setError(null)
		setSubmitting(true)
		try {
			const res = await authFetch(`/assessment/${sessionId}/submit`, {
				method: 'POST',
				body: JSON.stringify({}),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok) {
				throw new Error(data.message || 'Failed to submit assessment')
			}

			setScanState('processing')
			const result = await waitForResult(sessionId)
			await new Promise((r) => setTimeout(r, 1000))
			router.push(`/dashboard/reports/${result.result.sessionId}`)
		} catch (err) {
			setScanState('questions')
			setError(
				err instanceof Error
					? err.message
					: 'Failed to submit assessment',
			)
		} finally {
			setSubmitting(false)
		}
	}, [sessionId, waitForResult])

	const handleNext = useCallback(() => {
		if (currentIndex < flat.length - 1) {
			setCurrentIndex((idx) => idx + 1)
			setError(null)
		} else {
			handleSubmit()
		}
	}, [currentIndex, flat.length, handleSubmit])

	const handleSaveAndExit = useCallback(() => {
		router.push('/dashboard')
	}, [router])

	const handleDownloadPdf = useCallback(async () => {
		if (!resultData) return
		const sid = resultData.result.sessionId
		// Always attempt the download — the BE now consumes a subscription
		// Phase 2A slot at download time when one is available, so a result
		// that's flagged paywalled by /result GET can still settle for free
		// on /result/:id/pdf if the user is a subscriber with open quota.
		// Only fall back to the paid checkout if the BE returns 402/403.
		try {
			const token = getAccessToken()
			const headers: Record<string, string> = {}
			if (token) headers.Authorization = `Bearer ${token}`
			const res = await fetch(`${API_BASE}/result/${sid}/pdf`, {
				headers,
			})
			if (!res.ok) {
				if (res.status === 402 || res.status === 403) {
					router.push(
						`/dashboard/subscription?sessionId=${sid}&autoCheckout=1`,
					)
					return
				}
				const body = await res.json().catch(() => ({}))
				throw new Error(body.message || 'Failed to download report')
			}
			const blob = await res.blob()
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			const dispo = res.headers.get('Content-Disposition') || ''
			const match = /filename="?([^"]+)"?/.exec(dispo)
			a.download = match?.[1] || `pica-report-${sid}.pdf`
			document.body.appendChild(a)
			a.click()
			a.remove()
			URL.revokeObjectURL(url)
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'Failed to download report',
			)
		}
	}, [resultData, router])

	const handleDeepDive = useCallback(() => {
		router.push('/dashboard/deep-dive')
	}, [router])

	const handleStartAnotherScan = useCallback(() => {
		setResultData(null)
		setPillars([])
		setAnswers({})
		setCurrentIndex(0)
		setError(null)
		setSessionId(null)
		setScanState('landing')
	}, [])

	if (scanState === 'questions' && flat.length > 0) {
		const current = flat[currentIndex]
		return (
			<QuestionsState
				flat={flat}
				currentIndex={currentIndex}
				selectedOptionId={answers[current.question.id] || null}
				saving={saving}
				submitting={submitting}
				error={error}
				onSelect={handleSelect}
				onPrev={handlePrev}
				onNext={handleNext}
				onSaveAndExit={handleSaveAndExit}
			/>
		)
	}

	if (scanState === 'processing') {
		return <ProcessingState />
	}

	// Until /auth/me resolves, default to "complete" so we don't briefly grey
	// out the CTA for users whose profile is fine.
	const profileIncomplete = me ? !me.profileComplete : false

	return (
		<AnimatePresence mode='wait'>
			<LandingState
				key='landing'
				onStart={handleStart}
				loading={loading}
				error={error}
				profileIncomplete={profileIncomplete}
			/>
		</AnimatePresence>
	)
}
