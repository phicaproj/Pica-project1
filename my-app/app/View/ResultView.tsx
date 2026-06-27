'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import {
	Download,
	Loader,
	AlertTriangle,
	Sparkles,
	Shield,
	Radar,
	ArrowRight,
	Presentation,
} from 'lucide-react'

const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	'https://pica-project1.onrender.com/api'

type ColorBand = 'RED' | 'AMBER' | 'GREEN'

interface Finding {
	optionId: string
	questionText: string
	selectedLabel: string
	observation: string
	recommendation: string
	riskType: string
	score: number
}

interface PillarMeta {
	id: string
	code: string
	name: string
	description: string | null
	displayOrder: number
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
	phase?: string
	totalScore: number
	colorBand: ColorBand
	hasAnyKnockout: boolean
	knockoutQuestionIds: string[]
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

function normalizeColorBand(value: unknown): ColorBand {
	if (typeof value !== 'string') return 'AMBER'
	const normalized = value.trim().toUpperCase()
	if (normalized === 'GREEN' || normalized === 'AMBER' || normalized === 'RED') {
		return normalized
	}
	if (normalized === 'YELLOW') return 'AMBER'
	return 'AMBER'
}

function isResultResponse(value: unknown): value is GetResultResponse {
	if (!value || typeof value !== 'object') return false
	const candidate = value as {
		message?: unknown
		result?: { pillarScores?: unknown; totalScore?: unknown } | null
	}
	return (
		!!candidate.result &&
		typeof candidate.result.totalScore === 'number' &&
		Array.isArray(candidate.result.pillarScores)
	)
}

export default function ResultPage() {
	const { dark } = useTheme()
	const d = dark
	const searchParams = useSearchParams()
	const sessionId = searchParams.get('sessionId')

	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [resultData, setResultData] = useState<GetResultResponse | null>(null)
	const [downloadMode, setDownloadMode] = useState<'standard' | 'presentation' | null>(null)

	const loadResult = useCallback(async () => {
		if (!sessionId) {
			setError('No assessment session was provided.')
			setLoading(false)
			return
		}
		setLoading(true)
		setError(null)
		try {
			const res = await fetch(`${API_BASE}/result/${sessionId}`)
			const data = await res.json().catch(() => ({}))
			if (!res.ok) {
				throw new Error(data.message || 'Failed to load your result')
			}
			if (!isResultResponse(data)) {
				throw new Error('Result payload is incomplete.')
			}
			setResultData(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Something went wrong')
		} finally {
			setLoading(false)
		}
	}, [sessionId])

	useEffect(() => {
		loadResult()
	}, [loadResult])

	const handleDownloadPdf = useCallback(async (mode: 'standard' | 'presentation' = 'standard') => {
		if (!sessionId) return
		setDownloadMode(mode)
		try {
			const query = mode === 'presentation' ? '?theme=dark' : ''
			const res = await fetch(`${API_BASE}/result/${sessionId}/pdf${query}`)
			if (!res.ok) {
				const body = await res.json().catch(() => ({}))
				throw new Error(body.message || 'Failed to download report')
			}
			const blob = await res.blob()
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			const dispo = res.headers.get('Content-Disposition') || ''
			const match = /filename="?([^"]+)"?/.exec(dispo)
			a.download = match?.[1] || `pica-report-${sessionId}.pdf`
			document.body.appendChild(a)
			a.click()
			a.remove()
			URL.revokeObjectURL(url)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to download report')
		} finally {
			setDownloadMode(null)
		}
	}, [sessionId])

	if (loading) {
		return (
			<div
				className={`min-h-screen flex items-center justify-center ${d ? 'bg-[#0d1117]' : 'bg-gray-50'}`}
			>
				<div className='flex flex-col items-center gap-3 text-gray-400'>
					<Loader className='w-7 h-7 animate-spin text-[#f97316]' />
					<p className='text-sm'>Loading your result...</p>
				</div>
			</div>
		)
	}

