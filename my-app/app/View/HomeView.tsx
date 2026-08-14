'use client'

import Link from 'next/link'
import { useTheme } from '@/components/ThemeContext'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { getStoredUser } from '@/lib/authClient'
import {
	Search,
	Target,
	BarChart2,
	Zap,
	Users,
	Briefcase,
	ShoppingCart,
	DollarSign,
	Settings,
	Shield,
	MapPin,
	ChevronRight,
	CheckCircle,
	AlertTriangle,
	Info,
	Crown,
	Quote,
	MessageSquare,
	Eye,
	Layers,
	Compass,
	Rocket,
	FileText,
	TrendingUp,
	Lock,
	Database,
	Brain,
	Lightbulb,
	Banknote,
	MousePointerClick,
	GitFork,
	Sparkles,
} from 'lucide-react'

export default function HomePage() {
	const { dark } = useTheme()
	const d = dark

	const [user, setUser] = useState<any>(null)
	useEffect(() => {
		setUser(getStoredUser())
	}, [])

	return (
		<div
			className={`antialiased min-h-screen transition-colors duration-300 ${d ? 'bg-[#0d1117] text-white' : 'bg-white text-gray-900'}`}>
			{/* ── Hero ── */}
			<section
				className={`relative min-h-[calc(100vh-50px)] flex flex-col justify-center py-12 lg:py-16 px-6 lg:px-8 overflow-hidden bg-cover bg-center ${d ? 'bg-[#0d1117]/90 bg-blend-overlay' : 'bg-gray-50/40 bg-blend-overlay'}`}
				style={{ backgroundImage: "url('/images/hero-background.png')" }}>
				{/* Background glows */}
				{d && (
					<div className='absolute top-10 left-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl pointer-events-none' />
				)}
				{d && (
					<div className='absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-orange-500/5 blur-3xl pointer-events-none' />
				)}
				<div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 w-full items-center relative z-10'>
					{/* Left */}
					<div className='flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-7 px-4 sm:px-6 lg:px-0 lg:pr-6'>
						<div className='inline-flex self-center lg:self-start items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20'>
							<span className='w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse' />
							<span className={`text-xs font-bold uppercase tracking-widest ${d ? 'text-teal-400' : 'text-teal-700'}`}>
								Precision Business Intelligence
							</span>
						</div>
						<h1 className='text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight text-center lg:text-left'>
							Most Businesses Are{' '}
							<br className='hidden lg:inline' />
							Not{' '}
							<span className={d ? 'text-teal-400' : 'text-teal-700'}>
								Broken
							</span>{' '}
							<br />
							They Are{' '}
							<br className='hidden lg:inline' />
							Misdiagnosed
						</h1>
						<p
							className={`text-base md:text-lg leading-relaxed max-w-lg text-center lg:text-left mx-auto lg:mx-0 ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							Growth failure is rarely a lack of
							effort; it's a lack of clarity in the
							initial assessment.
						</p>
						<div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 pt-2 w-full max-w-md lg:max-w-none'>
							<Link
								href='/pages/about'
								className='px-12 py-4 rounded-full bg-[#f97316] hover:bg-[#ea6c0a] text-white text-base font-bold transition-all text-center shadow-xl shadow-orange-500/20 hover:scale-[1.05] active:scale-95'>
								Start Free Scan
							</Link>
						</div>
					</div>

					{/* Right — Dashboard mockup with landing1 image */}
					<div className="relative w-full h-[320px] sm:h-[480px] lg:h-[580px]">
						<Image
							src="/images/dashboard img.png"
							alt="PICA Dashboard Preview"
							fill
							priority
							className="object-contain"
						/>
					</div>
				</div>

				{/* Three Core Cards */}
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-0 relative z-10'>
					<div
						className={`p-6 rounded-2xl border ${d ? 'bg-[#161b22] border-white/10' : 'bg-white border-gray-200 shadow-sm'} flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1`}>
						<div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
							<Shield className={`w-5 h-5 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
						</div>
						<h3
							className={`text-base font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
							Surface-Level Solutions
						</h3>
						<p
							className={`text-xs leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							Treating symptoms (low sales) instead
							of the root cause (market misalignment
							or poor operations).
						</p>
					</div>
					<div
						className={`p-6 rounded-2xl border ${d ? 'bg-[#161b22] border-white/10' : 'bg-white border-gray-200 shadow-sm'} flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1`}>
						<div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
							<Brain className={`w-5 h-5 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
						</div>
						<h3
							className={`text-base font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
							Guesswork Decisions
						</h3>
						<p
							className={`text-xs leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							Relying on &ldquo;gut feeling&rdquo;
							in complex scaling environments leads
							to expensive structural debt.
						</p>
					</div>
					<div
						className={`p-6 rounded-2xl border ${d ? 'bg-[#161b22] border-white/10' : 'bg-white border-gray-200 shadow-sm'} flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1`}>
						<div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d ? 'bg-teal-500/10' : 'bg-teal-50'}`}>
							<Layers className={`w-5 h-5 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
						</div>
						<h3
							className={`text-base font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
							System-Level Solutions
						</h3>
						<p
							className={`text-xs leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							Implementing software or hiring staff
							to fix problems that require
							foundational restructuring.
						</p>
					</div>
				</div>
			</section>

			{/* ── Quote Block ── */}
			<section
				className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? 'bg-[#161b22] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
				<div className='max-w-5xl mx-auto text-center space-y-8'>
					<div className='space-y-6'>
						<h2
							className={`text-3xl md:text-5xl font-black italic leading-tight ${d ? 'text-white' : 'text-gray-900'}`}>
							&ldquo;You cannot fix what you{' '}
							<br className='hidden sm:inline' />
							cannot{' '}
							<span className='text-[#f97316]'>
								see.
							</span>
							&rdquo;
						</h2>
						<p
							className={`text-sm md:text-base leading-relaxed max-w-2xl mx-auto ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							PICA provides business owners with the
							diagnostic clarity needed to identify
							blind spots, optimize operations, and
							scale with confidence.
						</p>
					</div>

					{/* Three pillars stepper */}
					<div className='flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto pt-8 relative'>
						<div className='flex-1 flex flex-col items-center text-center'>
							<span className={`text-3xl font-black mb-2 ${d ? 'text-teal-500' : 'text-teal-700'}`}>
								01
							</span>
							<p
								className={`text-xs uppercase tracking-widest font-black ${d ? 'text-white' : 'text-gray-900'}`}>
								Clarity Before Strategy
							</p>
						</div>
						<div
							className={`hidden md:block h-px flex-1 border-t border-dashed ${d ? 'border-white/10' : 'border-gray-200'} max-w-[80px]`}
						/>
						<div className='flex-1 flex flex-col items-center text-center'>
							<span className={`text-3xl font-black mb-2 ${d ? 'text-teal-500' : 'text-teal-700'}`}>
								02
							</span>
							<p
								className={`text-xs uppercase tracking-widest font-black ${d ? 'text-white' : 'text-gray-900'}`}>
								Diagnosis Before Growth
							</p>
						</div>
						<div
							className={`hidden md:block h-px flex-1 border-t border-dashed ${d ? 'border-white/10' : 'border-gray-200'} max-w-[80px]`}
						/>
						<div className='flex-1 flex flex-col items-center text-center'>
							<span className={`text-3xl font-black mb-2 ${d ? 'text-teal-500' : 'text-teal-700'}`}>
								03
							</span>
							<p
								className={`text-xs uppercase tracking-widest font-black ${d ? 'text-white' : 'text-gray-900'}`}>
								Understanding Before Funding
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ── The PICA Ecosystem ── */}
			<section
				className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? 'bg-[#0d1117] border-white/5' : 'bg-white border-gray-200'}`}>
				<div className='max-w-7xl mx-auto space-y-12'>
					<div className='text-center space-y-3'>
						<h2
							className={`text-3xl md:text-4xl font-black ${d ? 'text-white' : 'text-gray-900'}`}>
							The PICA Ecosystem
						</h2>
						<p
							className={`text-sm max-w-2xl mx-auto ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							A unified framework that transforms
							raw business energy into structured
							intelligence.
						</p>
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch'>
						{[
							{
								letter: 'P',
								title: 'Pain-point',
								desc: 'Isolating the core friction points that drain resources and energy.',
								icon: (
									<Eye className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								color: 'from-teal-500/20 to-teal-500/5',
								hasNext: true,
							},
							{
								letter: 'I',
								title: 'Identification',
								desc: 'Pinpointing the structural root causes within the business architecture.',
								icon: (
									<Search className='w-6 h-6 text-[#f97316]' />
								),
								color: 'from-orange-500/20 to-orange-500/5',
								hasNext: true,
							},
							{
								letter: 'C',
								title: 'Classification',
								desc: 'Sorting obstacles into the 7 architectural pillars for targeted action.',
								icon: (
									<Lightbulb className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								color: 'from-teal-500/20 to-teal-500/5',
								hasNext: true,
							},
							{
								letter: 'A',
								title: 'Assessment',
								desc: 'Validating solutions through data-driven scoring and feedback loops.',
								icon: (
									<Rocket className='w-6 h-6 text-[#f97316]' />
								),
								color: 'from-orange-500/20 to-orange-500/5',
								hasNext: false,
							},
						].map(
							({
								letter,
								title,
								desc,
								icon,
								color,
								hasNext,
							}) => (
								<div
									key={letter}
									className='relative flex flex-col'>
									<div
										className={`group flex flex-col items-center gap-4 p-6 lg:p-8 rounded-2xl border text-center h-full transition-all duration-300 hover:-translate-y-1 ${d ? 'bg-[#161b22] border-white/10 hover:border-teal-500/30 hover:shadow-xl hover:shadow-teal-500/[0.02]' : 'bg-gray-50 border-gray-200 hover:border-teal-500/30 hover:shadow-xl hover:shadow-gray-200/50'}`}>
										<div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f97316]/20 to-[#f97316]/5 flex items-center justify-center'>
											<span className='text-2xl font-black text-[#f97316]'>
												{letter}
											</span>
										</div>
										<h3
											className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
											{title}
										</h3>
										<p
											className={`text-xs leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
											{desc}
										</p>
									</div>
									{hasNext && (
										<div className='hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 items-center justify-center text-[#f97316]'>
											<span className='text-xl font-bold opacity-65'>
												&gt;
											</span>
										</div>
									)}
								</div>
							),
						)}
					</div>
				</div>
			</section>

			{/* ── Capabilities ── */}
			<section
				className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? 'bg-[#161b22] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
				<div className='max-w-7xl mx-auto space-y-12'>
					<div className='space-y-3'>
						<p className={`text-xs font-bold tracking-widest uppercase ${d ? 'text-teal-400' : 'text-teal-700'}`}>
							Core Capabilities
						</p>
						<h2
							className={`text-3xl md:text-4xl font-black ${d ? 'text-white' : 'text-gray-900'}`}>
							Comprehensive Diagnostics for
							Businesses
						</h2>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8'>
						{[
							{
								icon: (
									<Search className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								title: 'Blind Spot Discovery',
								desc: 'Identify structural weaknesses in your business model that standard accounting software misses.',
							},
							{
								icon: (
									<BarChart2 className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								title: 'Performance Benchmarking',
								desc: 'Compare your KPIs against top-performing businesses in your specific sector.',
							},
							{
								icon: (
									<Rocket className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								title: 'Growth Readiness',
								desc: 'Determine if your infrastructure is truly ready for high-velocity scaling without breaking.',
							},
						].map(({ icon, title, desc }) => (
							<div
								key={title}
								className={`group p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${d ? 'bg-[#0d1117] border-white/10 hover:border-teal-500/30 hover:shadow-xl hover:shadow-teal-500/[0.02]' : 'bg-white border-gray-200 hover:border-teal-500/30 hover:shadow-xl hover:shadow-gray-200/50'}`}>
								<div className='mb-6 w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:scale-105 group-hover:bg-teal-500/20 transition-all duration-200'>
									{icon}
								</div>
								<h3
									className={`text-lg font-bold mb-3 ${d ? 'text-white' : 'text-gray-900'}`}>
									{title}
								</h3>
								<p
									className={`text-sm leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
									{desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── 7 Pillars ── */}
			<section
				className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? 'bg-[#0d1117] border-white/5' : 'bg-white border-gray-200'}`}>
				<div className='max-w-7xl mx-auto space-y-12'>
					<div className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 items-center border-b pb-8 ${d ? 'border-white/5' : 'border-gray-200'}`}>
						<div className='space-y-3'>
							<p className={`text-xs font-bold tracking-widest uppercase ${d ? 'text-teal-400' : 'text-teal-700'}`}>
								Structural Foundation
							</p>
							<h2
								className={`text-3xl md:text-4xl font-black ${d ? 'text-white' : 'text-gray-900'}`}>
								The 7 Pillars of Business
								Resilience
							</h2>
						</div>
						<p
							className={`text-sm md:text-base leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							Every diagnostic explores these
							interconnected areas to build a
							bulletproof operation.
						</p>
					</div>
					<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'>
						{[
							{
								icon: (
									<Users className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								label: 'Founder & Leadership Capacity',
							},
							{
								icon: (
									<GitFork className={`w-6 h-6 rotate-90 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								label: 'Business Model Strenght',
							},
							{
								icon: (
									<MousePointerClick className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								label: 'Market & Competitive Position',
							},
							{
								icon: (
									<Banknote className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								label: 'Financial Readiness/Control',
							},
							{
								icon: (
									<Sparkles className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								label: 'Operations Processes & Execution',
							},
							{
								icon: (
									<Shield className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								label: 'Governance Culture & Structure',
							},
							{
								icon: (
									<Lightbulb className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								label: 'Growth Scalability and Sustainability',
							},
						].map(({ icon, label }) => (
							<div
								key={label}
								className={`flex flex-col items-center gap-4 p-6 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40 ${d ? 'bg-[#161b22] border-white/10' : 'bg-gray-50 border-gray-200 hover:shadow-md hover:shadow-gray-200/20'}`}>
								<div className='w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center'>
									{icon}
								</div>
								<span
									className={`text-sm font-semibold ${d ? 'text-gray-300' : 'text-gray-700'}`}>
									{label}
								</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── Three Layers of Business Health Check ── */}
			<section
				className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? 'bg-[#161b22] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
				<div className='max-w-7xl mx-auto space-y-12'>
					<div className='text-center max-w-2xl mx-auto space-y-3'>
						<h2
							className={`text-3xl md:text-4xl font-black ${d ? 'text-white' : 'text-gray-900'}`}>
							The Three Layers of{' '}
							<span className='text-[#f97316]'>
								Business Health Check
							</span>
						</h2>
						<p
							className={`text-sm md:text-base ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							From instant insights to deep-dive
							analysis.
						</p>
					</div>
					<div className='max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8'>
						{/* Layer 01 - Awareness */}
						<div
							className={`rounded-2xl p-6 lg:p-8 border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${d ? 'bg-[#0d1117] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
							<div className='space-y-4'>
								<h3
									className={`text-2xl font-black ${d ? 'text-white' : 'text-gray-900'}`}>
									Awareness
								</h3>
								<p className={`text-[10px] font-bold uppercase tracking-wider leading-relaxed ${d ? 'text-teal-400' : 'text-teal-700'}`}>
									FULL VISIBILITY ACROSS ALL
									OPERATIONAL CHANNELS. NO
									MORE DARK SPOTS.
								</p>
								<ul className='space-y-3 pt-2'>
									{[
										'15-Minute Audit',
										'High-Level Health Score',
										'Top 3 Risk Factors',
									].map((item) => (
										<li
											key={item}
											className={`flex items-center gap-2.5 text-sm ${d ? 'text-gray-400' : 'text-gray-600'}`}>
											<CheckCircle className={`w-4 h-4 flex-shrink-0 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
											{item}
										</li>
									))}
								</ul>
							</div>
							<Link
								href='/pages/about'
								className={`mt-8 w-full py-3 rounded-xl text-xs font-bold text-white text-center block active:scale-95 transition-all shadow-md ${d ? 'bg-[#1f2937] hover:bg-gray-800' : 'bg-[#1f2937] hover:bg-gray-800'}`}>
								Start Free Scan
							</Link>
						</div>

						{/* Layer 02 - Full Diagnostics (featured) */}
						<div className={`rounded-2xl p-6 lg:p-8 border border-teal-500/40 relative flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/[0.03] ${d ? 'bg-[#152e22]' : 'bg-teal-50'}`}>
							<div className='absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg'>
								MOST SELECTED
							</div>
							<div className='space-y-4 pt-2'>
								<h3 className={`text-2xl font-black ${d ? 'text-white' : 'text-gray-900'}`}>
									Full Diagnostics
								</h3>
								<p className={`text-[10px] font-bold uppercase tracking-wider leading-relaxed ${d ? 'text-teal-400' : 'text-teal-700'}`}>
									AUTOMATED IDENTIFICATION
									OF STRUCTURAL
									INEFFICIENCIES AND RISK
									FACTORS.
								</p>
								<ul className='space-y-3 pt-2'>
									{[
										'Complete 7-Pillar Review',
										'Gap Analysis Report',
										'Priority Roadmap',
									].map((item) => (
										<li
											key={item}
											className={`flex items-center gap-2.5 text-sm ${d ? 'text-gray-200' : 'text-gray-700'}`}>
											<CheckCircle className={`w-4 h-4 flex-shrink-0 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
											{item}
										</li>
									))}
								</ul>
							</div>
							<Link
								href='/pages/fulldiagnostic'
								className='mt-8 w-full py-3 rounded-xl text-xs font-bold bg-[#FFAF66] hover:bg-[#ea9c53] text-gray-900 transition-all text-center block shadow-lg active:scale-95'>
								Get Diagnostic
							</Link>
						</div>

						{/* Layer 03 - Intelligence */}
						<div
							className={`rounded-2xl p-6 lg:p-8 border flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${d ? 'bg-[#13281d] border-teal-800/40 hover:border-teal-700/40' : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'}`}>
							<div className='space-y-4'>
								<h3
									className={`text-2xl font-black ${d ? 'text-white' : 'text-gray-900'}`}>
									Intelligence
								</h3>
								<p className={`text-[10px] font-bold uppercase tracking-wider leading-relaxed ${d ? 'text-teal-400' : 'text-teal-700'}`}>
									DEEP-DIVE MODELING FOR
									FUTURE GROWTH AND RISK
									MITIGATION.
								</p>
								<ul className='space-y-3 pt-2'>
									{[
										'Monthly Deep-Dives',
										'Competitor Intelligence',
										'Board-Level Dashboards',
									].map((item) => (
										<li
											key={item}
											className={`flex items-center gap-2.5 text-sm ${d ? 'text-gray-400' : 'text-gray-600'}`}>
											<CheckCircle className={`w-4 h-4 flex-shrink-0 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
											{item}
										</li>
									))}
								</ul>
							</div>
							<Link
								href='/pages/picafulldiagnostic'
								className={`mt-8 w-full py-3 rounded-xl text-xs font-bold text-white text-center block active:scale-95 transition-all shadow-md ${d ? 'bg-[#1f2937] hover:bg-gray-800' : 'bg-[#1f2937] hover:bg-gray-800'}`}>
								Get deep dive
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* ── Data You Can Actually Use ── */}
			<section
				className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? 'bg-[#0d1117] border-white/5' : 'bg-white border-gray-200'}`}>
				<div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center'>
					<div className='space-y-6'>
						<div className='space-y-3'>
							<p className={`text-xs font-bold tracking-widest uppercase ${d ? 'text-teal-400' : 'text-teal-700'}`}>
								Output Quality
							</p>
							<h2
								className={`text-3xl md:text-4xl font-black ${d ? 'text-white' : 'text-gray-900'}`}>
								Data You Can Actually Use
							</h2>
						</div>
						<p
							className={`text-sm md:text-base leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							No generic advice. Our reports provide pinpoint detail on where your money is leaking and where your next 10x growth will come from.
						</p>
						<div className='space-y-4 pt-2'>
							<div className='flex items-start gap-4'>
								<div className='w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5'>
									<AlertTriangle className='w-5 h-5 text-[#f97316]' />
								</div>
								<div>
									<p
										className={`text-sm font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
										Risk Identification
									</p>
									<p
										className={`text-xs mt-1 ${d ? 'text-gray-400' : 'text-gray-600'}`}>
										Immediate flags for
										legal, financial, or
										operational
										exposure.
									</p>
								</div>
							</div>
							<div className='flex items-start gap-4'>
								<div className='w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5'>
									<Zap className='w-5 h-5 text-[#f97316]' />
								</div>
								<div>
									<p
										className={`text-sm font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
										Efficiency
										Multipliers
									</p>
									<p
										className={`text-xs mt-1 ${d ? 'text-gray-400' : 'text-gray-600'}`}>
										Actionable steps to
										increase margin
										without raising
										prices.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Executive Summary Card */}
					<div
						className={`rounded-2xl border p-6 lg:p-8 shadow-2xl ${d ? 'bg-[#161b22] border-white/10 shadow-black/40' : 'bg-white border-gray-200'}`}>
						<div className={`flex items-center justify-between mb-4 border-b pb-3 ${d ? 'border-white/5' : 'border-gray-200'}`}>
							<p className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>
								DIAGNOSTIC REPORT V2.4
							</p>
							<p className='text-[10px] font-bold text-gray-500'>
								Mar 24, 2024
							</p>
						</div>
						<h3
							className={`text-lg font-extrabold mb-4 ${d ? 'text-white' : 'text-gray-900'}`}>
							Executive Summary
						</h3>
						<div className='flex items-center gap-12 mb-6'>
							<div>
								<p className='text-xs text-gray-500 mb-1'>
									Risk Score
								</p>
								<p className='text-4xl font-black text-[#f97316]'>
									68%
								</p>
							</div>
							<div>
								<p className='text-xs text-gray-500 mb-1'>
									Risk Profile
								</p>
								<p className={`text-lg font-bold ${d ? 'text-red-400' : 'text-red-600'}`}>
									Moderate High
								</p>
							</div>
						</div>
						<div className='space-y-3'>
							<div
								className={`rounded-xl p-4 border-l-4 border-red-500 ${d ? 'bg-red-500/10' : 'bg-red-50'}`}>
								<p className={`text-xs font-bold mb-1 flex items-center gap-1 ${d ? 'text-red-400' : 'text-red-600'}`}>
									<span className='w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse' />
									CRITICAL: Cash-Flow
									Concentration
								</p>
								<p
									className={`text-xs leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
									82% of revenue depends on
									2 B2B clients.
									Diversification required
									within 90 days.
								</p>
							</div>
							<div
								className={`rounded-xl p-4 border-l-4 border-yellow-500 ${d ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
								<p className={`text-xs font-bold mb-1 flex items-center gap-1 ${d ? 'text-yellow-400' : 'text-yellow-700'}`}>
									<span className='w-1.5 h-1.5 rounded-full bg-yellow-500' />
									ADVISORY: OpEx
									Optimization
								</p>
								<p
									className={`text-xs leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
									Inventory turnover lags
									sector benchmark by 14
									days. Capital locked in
									stagnant stock.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── The Path to Clarity ── */}
			<section
				className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? 'bg-[#161b22] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
				<div className='max-w-7xl mx-auto space-y-16'>
					<div className='text-center space-y-3'>
						<h2
							className={`text-3xl md:text-4xl font-black ${d ? 'text-white' : 'text-gray-900'}`}>
							The Path to Clarity
						</h2>
					</div>

					{/* Stepper progress timeline */}
					<div className='relative'>
						{/* Connecting line */}
						<div
							className={`absolute top-5 left-8 right-8 h-0.5 hidden lg:block ${d ? 'bg-white/10' : 'bg-gray-200'}`}
						/>

						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10'>
							{[
								{
									step: '1',
									title: 'Take Assessment',
									desc: 'A 15-minute precision inquiry into your current operations.',
								},
								{
									step: '2',
									title: 'Get Scored',
									desc: 'Our engine evaluates your data against the 7-pillar framework.',
								},
								{
									step: '3',
									title: 'Receive Report',
									desc: 'A comprehensive architectural map of your business health.',
								},
								{
									step: '4',
									title: 'Take Action',
									desc: 'Execute on specific, prioritized steps for structural growth.',
								},
							].map(({ step, title, desc }) => (
								<div
									key={step}
									className='flex flex-col items-start px-4'>
									<div className='w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-lg mb-4'>
										{step}
									</div>
									<h3
										className={`text-lg font-bold mb-2 ${d ? 'text-white' : 'text-gray-900'}`}>
										{step}. {title}
									</h3>
									<p
										className={`text-xs leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
										{desc}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ── Built on Structured Logic, Not Hype ── */}
			<section
				className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? 'bg-[#0d1117] border-white/5' : 'bg-white border-gray-200'}`}>
				<div className='max-w-7xl mx-auto space-y-12'>
					<div className='text-center max-w-2xl mx-auto space-y-3'>
						<p className={`text-xs font-bold tracking-widest uppercase ${d ? 'text-teal-400' : 'text-teal-700'}`}>
							Trust & Methodology
						</p>
						<h2
							className={`text-3xl md:text-4xl font-black ${d ? 'text-white' : 'text-gray-900'}`}>
							Built on Structured Logic,{' '}
							<span className={d ? 'text-teal-400' : 'text-teal-700'}>
								Not Hype
							</span>
						</h2>
						<p
							className={`text-sm md:text-base leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							PICA was born from the observation of
							thousands of business failures. Our
							methodology is a synthesis of
							industrial logic and modern data
							science.
						</p>
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
						{[
							{
								icon: (
									<Database className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								title: 'Data-First Approach',
								desc: 'Quantifiable metrics drive every recommendation we make.',
							},
							{
								icon: (
									<Lock className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								title: 'Your Data is Private',
								desc: 'Enterprise-grade encryption. Your business data is never shared or sold.',
							},
							{
								icon: (
									<Brain className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								title: 'Expert-Backed Models',
								desc: 'Diagnostic frameworks validated by seasoned business consultants.',
							},
							{
								icon: (
									<FileText className={`w-6 h-6 ${d ? 'text-teal-400' : 'text-teal-700'}`} />
								),
								title: 'Actionable Reports',
								desc: 'Every report comes with a priority-ranked roadmap you can execute immediately.',
							},
						].map(({ icon, title, desc }) => (
							<div
								key={title}
								className={`group p-6 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-1 ${d ? 'bg-[#161b22] border-white/10 hover:border-teal-500/30' : 'bg-gray-50 border-gray-200 hover:border-teal-500/30 hover:shadow-lg'}`}>
								<div className='mb-4 w-12 h-12 mx-auto rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300'>
									{icon}
								</div>
								<h3
									className={`text-sm font-bold mb-2 ${d ? 'text-white' : 'text-gray-900'}`}>
									{title}
								</h3>
								<p
									className={`text-xs leading-relaxed ${d ? 'text-gray-400' : 'text-gray-600'}`}>
									{desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── Economy Section (Scan Call to Action) ── */}
			<section
				className={`py-20 md:py-28 px-6 lg:px-8 border-t ${d ? 'bg-[#161b22] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
				<div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center'>
					{/* Image */}
					<div
						className={`rounded-3xl overflow-hidden relative shadow-xl ${d ? 'bg-[#0d1117]/50 border border-white/10 shadow-black/40' : 'bg-gray-100 border border-gray-200'}`}
						style={{ minHeight: '320px' }}>
						<div
							className='relative w-full h-full'
							style={{ minHeight: '320px' }}>
							<Image
								src='/images/landing2.png'
								alt='PICA Consulting Session'
								fill
								className='object-cover'
							/>
						</div>
					</div>
					<div className='space-y-6'>
						<h2
							className={`text-3xl md:text-4xl font-black leading-tight ${d ? 'text-white' : 'text-gray-900'}`}>
							The Economy is Changing.
							<br />
							<span className={d ? 'text-teal-400' : 'text-teal-700'}>
								Is Your Business?
							</span>
						</h2>
						<p
							className={`text-sm md:text-base leading-relaxed mb-4 ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							In a volatile market, guessing is a
							liability. PICA gives you the
							empirical data to survive headwinds
							and capture opportunities before your
							competitors even see them.
						</p>

						{/* Scan Call to Action Block */}
						<div className='border-l-4 border-teal-400 pl-4 py-2 space-y-4'>
							<p
								className={`text-sm italic ${d ? 'text-gray-300' : 'text-gray-600'}`}>
								Get Instant Clarity on Your
								Business
							</p>
							<div>
								<Link
									href='/pages/about'
									className='inline-block px-8 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.03] active:scale-95'>
									Run Your Free Scan Now
								</Link>
							</div>
							<p className='text-[9px] text-gray-500 font-bold uppercase tracking-wider'>
								No credit card required &bull;
								Takes 15 minutes
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ── CTA Banner ── */}
			<section className='py-16 md:py-24 px-6 lg:px-8 bg-gradient-to-br from-[#ea580c] via-[#f97316] to-[#facc15] relative overflow-hidden'>
				{/* Decorative Circles */}
				<div className='absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none' />
				<div className='absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-black/5 blur-2xl pointer-events-none' />
				<div className='max-w-4xl mx-auto text-center space-y-6 relative z-10'>
					<h2 className='text-3xl md:text-5xl font-black text-gray-900 leading-tight'>
						Understand your business before{' '}
						<br className='hidden sm:inline' />
						you try to grow it.
					</h2>
					<p className='text-base md:text-lg text-gray-900/80 font-medium max-w-xl mx-auto'>
						Join founders and business owners who
						stopped guessing and started scaling with
						precision.
					</p>
					<div className='pt-2'>
						<Link
							href='/pages/about'
							className='inline-block px-10 py-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold uppercase tracking-wider transition-all shadow-xl shadow-black/20 hover:scale-105 active:scale-95'>
							Start Free Scan
						</Link>
					</div>
					<p className='text-[10px] text-gray-900/60 font-bold uppercase tracking-widest pt-2'>
						NO CREDIT CARD REQUIRED · TAKES 15 MINUTES
					</p>
				</div>
			</section>

			{/* ── Footer ── */}
			<footer
				className={`px-6 py-12 border-t text-xs ${d ? 'bg-[#0d1117] border-white/5' : 'bg-white border-gray-200'}`}>
				<div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6'>
					<Link
						href='/'
						className='flex items-center gap-2'>
						<Image
							src='/images/favicon.png'
							alt='Beauvision'
							width={20}
							height={20}
							className='h-5 w-5 object-contain'
						/>
						<span
							className={`text-sm font-bold tracking-tight ${d ? 'text-white' : 'text-gray-900'}`}>
							Beauvision
						</span>
					</Link>
					<div className='flex flex-wrap items-center justify-center gap-4 md:gap-8'>
						{[
							{
								label: 'Privacy Policy',
								href: '/data-policy',
							},
							{
								label: 'Terms of Service',
								href: '/terms',
							},
							{
								label: 'Platform Guide',
								href: '/documentation',
							},
							{
								label: 'Contact Support',
								href: '/pages/contact',
							},
						].map(({ label, href }) => (
							<Link
								key={label}
								href={href}
								className={`transition hover:opacity-70 ${d ? 'text-gray-400' : 'text-gray-500'}`}>
								{label}
							</Link>
						))}
					</div>
					<p
						className={
							d ? 'text-gray-500' : 'text-gray-400'
						}>
						© Beauvision 2026. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	)
}
