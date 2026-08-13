'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getPhaseLabel } from '@/lib/phaseLabels'
import {
	Search,
	ArrowRight,
	CheckCircle2,
	Radar,
	FileText,
	Lock,
	RotateCcw,
	Sparkles,
	Shield,
	Loader,
	Download,
	AlertTriangle,
} from 'lucide-react'
import {
	AuthUser,
	getAccessToken,
	getLastSessionId,
	getMe,
	getStoredUser,
	type MeUser,
} from '@/lib/authClient'
import { useTheme } from '@/components/ThemeContext'

const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE_URL ||
	'https://pica-project1.onrender.com/api'

type ColorBand = 'RED' | 'AMBER' | 'GREEN'

type Phase = 'PHASE1' | 'PHASE2A' | 'PHASE2B'

function phaseDisplayName(res: ResultPayload): string {
	if (res.phase === 'PHASE2B') {
		return res.pillarScores?.[0]?.pillar?.name || getPhaseLabel(res.phase)
	}
	return getPhaseLabel(res.phase)
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
	phase: Phase
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

type DashboardState =
	| 'loading'
	| 'empty'
	| 'in-progress'
	| 'in-progress-active'
	| 'active'
	| 'error'

const COLOR_BAND_TO_RISK: Record<ColorBand, { label: string; color: string }> =
	{
		GREEN: { label: 'Low', color: 'text-green-400' },
		AMBER: { label: 'Moderate', color: 'text-yellow-400' },
		RED: { label: 'High', color: 'text-red-400' },
	}

const COLOR_BAND_TO_BAR: Record<ColorBand, string> = {
	GREEN: 'bg-green-400',
	AMBER: 'bg-yellow-400',
	RED: 'bg-red-400',
}

const COLOR_BAND_TO_STATUS: Record<ColorBand, { label: string; pill: string }> =
	{
		GREEN: { label: 'Healthy', pill: 'bg-green-500/20 text-green-400' },
		AMBER: { label: 'Watch', pill: 'bg-yellow-500/20 text-yellow-400' },
		RED: { label: 'Attention', pill: 'bg-red-500/20 text-red-400' },
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

function formatDate(iso: string | null) {
	if (!iso) return '—'
	try {
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	} catch {
		return '—'
	}
}

function isResultResponse(value: unknown): value is GetResultResponse {
	if (!value || typeof value !== 'object') return false
	const candidate = value as {
		message?: unknown
		paywalled?: unknown
		result?: { pillarScores?: unknown } | null
	}

	return (
		typeof candidate.message === 'string' &&
		typeof candidate.paywalled === 'boolean' &&
		!!candidate.result &&
		Array.isArray(candidate.result.pillarScores)
	)
}

// ─── Loading / Error / In-progress shells ───────────────────────────────────
function LoadingState() {
	const { dark: d } = useTheme();
	return (
		<div className='min-h-[60vh] flex items-center justify-center'>
			<div className={`flex flex-col items-center gap-3 ${d ? 'text-gray-400' : 'text-gray-600'}`}>
				<Loader className={`w-7 h-7 animate-spin ${d ? 'text-teal-400' : 'text-teal-600'}`} />
				<p className='text-sm'>Loading your latest scan...</p>
			</div>
		</div>
	)
}

function ErrorState({ message }: { message: string }) {
	const { dark: d } = useTheme();
	return (
		<div className={`rounded-2xl ${d ? 'bg-[#111827]' : 'bg-white'} border ${d ? 'border-red-500/30' : 'border-red-200'} p-10 text-center max-w-2xl mx-auto`}>
			<div className={`w-16 h-16 rounded-full ${d ? 'bg-red-500/10' : 'bg-red-50'} flex items-center justify-center mx-auto mb-4`}>
				<AlertTriangle className={`w-7 h-7 ${d ? 'text-red-400' : 'text-red-600'}`} />
			</div>
			<h3 className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>
				Couldn&apos;t load your dashboard
			</h3>
			<p className={`${d ? 'text-gray-400' : 'text-gray-600'} text-sm max-w-md mx-auto mb-4`}>
				{message}
			</p>
			<button
				onClick={() => window.location.reload()}
				className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-semibold transition ${d ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'}`}
			>
				Retry
			</button>
		</div>
	)
}

function InProgressState() {
	const { dark: d } = useTheme();
	return (
		<div className={`rounded-2xl ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200'} border p-10 text-center max-w-2xl mx-auto`}>
			<div className={`w-16 h-16 rounded-full ${d ? 'bg-teal-500/10' : 'bg-teal-50'} flex items-center justify-center mx-auto mb-4`}>
				<RotateCcw className={`w-7 h-7 ${d ? 'text-teal-400' : 'text-teal-600'}`} />
			</div>
			<h3 className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>
				Your scan is still in progress
			</h3>
			<p className={`${d ? 'text-gray-400' : 'text-gray-600'} text-sm max-w-md mx-auto mb-4`}>
				Pick up where you left off — your answers have been saved
				automatically.
			</p>
			<Link
				href='/dashboard/strategic-scan'
				className='inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition'
			>
				Resume Scan <ArrowRight className='w-4 h-4' />
			</Link>
		</div>
	)
}

// ─── Empty State ────────────────────────────────────────────────────────────
function EmptyState({ user }: { user: AuthUser | null }) {
	const { dark: d } = useTheme();
	const greeting = user?.businessName ? `, ${user.businessName}` : ''
	return (
		<div className='space-y-6 max-w-full'>
			<div className={`relative rounded-2xl ${d ? 'bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border-white/5' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200'} overflow-hidden p-6 md:p-10 border`}>
				<div className='absolute right-0 top-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none' />
				<div className='absolute right-20 bottom-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none' />

				<div className='relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6'>
					<div className='flex-1 min-w-0'>
						<span className={`inline-block px-3 py-1 rounded-full ${d ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'} text-[10px] font-bold uppercase tracking-wider mb-4`}>
							New Workspace Activated
						</span>
						<h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${d ? 'text-white' : 'text-gray-900'} leading-tight mb-4`}>
							Welcome to{' '}
							<span className={d ? 'text-orange-400' : 'text-orange-600'}>PICA</span>
							{greeting}
						</h1>
						<p className={`${d ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base max-w-lg mb-6`}>
							Unlock architectural precision in your business
							strategy. Run your first Strategic Scan to see your
							overall score, per-pillar breakdown, and AI
							insights.
						</p>
						<div className='flex flex-wrap gap-3'>
							<Link
								href='/dashboard/strategic-scan'
								className='inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition'
							>
								Start Your First Strategic Scan
								<Sparkles className='w-4 h-4' />
							</Link>
						</div>
					</div>

					<div className={`hidden lg:flex items-center justify-center w-52 h-40 rounded-xl bg-gradient-to-br ${d ? 'from-teal-500/10 to-purple-500/10 border-white/5' : 'from-teal-50 to-purple-50 border-gray-200'} border`}>
						<div className={`w-20 h-20 rounded-lg ${d ? 'bg-teal-500/20 border-teal-500/30' : 'bg-teal-100 border-teal-200'} border flex items-center justify-center`}>
							<Radar className={`w-8 h-8 ${d ? 'text-teal-400' : 'text-teal-600'}`} />
						</div>
					</div>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				<div className={`lg:col-span-2 rounded-2xl ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200'} border p-6`}>
					<div className='flex items-start gap-3 mb-4'>
						<div className={`w-10 h-10 rounded-lg ${d ? 'bg-teal-500/20' : 'bg-teal-50'} flex items-center justify-center flex-shrink-0`}>
							<Search className={`w-5 h-5 ${d ? 'text-teal-400' : 'text-teal-600'}`} />
						</div>
						<div>
							<h3 className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
								Identify Pain Points
							</h3>
							<p className={`${d ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1`}>
								The Strategic Scan analyzes 7 pillars across 70
								calibrated questions to find inefficiencies
								before they become liabilities.
							</p>
						</div>
					</div>
				</div>

				<div className={`rounded-2xl ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200'} border p-6 relative overflow-hidden`}>
					<span className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${d ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-700'}`}>
						Coming Soon
					</span>
					<div className='flex items-center gap-3 mb-3'>
						<div className={`w-10 h-10 rounded-lg ${d ? 'bg-purple-500/20' : 'bg-purple-50'} flex items-center justify-center`}>
							<Sparkles className={`w-5 h-5 ${d ? 'text-purple-400' : 'text-purple-600'}`} />
						</div>
					</div>
					<h3 className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>
						Predictive Insights
					</h3>
					<p className={`text-xs ${d ? 'text-gray-500' : 'text-gray-600'}`}>
						Automated intelligence gathering based on your first
						scan.
					</p>
				</div>
			</div>

			<div className={`rounded-2xl ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200'} border p-10 text-center`}>
				<div className={`w-16 h-16 rounded-full ${d ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center mx-auto mb-4`}>
					<RotateCcw className={`w-7 h-7 ${d ? 'text-gray-500' : 'text-gray-400'}`} />
				</div>
				<h3 className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'} mb-2`}>
					No Scan Activity Yet
				</h3>
				<p className={`${d ? 'text-gray-400' : 'text-gray-600'} text-sm max-w-md mx-auto mb-4`}>
					Your strategic journey begins here. Complete your first scan
					to see results, recommendations, and comparative data.
				</p>
				<Link
					href='/dashboard/strategic-scan'
					className={`inline-flex items-center gap-1 ${d ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'} text-sm font-bold uppercase tracking-wide transition`}
				>
					Learn How It Works <ArrowRight className='w-4 h-4' />
				</Link>
			</div>
		</div>
	)
}

// ─── Active State ───────────────────────────────────────────────────────────
function ActiveState({
	data,
	user,
	allResults = [],
	inProgress = false,
}: {
	data: GetResultResponse
	user: AuthUser | null
	allResults?: GetResultResponse[]
	inProgress?: boolean
}) {
	const { dark: d } = useTheme();
	const router = useRouter()
	const { result, paywalled } = data
	const displayResults = allResults.length > 0 ? allResults : [data];
	const pillarScores = result.pillarScores
		.slice()
		.sort((a, b) => a.pillar.displayOrder - b.pillar.displayOrder)

	const totalScore = Math.round(result.totalScore)
	const overallBand = normalizeColorBand(result.colorBand)
	const overallRisk = COLOR_BAND_TO_RISK[overallBand]
	const overallBar = COLOR_BAND_TO_BAR[overallBand]
	const overallStatus = COLOR_BAND_TO_STATUS[overallBand]
	const phaseLabel = phaseDisplayName(result)
	const totalFindings = pillarScores.reduce(
		(sum, p) => sum + (p.findings?.length ?? 0),
		0,
	)

	// Pull the lowest-scoring pillar's first finding for the AI insight card
	const weakestPillar = pillarScores
		.slice()
		.sort((a, b) => a.weightedScore - b.weightedScore)[0]
	const headlineFinding =
		weakestPillar && weakestPillar.findings.length > 0
			? weakestPillar.findings.find(
					(f) => f.observation || f.recommendation,
				) || weakestPillar.findings[0]
			: null

	const businessName = user?.businessName || 'there'
	const completionDate = formatDate(
		result.generatedAt || result.updatedAt || result.createdAt,
	)

	return (
		<div className='space-y-6 max-w-full'>
			{/* Greeting */}
			<div className={`relative rounded-2xl ${d ? 'bg-gradient-to-br from-[#111827] via-[#0f1a2e] to-[#0d1117] border-white/5' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200'} overflow-hidden p-6 md:p-10 border`}>
				<div className='absolute right-0 top-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none' />
				<div className='relative z-10'>
					<h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold ${d ? 'text-white' : 'text-gray-900'} leading-tight`}>
						Hello, {businessName}.
					</h1>
					<h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold ${d ? 'text-orange-400' : 'text-orange-600'} leading-tight`}>
						PICA is monitoring your performance.
					</h2>
					<p className={`${d ? 'text-gray-400' : 'text-gray-600'} text-sm mt-3`}>
						Your latest scan completed on {completionDate}.{' '}
						{paywalled
							? 'Unlock the full report to access detailed findings and the executive PDF.'
							: 'Explore your benchmarks and recommendations below.'}
					</p>
				</div>
			</div>

			{/* Resume / Paywall banner */}
			{inProgress ? (
				<div className={`rounded-2xl ${d ? 'bg-gradient-to-r from-teal-500/10 to-teal-500/5 border-teal-500/30' : 'bg-gradient-to-r from-teal-50 to-white border-teal-200'} border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
					<div className='flex items-start gap-3'>
						<div className={`w-10 h-10 rounded-lg ${d ? 'bg-teal-500/20' : 'bg-teal-100'} flex items-center justify-center flex-shrink-0`}>
							<RotateCcw className={`w-5 h-5 ${d ? 'text-teal-400' : 'text-teal-600'}`} />
						</div>
						<div>
							<p className={`text-sm font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
								You have a scan in progress
							</p>
							<p className={`text-xs ${d ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>
								Pick up where you left off — your answers are
								saved automatically.
							</p>
						</div>
					</div>
					<Link
						href='/dashboard/strategic-scan'
						className='flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition'
					>
						Resume Strategic Scan <ArrowRight className='w-4 h-4' />
					</Link>
				</div>
			) : paywalled ? (
				<div className={`rounded-2xl ${d ? 'bg-gradient-to-r from-orange-500/10 to-orange-500/5 border-orange-500/30' : 'bg-gradient-to-r from-orange-50 to-white border-orange-200'} border p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
					<div className='flex items-start gap-3'>
						<div className={`w-10 h-10 rounded-lg ${d ? 'bg-orange-500/20' : 'bg-orange-100'} flex items-center justify-center flex-shrink-0`}>
							<Lock className={`w-5 h-5 ${d ? 'text-orange-400' : 'text-orange-600'}`} />
						</div>
						<div>
							<p className={`text-sm font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
								Full diagnostic locked
							</p>
							<p className={`text-xs ${d ? 'text-gray-400' : 'text-gray-600'} mt-0.5`}>
								You&apos;ve completed all 70 questions. Unlock
								the full report to see findings,
								recommendations, and the executive PDF.
							</p>
						</div>
					</div>
					<Link
						href='/dashboard/subscription'
						className='flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition'
					>
						Unlock Report <ArrowRight className='w-4 h-4' />
					</Link>
				</div>
			) : null}

			{/* Stats + AI Insight */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
				<div className={`rounded-xl ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200'} border p-5`}>
					<p className={`text-[10px] ${d ? 'text-gray-500' : 'text-gray-500'} uppercase font-bold tracking-wider mb-2`}>
						Overall Score
					</p>
					<div className='flex items-end gap-2'>
						<p className={`text-3xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
							{totalScore}%
						</p>
						<span
							className={`text-xs ${overallRisk.color} mb-1 font-semibold uppercase`}
						>
							{overallBand}
						</span>
					</div>
					<div className={`mt-3 h-1.5 rounded-full ${d ? 'bg-white/5' : 'bg-gray-100'}`}>
						<div
							className={`h-full rounded-full ${overallBar}`}
							style={{ width: `${totalScore}%` }}
						/>
					</div>
				</div>

				<div className={`rounded-xl ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200'} border p-5`}>
					<p className={`text-[10px] ${d ? 'text-gray-500' : 'text-gray-500'} uppercase font-bold tracking-wider mb-2`}>
						Pillars Assessed
					</p>
					<div className='flex items-end gap-2'>
						<p className={`text-3xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
							{pillarScores.length}
							<span className={`text-base ${d ? 'text-gray-500' : 'text-gray-400'}`}>
								/{pillarScores.length}
							</span>
						</p>
					</div>
					<p className={`text-xs ${d ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
						All strategic pillars scored
					</p>
					<div className='flex gap-1.5 mt-3'>
						{pillarScores.map((p) => (
							<div
								key={p.id}
								className={`h-1.5 flex-1 rounded-full ${
									COLOR_BAND_TO_BAR[
										normalizeColorBand(p.colorBand)
									]
								}`}
							/>
						))}
					</div>
				</div>

				<div className={`rounded-xl ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200'} border p-5`}>
					<p className={`text-[10px] ${d ? 'text-gray-500' : 'text-gray-500'} uppercase font-bold tracking-wider mb-2`}>
						Risk Level
					</p>
					<div className='flex items-end gap-2'>
						<p
							className={`text-3xl font-bold ${overallRisk.color}`}
						>
							{overallRisk.label}
						</p>
						<Shield
							className={`w-4 h-4 ${overallRisk.color} mb-1`}
						/>
					</div>
					<p className={`text-xs ${d ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
						{result.hasAnyKnockout
							? 'Critical knockout flag detected'
							: 'No critical knockouts detected'}
					</p>
				</div>

				{/* AI Insight Pulse */}
				<div className={`rounded-xl ${d ? 'bg-[#111827] border-teal-500/20' : 'bg-white border-teal-200'} border p-5`}>
					<div className='flex items-center gap-2 mb-3'>
						<div className={`w-8 h-8 rounded-full ${d ? 'bg-teal-500/20' : 'bg-teal-50'} flex items-center justify-center`}>
							<Sparkles className={`w-4 h-4 ${d ? 'text-teal-400' : 'text-teal-600'}`} />
						</div>
						<h3 className={`text-sm font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
							AI Insight Pulse
						</h3>
					</div>
					{paywalled ? (
						<p className={`text-sm ${d ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
							Findings and AI recommendations unlock after
							payment. You&apos;ll see your weakest pillar,
							root-cause observations, and prioritized actions.
						</p>
					) : headlineFinding && weakestPillar ? (
						<p className={`text-sm ${d ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
							<strong className={d ? 'text-white' : 'text-gray-900'}>
								{weakestPillar.pillar.name}
							</strong>{' '}
							scored lowest.{' '}
							{headlineFinding.observation ||
								headlineFinding.recommendation}
						</p>
					) : (
						<p className={`text-sm ${d ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
							No critical findings flagged in this scan. Keep
							monitoring for changes.
						</p>
					)}
				</div>
			</div>

			{/* Pillar breakdown */}
			<div>
				<div className='flex items-center justify-between mb-4'>
					<h2 className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
						Pillar Breakdown
					</h2>
					{result.reportPdfUrl && (
						<a
							href={result.reportPdfUrl}
							target='_blank'
							rel='noopener noreferrer'
							className={`inline-flex items-center gap-1 ${d ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'} text-sm font-semibold transition`}
						>
							<Download className='w-4 h-4' /> Download Report
						</a>
					)}
				</div>
				<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
					{pillarScores.map((p) => {
						const pillarBand = normalizeColorBand(p.colorBand)
						const status = COLOR_BAND_TO_STATUS[pillarBand]
						const barColor = COLOR_BAND_TO_BAR[pillarBand]
						const score = Math.round(p.weightedScore)
						return (
							<div
								key={p.id}
								className={`rounded-xl ${d ? 'bg-[#111827]' : 'bg-white'} border p-4 ${
									pillarBand === 'RED'
										? (d ? 'border-red-400/30' : 'border-red-200')
										: (d ? 'border-white/5' : 'border-gray-200')
								}`}
							>
								<div className='flex items-center justify-between mb-3'>
									<Radar className={`w-4 h-4 ${d ? 'text-gray-400' : 'text-gray-500'}`} />
									<span
										className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${status.pill}`}
									>
										{status.label}
									</span>
								</div>
								<p className={`text-xs ${d ? 'text-gray-500' : 'text-gray-500'} uppercase font-semibold truncate`}>
									{p.pillar.name}
								</p>
								<p className={`text-3xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
									{score}
									<span className={`text-lg ${d ? 'text-gray-500' : 'text-gray-400'}`}>
										{' '}
										%
									</span>
								</p>
								<div className={`mt-2 h-1 rounded-full ${d ? 'bg-white/5' : 'bg-gray-100'}`}>
									<div
										className={`h-full rounded-full ${barColor}`}
										style={{ width: `${score}%` }}
									/>
								</div>
								{p.hasKnockout && (
									<p className={`text-[9px] ${d ? 'text-red-400' : 'text-red-600'} mt-2 uppercase font-bold`}>
										Knockout flagged
									</p>
								)}
							</div>
						)
					})}
				</div>
			</div>

			{/* Phase Findings */}
			<div className={`rounded-2xl ${d ? 'bg-[#111827] border-white/5' : 'bg-white border-gray-200'} border p-6`}>
				<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6'>
					<div>
						<h3 className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
							Phase Findings
						</h3>
						<p className={`text-xs ${d ? 'text-gray-500' : 'text-gray-600'}`}>
							{inProgress
								? 'Your most recent completed phase. Resume the scan in progress to see updated findings.'
								: 'Top-line phase status from your latest scan.'}
						</p>
					</div>
					<Link
						href='/dashboard/strategic-scan'
						className={`text-sm font-semibold flex items-center gap-1 transition ${d ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
					>
						{inProgress ? 'Resume Scan' : 'Run Again'}
						<ArrowRight className='w-3.5 h-3.5' />
					</Link>
				</div>

				<div className='overflow-x-auto -mx-6 px-6'>
					<table className='w-full min-w-[540px]'>
						<thead>
							<tr className={`text-[10px] ${d ? 'text-gray-500' : 'text-gray-500'} uppercase tracking-wider`}>
								<th className='text-left pb-3 font-semibold'>
									Phase
								</th>
								<th className='text-left pb-3 font-semibold'>
									Status
								</th>
								<th className='text-left pb-3 font-semibold'>
									Score
								</th>
								<th className='text-left pb-3 font-semibold'>
									Findings
								</th>
							</tr>
						</thead>
						<tbody className={`divide-y ${d ? 'divide-white/5' : 'divide-gray-100'}`}>
							{displayResults.map((item, index) => {
								const res = item.result;
								const pScores = res.pillarScores || [];
								const tScore = Math.round(res.totalScore);
								const band = normalizeColorBand(res.colorBand);
								const status = COLOR_BAND_TO_STATUS[band];
								const pLabel = phaseDisplayName(res);
								const tFindings = pScores.reduce((sum, p) => sum + (p.findings?.length ?? 0), 0);
								const targetSessionId = res.sessionId;
								return (
									<tr
										key={res.id || index}
										onClick={(e) => {
											e.stopPropagation();
											if (!targetSessionId) {
												console.warn('Phase row missing sessionId', res);
												return;
											}
											router.push(`/dashboard/reports/${targetSessionId}`);
										}}
										className={`text-sm transition ${targetSessionId ? (d ? 'cursor-pointer hover:bg-white/5' : 'cursor-pointer hover:bg-gray-50') : 'cursor-default opacity-60'}`}
									>
										<td className='py-4'>
											<div className='flex items-center gap-3'>
												<div className={`w-8 h-8 rounded-lg ${d ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
													<FileText className={`w-4 h-4 ${d ? 'text-gray-400' : 'text-gray-500'}`} />
												</div>
												<div>
													<p className={`font-semibold ${d ? 'text-white' : 'text-gray-900'}`}>
														{pLabel}
													</p>
													<p className={`text-xs ${d ? 'text-gray-500' : 'text-gray-500'}`}>
														Completed
													</p>
												</div>
											</div>
										</td>
										<td className='py-4'>
											<span
												className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${status.pill}`}
											>
												<span className='w-1.5 h-1.5 rounded-full bg-current' />
												{status.label}
											</span>
										</td>
										<td className={`py-4 font-semibold ${d ? 'text-white' : 'text-gray-900'}`}>
											{tScore}
											<span className={`text-xs ${d ? 'text-gray-500' : 'text-gray-400'}`}>
												{' '}
												/ 100
											</span>
										</td>
										<td className={`py-4 ${d ? 'text-gray-400' : 'text-gray-600'}`}>
											{item.paywalled ? (
												<span className={`inline-flex items-center gap-1 ${d ? 'text-gray-500' : 'text-gray-500'}`}>
													<Lock className='w-3 h-3' /> Locked
												</span>
											) : (
												<>
													{tFindings} finding
													{tFindings === 1 ? '' : 's'}
												</>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function DashboardHomePage() {
	const router = useRouter()
	const [state, setState] = useState<DashboardState>('loading')
	const [data, setData] = useState<GetResultResponse | null>(null)
	const [allResults, setAllResults] = useState<GetResultResponse[]>([])
	const [errorMessage, setErrorMessage] = useState<string>('')
	// MeUser is a superset of AuthUser; we need profileComplete + businessSize
	// in this component to render the completion banner. Components that only
	// need the AuthUser slice still accept the wider type fine.
	const [user, setUser] = useState<MeUser | null>(null)

	useEffect(() => {
		const token = getAccessToken()
		if (!token) {
			router.push('/Auth/login')
			return
		}

		// getStoredUser() returns the AuthUser slice — the dashboard widens it
		// to MeUser once /auth/me lands a few lines below. Until then, the
		// banner falls back to "incomplete" (its guard checks profileComplete).
		setUser(getStoredUser() as MeUser | null)
		const sessionId = getLastSessionId()

		let cancelled = false
		;(async () => {
			try {
				const meRes = await getMe()
				if (cancelled) return

				if (meRes.error || !meRes.data) {
					router.push('/Auth/login')
					return
				}

				setUser(meRes.data.user)

				const headers: Record<string, string> = {
					Authorization: `Bearer ${token}`,
				}

				// Fetch all results
				try {
					const allRes = await fetch(`${API_BASE}/result/me`, { headers })
					if (allRes.ok) {
						const allJson = await allRes.json().catch(() => ({}))
						let items: unknown[] = []
						if (Array.isArray(allJson)) items = allJson
						else if (allJson && typeof allJson === 'object') {
							if (Array.isArray((allJson as any).results)) items = (allJson as any).results
							else if (Array.isArray((allJson as any).data)) items = (allJson as any).data
						}
						
						const validResults: GetResultResponse[] = []
						for (const item of items) {
							if (isResultResponse(item)) {
								validResults.push(item as GetResultResponse)
							} else if (item && typeof item === 'object' && 'pillarScores' in item) {
								validResults.push({ message: 'Success', paywalled: false, result: item as any })
							}
						}
						setAllResults(validResults)
					}
				} catch (e) {
					// ignore
				}

				if (!sessionId) {
					const latestRes = await fetch(
						`${API_BASE}/result/me/latest`,
						{ headers },
					)
					if (cancelled) return
					if (latestRes.ok) {
						const latestJson = (await latestRes
							.json()
							.catch(() => ({}))) as Record<string, unknown>
						if (cancelled) return
						if (isResultResponse(latestJson)) {
							setData(latestJson)
							setState('active')
							return
						}
						setErrorMessage(
							'Dashboard data is incomplete. Please run your scan again.',
						)
						setState('error')
						return
					}
					if (latestRes.status === 401 || latestRes.status === 403) {
						router.push('/Auth/login')
						return
					}
					setState('empty')
					return
				}

				const res = await fetch(`${API_BASE}/result/${sessionId}`, {
					headers,
				})
				const json = (await res.json().catch(() => ({}))) as Record<
					string,
					unknown
				>

				if (cancelled) return

				if (!res.ok) {
					if (res.status === 401 || res.status === 403) {
						router.push('/Auth/login')
						return
					}
					if (res.status === 409) {
						const latestRes = await fetch(
							`${API_BASE}/result/me/latest`,
							{ headers },
						)
						if (cancelled) return
						if (latestRes.ok) {
							const latestJson = (await latestRes
								.json()
								.catch(() => ({}))) as Record<string, unknown>
							if (cancelled) return
							if (isResultResponse(latestJson)) {
								setData(latestJson)
								setState('in-progress-active')
								return
							}
						}
						setState('in-progress')
						return
					}
					if (res.status === 404) {
						const latestRes = await fetch(
							`${API_BASE}/result/me/latest`,
							{ headers },
						)
						if (cancelled) return
						if (latestRes.ok) {
							const latestJson = (await latestRes
								.json()
								.catch(() => ({}))) as Record<string, unknown>
							if (cancelled) return
							if (isResultResponse(latestJson)) {
								setData(latestJson)
								setState('active')
								return
							}
						}
						setState('empty')
						return
					}
					const message =
						typeof json.message === 'string'
							? json.message
							: `Request failed (${res.status})`
					setErrorMessage(message)
					setState('error')
					return
				}

				if (!isResultResponse(json)) {
					setErrorMessage(
						'Dashboard data is incomplete. Please run your scan again.',
					)
					setState('error')
					return
				}

				setData(json)
				setState('active')
			} catch (err) {
				if (cancelled) return
				setErrorMessage(
					err instanceof Error ? err.message : 'Network error',
				)
				setState('error')
			}
		})()

		return () => {
			cancelled = true
		}
	}, [router])

	// `profileComplete` is set by the backend on /auth/me. While we're still
	// waiting on /auth/me (or after it failed), `user` may only be the AuthUser
	// slice from localStorage — in that case we default the flag to `true`
	// (don't nag on cold load).
	const profileComplete = user?.profileComplete ?? true

	const renderState = () => {
		if (state === 'loading') return <LoadingState />
		if (state === 'empty') return <EmptyState user={user} />
		if (state === 'in-progress') return <InProgressState />
		if (state === 'error') return <ErrorState message={errorMessage} />
		if (state === 'active' && data) {
			return <ActiveState data={data} user={user} allResults={allResults} />
		}
		if (state === 'in-progress-active' && data) {
			return <ActiveState data={data} user={user} allResults={allResults} inProgress />
		}
		return <EmptyState user={user} />
	}

	return (
		<>
			{!profileComplete && state !== 'loading' && (
				<ProfileCompletionBanner />
			)}
			{renderState()}
		</>
	)
}

// Rendered above whatever dashboard state is active when the user hasn't yet
// supplied the data we need to unlock paid tests (today: staffSize → businessSize).
// Tapping the CTA drops them on the settings page to finish onboarding.
function ProfileCompletionBanner() {
	const { dark: d } = useTheme();
	return (
		<div className={`mb-6 rounded-2xl border ${d ? 'border-orange-500/30 bg-orange-500/10' : 'border-orange-200 bg-orange-50'} p-5 flex flex-col sm:flex-row sm:items-center gap-4`}>
			<div className={`w-10 h-10 rounded-lg ${d ? 'bg-orange-500/20' : 'bg-orange-100'} flex items-center justify-center flex-shrink-0`}>
				<AlertTriangle className={`w-5 h-5 ${d ? 'text-orange-400' : 'text-orange-600'}`} />
			</div>
			<div className='flex-1 min-w-0'>
				<p className={`text-sm font-semibold ${d ? 'text-white' : 'text-gray-900'}`}>
					Finish setting up your business profile
				</p>
				<p className={`text-xs ${d ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
					Add your staff size (and any other details) so we can tailor
					your assessment and unlock the paid scans.
				</p>
			</div>
			<Link
				href='/dashboard/settings'
				className='inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition'
			>
				Complete profile <ArrowRight className='w-4 h-4' />
			</Link>
		</div>
	)
}
