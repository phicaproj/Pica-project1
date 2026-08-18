'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, MapPin } from 'lucide-react'
import { SignUp } from '@/lib/authClient'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'

// Hoisted out of SignUpPage so the icon component identities are stable and
// the password-eye toggle flips immediately instead of remounting on each
// render — see Auth/login/page.tsx for the same fix.
const EyeIcon = () => (
	<svg
		xmlns='http://www.w3.org/2000/svg' //
		className='w-5 h-5'
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
		strokeWidth={1.5}>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			d='M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z'
		/>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
		/>
	</svg>
)

const EyeOffIcon = () => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		className='w-5 h-5'
		fill='none'
		viewBox='0 0 24 24'
		stroke='currentColor'
		strokeWidth={1.5}>
		<path
			strokeLinecap='round'
			strokeLinejoin='round'
			d='M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88'
		/>
	</svg>
)

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

export default function SignUpPage() {
	const { dark } = useTheme()
	const d = dark
	const [showPassword, setShowPassword] = useState(false)
	const [showPasswordHint, setShowPasswordHint] = useState(false)
	const [agreed, setAgreed] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	const router = useRouter()

	const [countriesData, setCountriesData] = useState<any[]>([])
	const [apiFailed, setApiFailed] = useState(false)
	const [loadingCountries, setLoadingCountries] = useState(false)

	useEffect(() => {
		const fetchCountries = async () => {
			setLoadingCountries(true)
			try {
				const res = await fetch(
					'https://countriesnow.space/api/v0.1/countries/states',
				)
				const json = await res.json()
				if (json && !json.error && Array.isArray(json.data)) {
					const sorted = [...json.data].sort(
						(a: any, b: any) =>
							a.name.localeCompare(b.name),
					)
					setCountriesData(sorted)
				} else {
					setApiFailed(true)
				}
			} catch (err) {
				console.error('Error fetching countries API:', err)
				setApiFailed(true)
			} finally {
				setLoadingCountries(false)
			}
		}
		fetchCountries()
	}, [])

	const [form, setForm] = useState({
		firstName: '',
		lastName: '',
		businessName: '',
		email: '',
		phone: '',
		staffSize: '',
		industry: '',
		operatingYears: '',
		password: '',
		country: '',
		state: '',
	})

	const selectedCountryObj = countriesData.find(
		(c: any) => c.name === form.country,
	)
	const statesList = selectedCountryObj?.states || []
	const [submitError, setSubmitError] = useState('')

	const [errors, setErrors] = useState<Record<string, string>>({})

	const handleChange = (field: string, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }))
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
	}

	const validate = () => {
		const newErrors: Record<string, string> = {}
		if (!form.firstName.trim())
			newErrors.firstName = 'Contact first name is required'
		if (!form.lastName.trim())
			newErrors.lastName = 'Contact last name is required'
		if (!form.businessName)
			newErrors.businessName = 'Business name is required'
		if (!form.email) newErrors.email = 'Email is required'
		if (!form.phone) newErrors.phone = 'Phone number is required'
		if (!form.staffSize.trim()) {
			newErrors.staffSize = 'Staff size is required'
		} else if (!/^\d+$/.test(form.staffSize.trim())) {
			newErrors.staffSize =
				'Staff size must be a whole number (no decimals)'
		}
		if (!form.industry.trim()) newErrors.industry = 'Sector is required'
		if (!form.operatingYears.trim())
			newErrors.operatingYears = 'Years in operation is required'
		if (!form.country.trim()) newErrors.country = 'Country is required'
		if (!form.state.trim()) newErrors.state = 'State is required'
		if (!form.password) newErrors.password = 'Password is required'
		if (!agreed) newErrors.agreed = 'You must accept the terms'
		return newErrors
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)
		const newErrors = validate()
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors)
			setIsLoading(false)
			return
		}
		const res = await SignUp({ payload: form })
		if (res.error) {
			setIsLoading(false)
			setSubmitError(res.error.message)
		} else {
			setIsLoading(false)
			// Registration returns a verification-pending response; the OTP token is
			// stashed by SignUp/Login helpers. Send the user to the code screen.
			if (res.data && typeof window !== 'undefined') {
				sessionStorage.setItem(
					'pica.emailVerifyOtpToken',
					res.data.otpToken,
				)
			}
			router.push(
				`/Auth/verify-code?email=${encodeURIComponent(form.email)}&type=email-verify`,
			)
		}
	}

	// EyeIcon / EyeOffIcon are hoisted above this component — see top of file.

	return (
		<div className={`min-h-screen w-full flex flex-col ${d ? 'bg-[#0d1117]' : 'bg-gray-50'}`}>
			{/* Main content */}
			<div className='flex-1 flex items-center justify-center px-4 py-10'>
				<div className={`w-full max-w-5xl rounded-2xl border grid grid-cols-1 md:grid-cols-2 ${d ? 'border-white/10 bg-[#161b22]' : 'border-gray-200 bg-white'}`}>
					{/* Left — Form */}
					<div className='px-8 md:px-12 py-10'>
						{/* Back to home — see login/page.tsx for the same affordance. */}
						<Link
							href='/'
							className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest transition mb-6 ${d ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='w-3.5 h-3.5'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth={2}>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M15 19l-7-7 7-7'
								/>
							</svg>
							Back to home
						</Link>
						{/* Logo */}
						<div className='flex items-center gap-2 mb-8'>
							<img
								src='/images/favicon.png'
								alt='Beauvision'
								className='h-6 w-6 object-contain'
							/>
							<span className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
								Beauvision
							</span>
						</div>

						<h2 className={`text-2xl font-bold mb-2 ${d ? 'text-white' : 'text-gray-900'}`}>
							Create Account
						</h2>
						<p className={`text-sm mb-8 ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							Join us today and get complete
							comprehensive analysis
						</p>

						{submitError && (
							<div className='mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex flex-col gap-3'>
								<p>{submitError}</p>
								{(submitError
									.toLowerCase()
									.includes('phase 1') ||
									submitError
										.toLowerCase()
										.includes(
											'free scan',
										) ||
									submitError
										.toLowerCase()
										.includes(
											'free assess',
										) ||
									submitError
										.toLowerCase()
										.includes(
											'free assestment',
										)) && (
									<Link
										href='/pages/freescan'
										className='self-start inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#f97316] hover:bg-[#ea6c0a] text-white text-xs font-bold transition'>
										Take Free Scan
									</Link>
								)}
							</div>
						)}

						<form
							onSubmit={handleSubmit}
							className='space-y-5'>
							{/* Contact person name */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<input
										type='text'
										placeholder='Contact first name*'
										value={
											form.firstName
										}
										onChange={(e) =>
											handleChange(
												'firstName',
												e.target
													.value,
											)
										}
										className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${d ? 'bg-[#0d1117] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} ${
											errors.firstName
												? 'border-red-500 focus:ring-red-400'
												: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
										}`}
									/>
									{errors.firstName && (
										<p className='text-red-500 text-xs mt-1'>
											{
												errors.firstName
											}
										</p>
									)}
								</div>
								<div>
									<input
										type='text'
										placeholder='Contact last name*'
										value={
											form.lastName
										}
										onChange={(e) =>
											handleChange(
												'lastName',
												e.target
													.value,
											)
										}
										className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${d ? 'bg-[#0d1117] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} ${
											errors.lastName
												? 'border-red-500 focus:ring-red-400'
												: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
										}`}
									/>
									{errors.lastName && (
										<p className='text-red-500 text-xs mt-1'>
											{
												errors.lastName
											}
										</p>
									)}
								</div>
							</div>

							{/* Business Name */}
							<div>
								<input
									type='text'
									placeholder='Business name*'
									value={form.businessName}
									onChange={(e) =>
										handleChange(
											'businessName',
											e.target
												.value,
										)
									}
									className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${d ? 'bg-[#0d1117] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} ${
										errors.businessName
											? 'border-red-500 focus:ring-red-400'
											: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
									}`}
								/>
								{errors.businessName && (
									<p className='text-red-500 text-xs mt-1'>
										{
											errors.businessName
										}
									</p>
								)}
							</div>

							{/* Business Email */}
							<div>
								<input
									type='email'
									placeholder='Business email*'
									value={form.email}
									onChange={(e) =>
										handleChange(
											'email',
											e.target
												.value,
										)
									}
									className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${d ? 'bg-[#0d1117] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} ${
										errors.email
											? 'border-red-500 focus:ring-red-400'
											: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
									}`}
								/>
								{errors.email && (
									<p className='text-red-500 text-xs mt-1'>
										{errors.email}
									</p>
								)}
							</div>

							{/* Phone Number */}
							<div>
								<input
									type='tel'
									placeholder='Phone number*'
									value={form.phone}
									onChange={(e) =>
										handleChange(
											'phone',
											e.target
												.value,
										)
									}
									className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${d ? 'bg-[#0d1117] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} ${
										errors.phone
											? 'border-red-500 focus:ring-red-400'
											: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
									}`}
								/>
								{errors.phone && (
									<p className='text-red-500 text-xs mt-1'>
										{errors.phone}
									</p>
								)}
							</div>

							{/* Staff size + years in operation */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<input
										type='number'
										min={1}
										step={1}
										placeholder='Staff size*'
										value={
											form.staffSize
										}
										onKeyDown={(e) => {
											// Whole numbers only — block decimals and exponent entry.
											if (
												[
													'e',
													'E',
													'+',
													'-',
													'.',
												].includes(
													e.key,
												)
											)
												e.preventDefault()
										}}
										onChange={(e) =>
											handleChange(
												'staffSize',
												e.target
													.value,
											)
										}
										className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${d ? 'bg-[#0d1117] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} ${
											errors.staffSize
												? 'border-red-500 focus:ring-red-400'
												: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
										}`}
									/>
									{errors.staffSize && (
										<p className='text-red-500 text-xs mt-1'>
											{
												errors.staffSize
											}
										</p>
									)}
								</div>
								<div>
									<input
										type='number'
										min={0}
										step={1}
										placeholder='Years in operation*'
										value={
											form.operatingYears
										}
										onKeyDown={(e) => {
											if (
												[
													'e',
													'E',
													'+',
													'-',
													'.',
												].includes(
													e.key,
												)
											)
												e.preventDefault()
										}}
										onChange={(e) =>
											handleChange(
												'operatingYears',
												e.target
													.value,
											)
										}
										className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${d ? 'bg-[#0d1117] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} ${
											errors.operatingYears
												? 'border-red-500 focus:ring-red-400'
												: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
										}`}
									/>
									{errors.operatingYears && (
										<p className='text-red-500 text-xs mt-1'>
											{
												errors.operatingYears
											}
										</p>
									)}
								</div>
							</div>

							{/* Sector / industry dropdown */}
							<div className='relative'>
								<select
									value={form.industry}
									onChange={(e) =>
										handleChange(
											'industry',
											e.target
												.value,
										)
									}
									className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition appearance-none pr-10 ${d ? 'bg-[#0d1117] text-white' : 'bg-gray-50 text-gray-900'} ${
										errors.industry
											? 'border-red-500 focus:ring-red-400'
											: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
									}`}>
									<option
										value=''
										disabled
										className={d ? 'text-gray-500 bg-[#0d1117]' : 'text-gray-400 bg-white'}>
										Select Sector /
										Industry*
									</option>
									{INDUSTRIES.map((ind) => (
										<option
											key={ind}
											value={ind}
											className={d ? 'bg-[#0d1117] text-white' : 'bg-white text-gray-900'}>
											{ind}
										</option>
									))}
								</select>
								<ChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none' />
								{errors.industry && (
									<p className='text-red-500 text-xs mt-1'>
										{errors.industry}
									</p>
								)}
							</div>

							{/* Country and State dropdowns */}
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div className='relative'>
									<select
										value={form.country}
										onChange={(e) => {
											handleChange(
												'country',
												e.target
													.value,
											)
											handleChange(
												'state',
												'',
											)
										}}
										className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition appearance-none pr-10 ${d ? 'bg-[#0d1117] text-white' : 'bg-gray-50 text-gray-900'} ${
											errors.country
												? 'border-red-500 focus:ring-red-400'
												: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
										}`}>
										<option
											value=''
											disabled
											className={d ? 'text-gray-500 bg-[#0d1117]' : 'text-gray-400 bg-white'}>
											Select
											Country*
										</option>
										{countriesData.map(
											(c) => (
												<option
													key={
														c.name
													}
													value={
														c.name
													}
													className={d ? 'bg-[#0d1117] text-white' : 'bg-white text-gray-900'}>
													{
														c.name
													}
												</option>
											),
										)}
									</select>
									<ChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none' />
									{errors.country && (
										<p className='text-red-500 text-xs mt-1'>
											{
												errors.country
											}
										</p>
									)}
								</div>

								<div className='relative'>
									{statesList.length ===
									0 ? (
										<input
											type='text'
											placeholder='State / Province*'
											value={
												form.state
											}
											onChange={(
												e,
											) =>
												handleChange(
													'state',
													e
														.target
														.value,
												)
											}
											className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition ${d ? 'bg-[#0d1117] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} ${
												errors.state
													? 'border-red-500 focus:ring-red-400'
													: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
											}`}
										/>
									) : (
										<select
											value={
												form.state
											}
											onChange={(
												e,
											) =>
												handleChange(
													'state',
													e
														.target
														.value,
												)
											}
											className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition appearance-none pr-10 ${d ? 'bg-[#0d1117] text-white' : 'bg-gray-50 text-gray-900'} ${
												errors.state
													? 'border-red-500 focus:ring-red-400'
													: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
											}`}>
											<option
												value=''
												disabled
												className={d ? 'text-gray-500 bg-[#0d1117]' : 'text-gray-400 bg-white'}>
												Select
												State*
											</option>
											{statesList.map(
												(
													s: any,
												) => (
													<option
														key={
															s.name
														}
														value={
															s.name
														}
														className={d ? 'bg-[#0d1117] text-white' : 'bg-white text-gray-900'}>
														{
															s.name
														}
													</option>
												),
											)}
										</select>
									)}
									{statesList.length >
										0 && (
										<ChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none' />
									)}
									{errors.state && (
										<p className='text-red-500 text-xs mt-1'>
											{errors.state}
										</p>
									)}
								</div>
							</div>

							{/* Password with tooltip */}
							<div className='relative'>
								<div className='relative'>
									<input
										type={
											showPassword
												? 'text'
												: 'password'
										}
										placeholder='Password*'
										value={
											form.password
										}
										onChange={(e) =>
											handleChange(
												'password',
												e.target
													.value,
											)
										}
										onFocus={() =>
											setShowPasswordHint(
												true,
											)
										}
										onBlur={() =>
											setShowPasswordHint(
												false,
											)
										}
										className={`w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition pr-12 ${d ? 'bg-[#0d1117] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} ${
											errors.password
												? 'border-red-500 focus:ring-red-400'
												: d ? 'border-white/10 focus:ring-[#f97316]/50' : 'border-gray-200 focus:ring-[#f97316]/50'
										}`}
									/>
									<button
										type='button'
										onClick={() =>
											setShowPassword(
												!showPassword,
											)
										}
										// Instant flip — no CSS transition on the toggle button.
										className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300'>
										{showPassword ? (
											<EyeOffIcon />
										) : (
											<EyeIcon />
										)}
									</button>
								</div>
								{errors.password && (
									<p className='text-red-500 text-xs mt-1'>
										{errors.password}
									</p>
								)}

								{/* Password hint tooltip */}
								{showPasswordHint && (
									<div className={`absolute left-0 top-full mt-2 md:left-full md:top-0 md:mt-0 md:ml-3 z-50 border rounded-2xl shadow-lg p-4 w-64 ${d ? 'bg-[#1c2333] border-white/10' : 'bg-white border-gray-200'}`}>
										<p className={`text-sm font-semibold mb-2 ${d ? 'text-white' : 'text-gray-900'}`}>
											Your password
											should
											contain:
										</p>
										<ul className='space-y-1'>
											{[
												'A Uppercase letter e.g (E)',
												'An Lowercase letter e.g (a)',
												'A special character e.g. (!@#)',
												'A number e.g (1)',
												'8 characters minimum',
											].map(
												(
													rule,
												) => (
													<li
														key={
															rule
														}
														className={`flex items-start gap-2 text-sm ${d ? 'text-gray-400' : 'text-gray-600'}`}>
														<span className='mt-0.5 text-gray-500'>
															•
														</span>
														{
															rule
														}
													</li>
												),
											)}
										</ul>
									</div>
								)}
							</div>

							{/* Terms checkbox */}
							<div>
								<label className='flex items-start gap-3 cursor-pointer'>
									<input
										type='checkbox'
										checked={agreed}
										onChange={(e) => {
											setAgreed(
												e.target
													.checked,
											)
											if (
												errors.agreed
											)
												setErrors(
													(
														prev,
													) => ({
														...prev,
														agreed: '',
													}),
												)
										}}
										className={`mt-0.5 w-4 h-4 rounded border-gray-600 text-[#f97316] focus:ring-[#f97316] cursor-pointer ${d ? 'bg-[#0d1117]' : 'bg-white'}`}
									/>
									<span className={`text-sm leading-snug ${d ? 'text-gray-400' : 'text-gray-600'}`}>
										I agree with{' '}
										<Link
											href='/terms'
											className={`hover:underline ${d ? 'text-white' : 'text-gray-900'}`}>
											Terms of use
										</Link>{' '}
										and{' '}
										<Link
											href='/data-policy'
											className={`hover:underline ${d ? 'text-white' : 'text-gray-900'}`}>
											Data Privacy
											Policy
										</Link>
									</span>
								</label>
								{errors.agreed && (
									<p className='text-red-500 text-xs mt-1'>
										{errors.agreed}
									</p>
								)}
							</div>

							{/* Submit button */}
							<button
								type='submit'
								disabled={isLoading}
								className='w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f97316] to-[#f59e0b] hover:from-[#ea6c0a] hover:to-[#d97706] text-white font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed'>
								{isLoading
									? 'Creating account...'
									: 'Create my account'}
							</button>
						</form>

						{/* Login link */}
						<p className={`text-center text-sm mt-5 ${d ? 'text-gray-400' : 'text-gray-600'}`}>
							Already have an account?
							<Link
								href='/Auth/login'
								className={`font-bold transition ml-1 underline ${d ? 'text-white hover:text-[#f97316]' : 'text-gray-900 hover:text-[#f97316]'}`}>
								Login
							</Link>
						</p>
					</div>

					{/* Right — Image. Uses object-contain (not cover) so the source
              image is shown at its native aspect ratio without crop + zoom.
              The previous fill+cover combo stretched the image when the
              panel was wider than the source's aspect, which softened the
              rendered pixels. sizes hints Next.js to serve a width-appropriate
              variant; quality:90 keeps detail at the auth-page size. */}
					<div className='hidden md:flex relative rounded-r-2xl overflow-hidden bg-[#0d1117]'>
						<Image
							src='/images/assessques.png'
							alt='Create Account'
							fill
							sizes='(min-width: 768px) 50vw, 0px'
							quality={90}
							className='object-cover object-center'
							priority
						/>
					</div>
				</div>
			</div>

			{/* Footer */}
			<footer className={`py-6 text-center border-t ${d ? 'border-white/5' : 'border-gray-200'}`}>
				<div className='flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-3'>
					<Link
						href='/data-policy'
						className='text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition'>
						Privacy Policy
					</Link>
					<Link
						href='/terms'
						className='text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition'>
						Terms of Service
					</Link>
					<Link
						href='#'
						className='text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition'>
						Security Architecture
					</Link>
				</div>
				<p className='text-xs text-gray-600 uppercase tracking-wider'>
					© 2024 PICA Intelligence Systems. All rights
					reserved.
				</p>
			</footer>
		</div>
	)
}
