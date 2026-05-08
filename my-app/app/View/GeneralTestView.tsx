'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTheme } from '@/components/ThemeContext'
import { setLastSessionId } from '@/lib/authClient'
import {
	Clock,
	CheckSquare,
	FileText,
	Lock,
	MapPin,
	ChevronDown,
	ArrowLeft,
	ArrowRight,
	CheckCircle,
	Loader,
	BarChart2,
} from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3210/api'

const OPTIONS_LABELS = ['A', 'B', 'C', 'D']
const INDUSTRIES = [
	'Technology & SaaS',
	'Retail & E-commerce',
	'Healthcare',
	'Finance & Banking',
	'Agriculture',
	'Manufacturing',
	'Logistics',
	'Education',
	'Real Estate',
	'Other',
]

// ─── Types ───────────────────────────────────────────────────────────────────
interface QuestionOption {
	id: string
	optionLabel: string
	optionText: string
	displayOrder: number
}

interface Question {
	id: string
	questionCode: string
	questionText: string
	displayOrder: number
	options: QuestionOption[]
}

interface Pillar {
	id: string
	code: string
	name: string
	description: string | null
	displayOrder: number
	questions: Question[]
}

interface ProfileData {
	leadEmail: string
	staffSize: string
	businessName: string
	industry: string
	location: string
	operatingYears: string
	annualRevenue: string
}

type Step = 'intro' | 'profile' | 'questions' | 'processing'
type BusinessSize = 'SMALL' | 'MEDIUM'

// ─── Step 1: Intro ─────────────────────────────────────────────────────────────
function IntroStep({ dark, onStart }: { dark: boolean; onStart: () => void }) {
	const d = dark
	return (
		<div
			className={`min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 ${d ? 'bg-black' : 'bg-gray-50'}`}
		>
			<div
				className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${d ? 'bg-[#1a2235]' : 'bg-gray-200'}`}
				style={{
					boxShadow: d ? '0 0 40px rgba(249,115,22,0.2)' : 'none',
				}}
			>
				<BarChart2 className='w-7 h-7 text-[#f97316]' />
			</div>

			<h1
				className={`text-2xl md:text-4xl font-extrabold text-center mb-4 ${d ? 'text-white' : 'text-gray-900'}`}
			>
				Let&apos;s Understand Your Business
			</h1>
			<p
				className={`text-base text-center mb-12 max-w-md ${d ? 'text-gray-400' : 'text-gray-600'}`}
			>
				This quick assessment will help identify strengths, risks, and
				opportunities across your business.
			</p>

			<div className='grid grid-cols-3 gap-4 mb-12 w-full max-w-2xl'>
				{[
					{
						icon: <Clock className='w-4 h-4 text-[#00ffaa]' />,
						label: 'DURATION',
						value: 'Takes 5-10 minutes',
					},
					{
						icon: (
							<CheckSquare className='w-4 h-4 text-[#00ffaa]' />
						),
						label: 'PREREQUISITES',
						value: 'No prior preparation needed',
					},
					{
						icon: <FileText className='w-4 h-4 text-[#00ffaa]' />,
						label: 'OUTPUT',
						value: "You'll receive a summary at the end",
					},
				].map(({ icon, label, value }) => (
					<div
						key={label}
						className={`rounded-2xl p-5 border ${d ? 'bg-[#161b22] border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}
					>
						<div className='flex items-center gap-2 mb-3'>
							{icon}
							<span
								className={`text-xs font-bold uppercase tracking-widest ${d ? 'text-gray-400' : 'text-gray-500'}`}
							>
								{label}
							</span>
						</div>
						<p
							className={`text-sm font-medium ${d ? 'text-white' : 'text-gray-900'}`}
						>
							{value}
						</p>
					</div>
				))}
			</div>

			<button
				onClick={onStart}
				className='px-4 sm:px-6 md:px-12 py-4 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-gray-900 text-base font-bold transition mb-4'
			>
				Start Assessment
			</button>
			<div
				className={`flex items-center gap-2 text-xs ${d ? 'text-gray-500' : 'text-gray-400'}`}
			>
				<Lock className='w-3 h-3' />
				Your responses are confidential and secure.
			</div>
		</div>
	)
}