	if (error || !resultData) {
		return (
			<div
				className={`min-h-screen flex items-center justify-center px-4 ${d ? 'bg-[#0d1117]' : 'bg-gray-50'}`}
			>
				<div className='flex flex-col items-center gap-3 text-center max-w-md'>
					<AlertTriangle className='w-10 h-10 text-rose-400 mb-2' />
					<h2
						className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}
					>
						Failed to load result
					</h2>
					<p className='text-sm text-gray-400'>{error || 'Result not found.'}</p>
					<Link
						href='/pages/freescan'
						className='mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-gray-900 text-sm font-bold transition'
					>
						Back to Free Scan
					</Link>
				</div>
			</div>
		)
	}

	const { result } = resultData
	const pillarScores = result.pillarScores
		.slice()
		.sort((a, b) => a.pillar.displayOrder - b.pillar.displayOrder)
	const totalScore = Math.round(result.totalScore)
	const weakestPillar = pillarScores
		.slice()
		.sort((a, b) => a.weightedScore - b.weightedScore)[0]
	const headlineFinding =
		weakestPillar?.findings.find(
			(item) => item.observation || item.recommendation,
		) ??
		weakestPillar?.findings[0] ??
		null

	return (
		<div
			className={`min-h-screen px-4 sm:px-6 md:px-10 py-10 md:py-14 ${d ? 'bg-[#0d1117]' : 'bg-gray-50'}`}
		>
			<div className='max-w-5xl mx-auto space-y-6'>
				{/* Hero */}
				<section className='relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0e2b2b] via-[#111827] to-[#19132b]'>
					<div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_36%),radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_34%)]' />
					<div className='relative z-10 grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[280px,1fr] lg:items-center'>
						<div className='flex justify-center'>
							<div className='relative flex h-44 w-44 flex-col items-center justify-center rounded-full border border-white/10 bg-[#07141b]/80 shadow-[0_0_40px_rgba(20,184,166,0.18)]'>
								<div className='absolute inset-[10px] rounded-full border-[6px] border-teal-300/90' />
								<p className='relative text-5xl font-black text-white'>
									{totalScore}%
								</p>
								<p className='relative mt-1 text-[11px] font-bold uppercase tracking-[0.28em] text-teal-200'>
									Complete
								</p>
							</div>
						</div>

						<div className='min-w-0'>
							<h1 className='text-3xl font-extrabold text-white md:text-5xl'>
								Your Snapshot is{' '}
								<span className='text-orange-400'>Ready.</span>
							</h1>
							<p className='mt-4 max-w-2xl text-sm leading-7 text-gray-300 md:text-base'>
								Your free assessment has been synthesized into a
								performance snapshot. Review the markers below, and
								download your full PDF report — a copy has also been sent
								to your email.
							</p>

							<div className='mt-6 flex flex-wrap gap-3'>
								<button
									onClick={() => handleDownloadPdf('standard')}
									disabled={downloadMode !== null}
									className='inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50'
								>
									{downloadMode === 'standard' ? (
										<>
											<Loader className='h-4 w-4 animate-spin' />{' '}
											Preparing...
										</>
									) : (
										<>
											<Download className='h-4 w-4' /> Download PDF
										</>
									)}
								</button>
								<button
									onClick={() => handleDownloadPdf('presentation')}
									disabled={downloadMode !== null}
									className='inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
								>
									{downloadMode === 'presentation' ? (
										<>
											<Loader className='h-4 w-4 animate-spin' />{' '}
											Preparing Presentation...
										</>
									) : (
										<>
											<Presentation className='h-4 w-4' /> Presentation PDF
										</>
									)}
								</button>
								<Link
									href='/pages/pricing'
									className='inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10'
								>
									Explore Full Diagnostic
									<ArrowRight className='h-4 w-4' />
								</Link>
							</div>
						</div>
					</div>
				</section>

				{/* AI Pulse Insight */}
				<section className='rounded-3xl border border-teal-500/30 bg-[#101c23] px-6 py-6 shadow-[0_0_30px_rgba(13,148,136,0.08)]'>
					<div className='flex items-start justify-between gap-4'>
						<div className='flex items-start gap-4'>
							<div className='flex h-11 w-11 items-center justify-center rounded-full bg-teal-500/15'>
								<Sparkles className='h-5 w-5 text-teal-300' />
							</div>
							<div>
								<h2 className='text-lg font-bold text-white'>
									Key Insight
								</h2>
								<p className='mt-2 max-w-3xl text-sm leading-7 text-gray-300'>
									{headlineFinding
										? `"${headlineFinding.observation || headlineFinding.recommendation}"`
										: 'We detected performance signals across your operating model. Download the full report to review detailed findings and recommended actions.'}
								</p>
								{weakestPillar && (
									<p className='mt-2 text-xs uppercase tracking-[0.2em] text-teal-300'>
										Focus area: {weakestPillar.pillar.name}
									</p>
								)}
							</div>
						</div>
						<Shield className='hidden h-10 w-10 text-white/20 lg:block' />
					</div>
				</section>

				{/* Pillar Breakdown */}
				<section>
					<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
						<h2 className='text-xl font-bold text-white'>
							Pillar Breakdown
						</h2>
					</div>

					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
						{pillarScores.map((pillarScore) => {
							const band = normalizeColorBand(pillarScore.colorBand)
							const status = COLOR_BAND_TO_STATUS[band]
							const score = Math.round(pillarScore.weightedScore)
							return (
								<div
									key={pillarScore.id}
									className={`rounded-2xl border bg-[#0f1722] p-5 transition hover:-translate-y-1 hover:shadow-lg ${
										band === 'RED'
											? 'border-rose-400/30 shadow-[0_0_30px_rgba(244,63,94,0.08)]'
											: 'border-white/5'
									}`}
								>
									<div className='mb-5 flex items-center justify-between gap-3'>
										<Radar className='h-4 w-4 text-gray-400' />
										<span
											className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${status.pill}`}
										>
											{status.label}
										</span>
									</div>
									<p className='text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500'>
										{pillarScore.pillar.name}
									</p>
									<p className='mt-3 text-4xl font-black text-white'>
										{score}
										<span className='ml-1 text-lg text-gray-500'>
											%
										</span>
									</p>
									<div className='mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden'>
										<div
											className={`h-full rounded-full ${status.bar}`}
											style={{ width: `${score}%` }}
										/>
									</div>
								</div>
							)
						})}
					</div>
				</section>
			{downloadMode !== null && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="w-full max-w-sm rounded-2xl border border-teal-500/20 bg-[#0d161c]/90 p-6 text-center shadow-2xl shadow-teal-500/10">
						<div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/10">
							<span className="absolute inset-0 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" />
							<Download className="h-6 w-6 text-teal-400 animate-pulse" />
						</div>
						<h3 className="text-lg font-bold text-white mb-2">
							{downloadMode === 'presentation' ? "Generating Presentation PDF" : "Generating Report PDF"}
						</h3>
						<p className="text-sm text-teal-300/70 mb-4">
							{downloadMode === 'presentation' 
								? "Please wait while we render your dark-themed presentation report..."
								: "Please wait while we aggregate the diagnostics and render your A4 report..."}
						</p>
						
						{/* Animated progress track */}
						<div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
							<div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full progress-bar-fill" />
						</div>
					</div>
					<style dangerouslySetInnerHTML={{ __html: `
						@keyframes progressFill {
							0% { width: 0%; }
							100% { width: 95%; }
						}
						.progress-bar-fill {
							animation: progressFill 4s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
						}
					` }} />
				</div>
			)}
			</div>
		</div>
	)
}