// ─── Step 2: Business Profile ──────────────────────────────────────────────────
function ProfileStep({
	dark,
	profile,
	setProfile,
	onContinue,
	onBack,
	loading,
	error,
}: {
	dark: boolean
	profile: ProfileData
	setProfile: (p: ProfileData) => void
	onContinue: () => void
	onBack: () => void
	loading: boolean
	error: string | null
}) {
	const d = dark
	const [industryOpen, setIndustryOpen] = useState(false)

	const update = (field: keyof ProfileData, value: string) => {
		setProfile({ ...profile, [field]: value })
	}

	return (
		<div
			className={`min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-10 md:py-16 ${d ? 'bg-black' : 'bg-gray-50'}`}
		>
			<h1
				className={`text-3xl md:text-5xl font-extrabold text-center mb-4 ${d ? 'text-white' : 'text-gray-900'}`}
			>
				Tell Us About Your
				<br />
				Business
			</h1>
			<p
				className={`text-base text-center mb-12 max-w-lg ${d ? 'text-gray-400' : 'text-gray-600'}`}
			>
				Help our intelligence systems categorize your operation for a
				personalized assessment journey.
			</p>

			<div
				className={`w-full max-w-2xl rounded-3xl p-8 border relative ${d ? 'bg-[#161b22] border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}
			>
				<div className='absolute top-6 right-6 bg-[#1e2d1e] border border-[#00ffaa]/30 rounded-xl px-3 py-2 text-xs'>
					<p className='text-gray-400 uppercase tracking-wider text-[10px] mb-0.5'>
						Smart Classification
					</p>
					<p className='text-[#00ffaa] font-bold flex items-center gap-1'>
						✦ Small Business
					</p>
				</div>

				<div className='grid grid-cols-2 gap-6 mb-6'>
					<div>
						<label
							className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? 'text-gray-400' : 'text-gray-500'}`}
						>
							Business Name
						</label>
						<input
							type='text'
							placeholder='e.g. PICA Systems'
							value={profile.businessName}
							onChange={(e) =>
								update('businessName', e.target.value)
							}
							className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${d ? 'bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-teal-400'}`}
						/>
					</div>

					<div>
						<label
							className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? 'text-gray-400' : 'text-gray-500'}`}
						>
							Industry
						</label>
						<div className='relative'>
							<button
								onClick={() => setIndustryOpen(!industryOpen)}
								className={`w-full px-4 py-3 rounded-xl border text-sm flex items-center justify-between transition ${d ? 'bg-[#0d1117] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
							>
								{profile.industry || 'Select industry'}
								<ChevronDown className='w-4 h-4 text-gray-400' />
							</button>
							{industryOpen && (
								<div
									className={`absolute top-full left-0 right-0 mt-1 rounded-xl border z-50 overflow-hidden ${d ? 'bg-[#1a2235] border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}
								>
									{INDUSTRIES.map((ind) => (
										<button
											key={ind}
											onClick={() => {
												update('industry', ind)
												setIndustryOpen(false)
											}}
											className={`w-full text-left px-4 py-2.5 text-sm transition ${d ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}
										>
											{ind}
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				</div>

				<div className='grid grid-cols-2 gap-6 mb-6'>
					<div>
						<label
							className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? 'text-gray-400' : 'text-gray-500'}`}
						>
							Email Address
						</label>
						<input
							type='email'
							placeholder='you@company.com'
							value={profile.leadEmail}
							onChange={(e) =>
								update('leadEmail', e.target.value)
							}
							className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${d ? 'bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-teal-400'}`}
						/>
					</div>
					<div>
						<label
							className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? 'text-gray-400' : 'text-gray-500'}`}
						>
							Staff Size
						</label>
						<input
							type='text'
							placeholder='Number of employees'
							value={profile.staffSize}
							onChange={(e) =>
								update('staffSize', e.target.value)
							}
							className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition ${d ? 'bg-[#0d1117] border-white/10 text-white placeholder-gray-600 focus:border-[#00ffaa]/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-teal-400'}`}
						/>
					</div>
				</div>

				<div className='grid grid-cols-2 gap-6 mb-6'>
					<div>
						<label
							className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? 'text-gray-400' : 'text-gray-500'}`}
						>
							Years in Operation
						</label>
						<div className='flex gap-2'>
							{['0-2', '3-10', '10+'].map((y) => (
								<button
									key={y}
									onClick={() => update('operatingYears', y)}
									className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${profile.operatingYears === y ? 'bg-[#00ffaa]/10 border-[#00ffaa] text-[#00ffaa]' : d ? 'border-white/10 text-gray-400 hover:border-white/20' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
								>
									{y}
								</button>
							))}
						</div>
					</div>
					<div>
						<label
							className={`text-xs font-bold uppercase tracking-widest block mb-2 ${d ? 'text-gray-400' : 'text-gray-500'}`}
						>
							Primary Business Location
						</label>
						<div
							className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${d ? 'bg-[#0d1117] border-white/10' : 'bg-gray-50 border-gray-200'}`}
						>
							<MapPin className='w-4 h-4 text-gray-500' />
							<input
								type='text'
								placeholder='Lagos, Nigeria'
								value={profile.location}
								onChange={(e) =>
									update('location', e.target.value)
								}
								className={`flex-1 bg-transparent text-sm outline-none ${d ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
							/>
						</div>
					</div>
				</div>

				<div className='mb-8'>
					<label
						className={`text-xs font-bold uppercase tracking-widest block mb-3 ${d ? 'text-gray-400' : 'text-gray-500'}`}
					>
						Annual Revenue Range
					</label>
					<div className='grid grid-cols-3 gap-3'>
						{[
							{ key: 'Under ₦5M', label: 'Under', value: '₦5M' },
							{
								key: 'Mid ₦5M - ₦50M',
								label: 'Mid-Range',
								value: '₦5M - ₦50M',
							},
							{
								key: 'Enterprise ₦50M+',
								label: 'Enterprise',
								value: '₦50M+',
							},
						].map(({ key, label, value }) => (
							<button
								key={key}
								onClick={() => update('annualRevenue', key)}
								className={`p-4 rounded-xl border text-left transition ${profile.annualRevenue === key ? 'border-[#00ffaa] bg-[#00ffaa]/5' : d ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:bg-gray-50'}`}
							>
								<p
									className={`text-xs mb-1 ${profile.annualRevenue === key ? 'text-[#00ffaa]' : d ? 'text-gray-400' : 'text-gray-500'}`}
								>
									{label}
								</p>
								<p
									className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'}`}
								>
									{value}
								</p>
							</button>
						))}
					</div>
				</div>

				{error && (
					<div className='mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm'>
						{error}
					</div>
				)}

				<div className='flex items-center justify-between'>
					<button
						onClick={onBack}
						className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border transition ${d ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
					>
						<ArrowLeft className='w-4 h-4' /> Previous
					</button>
					<button
						onClick={onContinue}
						disabled={loading}
						className='flex items-center gap-2 px-8 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-gray-900 text-sm font-bold transition disabled:opacity-50'
					>
						{loading ? (
							<>
								<Loader className='w-4 h-4 animate-spin' />{' '}
								Starting...
							</>
						) : (
							<>
								Continue to Assessment{' '}
								<ArrowRight className='w-4 h-4' />
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Step 3: Question ──────────────────────────────────────────────────────────
function QuestionStep({
	dark,
	question,
	pillarName,
	currentIndex,
	totalQuestions,
	selectedOptionId,
	onAnswer,
	onNext,
	onPrev,
	submitting,
	answerInFlight,
	answerError,
}: {
	dark: boolean
	question: Question
	pillarName: string
	currentIndex: number
	totalQuestions: number
	selectedOptionId: string | null
	onAnswer: (optionId: string) => void
	onNext: () => void
	onPrev: () => void
	submitting: boolean
	answerInFlight: boolean
	answerError: string | null
}) {
	const d = dark
	const progress = ((currentIndex + 1) / totalQuestions) * 100
	const isLast = currentIndex === totalQuestions - 1

	return (
		<div
			className={`min-h-screen flex flex-col ${d ? 'bg-[#0d1117]' : 'bg-gray-50'}`}
		>
			<div className='flex-1 px-4 sm:px-6 md:px-12 py-8'>
				<div className='flex items-start justify-between mb-2'>
					<div>
						<p className='text-xs font-bold uppercase tracking-widest text-[#00ffaa] mb-1'>
							Current Pillar
						</p>
						<p
							className={`text-xl font-bold ${d ? 'text-white' : 'text-gray-900'}`}
						>
							{pillarName}
						</p>
					</div>
					<div className='text-right'>
						<p className='text-xs font-bold uppercase tracking-widest text-gray-500 mb-1'>
							Progress
						</p>
						<p
							className={`text-sm ${d ? 'text-gray-300' : 'text-gray-700'}`}
						>
							Question{' '}
							<span className='font-bold text-[#f97316]'>
								{currentIndex + 1}
							</span>{' '}
							of {totalQuestions}
						</p>
					</div>
				</div>
				<div
					className={`h-1 rounded-full mb-10 ${d ? 'bg-white/10' : 'bg-gray-200'}`}
				>
					<div
						className='h-full rounded-full bg-[#00ffaa] transition-all duration-500'
						style={{ width: `${progress}%` }}
					/>
				</div>

				<div className='grid grid-cols-2 gap-12 items-start'>
					<div>
						<h2
							className={`text-3xl font-extrabold leading-tight mb-8 ${d ? 'text-white' : 'text-gray-900'}`}
						>
							{question.questionText}
						</h2>

						<div className='space-y-3'>
							{question.options
								.sort((a, b) => a.displayOrder - b.displayOrder)
								.map((opt) => {
									const selected = selectedOptionId === opt.id
									return (
										<button
											key={opt.id}
											onClick={() => onAnswer(opt.id)}
											className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition ${
												selected
													? 'border-[#00ffaa] bg-[#00ffaa]/10'
													: d
														? 'border-white/10 bg-[#161b22] hover:border-white/20'
														: 'border-gray-200 bg-white hover:border-gray-300'
											}`}
										>
											<span
												className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
													selected
														? 'bg-[#00ffaa] text-gray-900'
														: d
															? 'bg-[#243044] text-gray-400'
															: 'bg-gray-100 text-gray-600'
												}`}
											>
												{opt.optionLabel}
											</span>
											<span
												className={`text-sm font-medium ${selected ? (d ? 'text-white font-bold' : 'text-gray-900 font-bold') : d ? 'text-gray-300' : 'text-gray-700'}`}
											>
												{opt.optionText}
											</span>
											{selected && (
												<CheckCircle className='w-5 h-5 text-[#00ffaa] ml-auto' />
											)}
										</button>
									)
								})}
						</div>
					</div>

					<div>
						<div
							className={`rounded-2xl overflow-hidden mb-0 relative ${d ? 'bg-[#161b22]' : 'bg-gray-200'}`}
							style={{ minHeight: '320px' }}
						>
							<Image
								src='/images/assessques.png'
								alt='Question'
								width={500}
								height={320}
								className='w-full h-full object-cover'
							/>
							<div className='absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent'>
								<p className='text-xs font-bold text-[#f97316] uppercase tracking-wider'>
									{pillarName} Insight
								</p>
							</div>
						</div>
					</div>
				</div>

				{answerError && (
					<div className='mt-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm'>
						{answerError} — please re-select an answer.
					</div>
				)}

				<div className='flex items-center justify-between mt-10'>
					<button
						onClick={onPrev}
						disabled={currentIndex === 0}
						className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition ${
							currentIndex === 0
								? 'opacity-40 cursor-not-allowed'
								: ''
						} ${d ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
					>
						<ArrowLeft className='w-4 h-4' /> Previous
					</button>
					<button
						onClick={onNext}
						disabled={
							!selectedOptionId ||
							submitting ||
							answerInFlight ||
							!!answerError
						}
						className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition ${
							selectedOptionId &&
							!answerInFlight &&
							!answerError
								? 'bg-[#f97316] hover:bg-[#ea6c0a] text-gray-900'
								: 'bg-[#f97316]/40 text-gray-600 cursor-not-allowed'
						}`}
					>
						{submitting || answerInFlight ? (
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
		</div>
	)
}

// ─── Step 4: Processing ────────────────────────────────────────────────────────
function ProcessingStep({ dark }: { dark: boolean }) {
	const d = dark
	const [step, setStep] = useState(1)

	useEffect(() => {
		const t1 = setTimeout(() => setStep(2), 2000)
		const t2 = setTimeout(() => setStep(3), 4000)
		return () => {
			clearTimeout(t1)
			clearTimeout(t2)
		}
	}, [])

	const steps = [
		{
			num: '01',
			title: 'Calculating Health Score',
			desc: 'Core metabolic indicators processed.',
			done: step > 1,
			active: step === 1,
		},
		{
			num: '02',
			title: 'Mapping Risk Factors',
			desc: 'Scanning market volatility vectors.',
			done: step > 2,
			active: step === 2,
		},
		{
			num: '03',
			title: 'Synthesizing Insights',
			desc: 'Final editorial layer pending.',
			done: step > 3,
			active: step === 3,
		},
	]

	return (
		<div
			className={`min-h-screen flex flex-col ${d ? 'bg-[#0d1117]' : 'bg-gray-50'}`}
		>
			<div className='flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-10 md:py-16'>
				<div
					className={`flex items-center gap-2 px-4 py-2 rounded-full border mb-12 ${d ? 'border-white/10 bg-[#161b22]' : 'border-gray-200 bg-white'}`}
				>
					<span className='w-2 h-2 rounded-full bg-[#00ffaa] animate-pulse' />
					<span
						className={`text-xs font-bold uppercase tracking-widest ${d ? 'text-gray-300' : 'text-gray-600'}`}
					>
						Neural Processing Active
					</span>
				</div>

				<div className='relative mb-12'>
					<div
						className='w-48 h-48 rounded-full border border-dashed border-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin'
						style={{ animationDuration: '8s' }}
					/>
					<div
						className='w-36 h-36 rounded-full border-4 border-[#f97316] flex items-center justify-center relative'
						style={{ boxShadow: '0 0 40px rgba(249,115,22,0.4)' }}
					>
						<div
							className={`w-20 h-20 rounded-full flex items-center justify-center ${d ? 'bg-[#0d1117]' : 'bg-gray-100'}`}
						>
							<BarChart2 className='w-8 h-8 text-[#f97316]' />
						</div>
						<div
							className='absolute inset-0 rounded-full border-4 border-transparent border-t-[#f97316] animate-spin'
							style={{ animationDuration: '1.5s' }}
						/>
					</div>
					<div className='absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#00ffaa]' />
					<div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gray-500' />
				</div>

				<h2
					className={`text-4xl font-extrabold mb-3 ${d ? 'text-white' : 'text-gray-900'}`}
				>
					Analyzing your business...
				</h2>
				<p
					className={`text-base text-center mb-16 max-w-lg ${d ? 'text-gray-400' : 'text-gray-600'}`}
				>
					Synthesizing data across all pillars to identify strengths,
					risks, and patterns.
				</p>

				<div className='grid grid-cols-3 gap-5 w-full max-w-3xl'>
					{steps.map(({ num, title, desc, done, active }) => (
						<div
							key={num}
							className={`rounded-2xl p-5 border transition ${
								active
									? d
										? 'bg-[#1a2235] border-[#00ffaa]/40'
										: 'bg-white border-teal-400 shadow'
									: done
										? d
											? 'bg-[#161b22] border-white/10'
											: 'bg-white border-gray-200'
										: d
											? 'bg-[#161b22] border-white/5 opacity-50'
											: 'bg-gray-100 border-gray-200 opacity-50'
							}`}
						>
							{active && (
								<div className='h-1 rounded-full bg-[#00ffaa] mb-4 w-3/4' />
							)}
							<div className='flex items-center gap-2 mb-3'>
								<div
									className={`w-7 h-7 rounded-full flex items-center justify-center ${
										done
											? 'bg-[#00ffaa]'
											: active
												? 'bg-[#f97316]'
												: d
													? 'bg-[#243044]'
													: 'bg-gray-300'
									}`}
								>
									{done ? (
										<CheckCircle className='w-4 h-4 text-gray-900' />
									) : active ? (
										<Loader className='w-4 h-4 text-gray-900 animate-spin' />
									) : (
										<span className='text-xs font-bold text-gray-400'>
											{num[1]}
										</span>
									)}
								</div>
								<span
									className={`text-xs font-bold uppercase tracking-widest ${active ? 'text-[#00ffaa]' : done ? (d ? 'text-gray-300' : 'text-gray-600') : 'text-gray-500'}`}
								>
									{active ? 'In Progress' : `Step ${num}`}
								</span>
							</div>
							<p
								className={`text-sm font-bold mb-1 ${active || done ? (d ? 'text-white' : 'text-gray-900') : 'text-gray-500'}`}
							>
								{title}
							</p>
							<p
								className={`text-xs ${active ? (d ? 'text-gray-300' : 'text-gray-600') : 'text-gray-500'}`}
							>
								{desc}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function GeneralTestPage() {
	const { dark } = useTheme()
	const [step, setStep] = useState<Step>('intro')
	const [currentIndex, setCurrentIndex] = useState(0)

	// Backend state
	const [sessionId, setSessionId] = useState<string | null>(null)
	const [businessSize, setBusinessSize] = useState<BusinessSize | null>(null)
	const [allQuestions, setAllQuestions] = useState<
		{ question: Question; pillarName: string }[]
	>([])
	const [answers, setAnswers] = useState<Record<string, string>>({}) // questionId -> selectedOptionId
	const [loading, setLoading] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [profile, setProfile] = useState<ProfileData>({
		leadEmail: '',
		staffSize: '',
		businessName: '',
		industry: '',
		location: '',
		operatingYears: '',
		annualRevenue: '',
	})

	const [answerInFlight, setAnswerInFlight] = useState(false)
	const [answerError, setAnswerError] = useState<string | null>(null)

	// Fetch questions after the assessment session returns its businessSize.
	// Reset per-question progress when the size changes (e.g. user re-submits the profile).
	useEffect(() => {
		if (!businessSize) return
		setCurrentIndex(0)
		setAnswers({})
		setAnswerError(null)
		async function fetchQuestions() {
			try {
				const res = await fetch(
					`${API_BASE}/questions/phase1?businessSize=${businessSize}`,
				)
				const data = await res.json()
				if (!res.ok)
					throw new Error(data.message || 'Failed to fetch questions')

				const flat: { question: Question; pillarName: string }[] = []
				data.pillars
					.sort(
						(a: Pillar, b: Pillar) =>
							a.displayOrder - b.displayOrder,
					)
					.forEach((pillar: Pillar) => {
						pillar.questions
							.sort(
								(a: Question, b: Question) =>
									a.displayOrder - b.displayOrder,
							)
							.forEach((q: Question) => {
								flat.push({
									question: q,
									pillarName: pillar.name,
								})
							})
					})
				setAllQuestions(flat)
			} catch (err: any) {
				console.error('Failed to load questions:', err)
				setError(err.message || 'Failed to load questions')
			}
		}
		fetchQuestions()
	}, [businessSize])

	// Start assessment session
	const handleStartAssessment = async () => {
		const missing: string[] = []
		if (!profile.leadEmail.trim()) missing.push('email')
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.leadEmail.trim()))
			missing.push('a valid email')
		if (!profile.businessName.trim()) missing.push('business name')
		if (!profile.staffSize.trim()) missing.push('staff size')
		if (!profile.industry.trim()) missing.push('industry')
		if (!profile.location.trim()) missing.push('location')
		if (!profile.operatingYears.trim()) missing.push('years in operation')
		if (!profile.annualRevenue.trim()) missing.push('annual revenue')
		if (missing.length > 0) {
			setError(`Please provide ${missing.join(', ')}.`)
			return
		}

		setLoading(true)
		setError(null)
		try {
			const res = await fetch(`${API_BASE}/assessment/start`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(profile),
			})
			const data = await res.json()

			if (res.status === 409) {
				setError(
					data.message ||
						'An assessment for this email is already completed. Please check your inbox.',
				)
				return
			}

			if (!res.ok)
				throw new Error(data.message || 'Failed to start assessment')

			const isResumed = /resuming/i.test(data.message ?? '')
			setSessionId(data.sessionId)
			setBusinessSize(data.businessSize)
			setLastSessionId(data.sessionId)

			if (isResumed) {
				try {
					const existing = await fetch(
						`${API_BASE}/assessment/${data.sessionId}/responses`,
					)
					if (existing.ok) {
						const existingData = await existing.json()
						const map: Record<string, string> = {}
						for (const r of existingData.responses ?? []) {
							map[r.questionId] = r.selectedOptionId
						}
						setAnswers(map)
					}
				} catch {
					// non-fatal — user can re-answer; backend upserts
				}
			}

			setStep('questions')
		} catch (err: any) {
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}

	// Submit answer to backend
	const submitAnswer = async (
		questionId: string,
		selectedOptionId: string,
	): Promise<boolean> => {
		if (!sessionId) return false
		setAnswerInFlight(true)
		setAnswerError(null)
		try {
			const res = await fetch(
				`${API_BASE}/assessment/${sessionId}/answer`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ questionId, selectedOptionId }),
				},
			)
			const data = await res.json()
			if (!res.ok)
				throw new Error(data.message || 'Failed to save answer')
			return true
		} catch (err: any) {
			console.error('Failed to submit answer:', err)
			setAnswerError(err.message || 'Failed to save answer')
			setAnswers((prev) => {
				const next = { ...prev }
				delete next[questionId]
				return next
			})
			return false
		} finally {
			setAnswerInFlight(false)
		}
	}

	// Handle selecting an option
	const handleAnswer = (optionId: string) => {
		if (answerInFlight) return
		const currentQuestion = allQuestions[currentIndex]
		if (!currentQuestion) return

		setAnswers((prev) => ({
			...prev,
			[currentQuestion.question.id]: optionId,
		}))
		submitAnswer(currentQuestion.question.id, optionId)
	}

	// Handle next / submit
	const handleNext = async () => {
		if (answerInFlight || answerError) return
		if (currentIndex < allQuestions.length - 1) {
			setCurrentIndex(currentIndex + 1)
		} else {
			// Last question — submit the assessment
			setSubmitting(true)
			try {
				const res = await fetch(
					`${API_BASE}/assessment/${sessionId}/submit`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
					},
				)
				const data = await res.json()
				if (!res.ok)
					throw new Error(
						data.message || 'Failed to submit assessment',
					)

				setStep('processing')
				// After processing animation, redirect to results
				setTimeout(() => {
					window.location.href = `/pages/result?sessionId=${sessionId}`
				}, 6000)
			} catch (err: any) {
				console.error('Failed to submit:', err)
				setError(err.message)
			} finally {
				setSubmitting(false)
			}
		}
	}

	const handlePrev = () => {
		if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
	}

	if (step === 'intro')
		return <IntroStep dark={dark} onStart={() => setStep('profile')} />
	if (step === 'profile')
		return (
			<ProfileStep
				dark={dark}
				profile={profile}
				setProfile={setProfile}
				onContinue={handleStartAssessment}
				onBack={() => setStep('intro')}
				loading={loading}
				error={error}
			/>
		)
	if (step === 'questions' && allQuestions.length > 0) {
		const current = allQuestions[currentIndex]
		return (
			<QuestionStep
				dark={dark}
				question={current.question}
				pillarName={current.pillarName}
				currentIndex={currentIndex}
				totalQuestions={allQuestions.length}
				selectedOptionId={answers[current.question.id] || null}
				onAnswer={handleAnswer}
				onNext={handleNext}
				onPrev={handlePrev}
				submitting={submitting}
				answerInFlight={answerInFlight}
				answerError={answerError}
			/>
		)
	}
	if (step === 'processing') return <ProcessingStep dark={dark} />

	// Loading fallback
	return (
		<div className='min-h-screen flex items-center justify-center bg-[#0d1117]'>
			<Loader className='w-8 h-8 text-[#f97316] animate-spin' />
		</div>
	)
}
