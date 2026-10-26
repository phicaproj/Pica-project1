'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
	ClaimSignup,
	PreviewSignupClaim,
	type SignupClaimPreviewResponse,
} from '@/lib/authClient'
import { useTheme } from '@/components/ThemeContext'

// Hoisted so the icon component identities stay stable while typing.
const EyeIcon = () => (
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

const PASSWORD_PATTERN =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

function CreatePasswordContent() {
	const { dark } = useTheme()
	const d = dark
	const router = useRouter()
	const searchParams = useSearchParams()

	const [token, setToken] = useState('')
	const [tokenResolved, setTokenResolved] = useState(false)
	const [preview, setPreview] = useState<SignupClaimPreviewResponse | null>(
		null,
	)
	const [loadingPreview, setLoadingPreview] = useState(false)
	const [previewError, setPreviewError] = useState('')

	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [confirmError, setConfirmError] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [success, setSuccess] = useState(false)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const hash = window.location.hash
		const match = hash.match(/#token=([^&]*)/)
		const resolvedToken =
			match && match[1]
				? decodeURIComponent(match[1])
				: searchParams.get('token') || ''

		if (resolvedToken) {
			setToken(resolvedToken)
			setLoadingPreview(true)
		}
		setTokenResolved(true)
	}, [searchParams])

	useEffect(() => {
		if (!token) return

		let cancelled = false
		setLoadingPreview(true)
		setPreviewError('')

		PreviewSignupClaim(token)
			.then((res) => {
				if (cancelled) return
				if (res.error || !res.data) {
					setPreviewError(
						res.error?.message ??
							'This signup link is invalid or has expired.',
					)
					return
				}
				setPreview(res.data)
			})
			.finally(() => {
				if (!cancelled) setLoadingPreview(false)
			})

		return () => {
			cancelled = true
		}
	}, [token])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setConfirmError('')

		if (!token) {
			setError(
				'This signup link is missing or malformed. Please use the link from your email.',
			)
			return
		}

		if (password !== confirmPassword) {
			setConfirmError('Passwords do not match')
			return
		}

		if (password.length < 8 || !PASSWORD_PATTERN.test(password)) {
			setError(
				'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.',
			)
			return
		}

		setIsLoading(true)
		try {
			const res = await ClaimSignup({ token, password })

			if (res.error) {
				setError(
					res.error.message ??
						'Failed to create your account. The link may have expired.',
				)
				return
			}

			setSuccess(true)
			setTimeout(() => router.push('/dashboard'), 1600)
		} catch {
			setError('Something went wrong. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const inputClass = `w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent transition pr-12 disabled:opacity-60 ${
		d
			? 'bg-[#0d1117] border-white/10 text-white placeholder-gray-500 focus:ring-[#f97316]/50'
			: 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:ring-[#f97316]/50'
	}`

	return (
		<div className='relative min-h-screen w-full flex flex-col'>
			<div
				className='absolute inset-0 bg-cover bg-center bg-no-repeat'
				style={{ backgroundImage: "url('/images/loginbg.jpeg')" }}
			/>

			<div className='relative flex-1 flex flex-col'>
				<div className='pt-10 flex justify-center'>
					<Link href='/' className='flex items-center gap-2'>
						<img
							src='/images/favicon.png'
							alt='logo'
							className='h-6 w-6 object-contain'
						/>
						<span
							className={`text-lg font-bold ${d ? 'text-white' : 'text-gray-900'}`}>
							Beauvision
						</span>
					</Link>
				</div>

				<div className='flex-1 flex items-center justify-center pb-10'>
					<div
						className={`rounded-2xl shadow-xl p-8 sm:p-10 w-full max-w-md mx-4 ${
							d
								? 'bg-[#161b22] border border-white/10'
								: 'bg-white border border-gray-100'
						}`}>
						<h1
							className={`text-2xl font-bold text-center mb-2 ${
								d ? 'text-white' : 'text-gray-900'
							}`}>
							Create your PICA password
						</h1>
						<p
							className={`text-sm text-center mb-6 ${
								d ? 'text-gray-400' : 'text-gray-500'
							}`}>
							Use the secure link from your free scan report to
							finish setting up your account.
						</p>

						{success ? (
							<div className='px-4 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm text-center'>
								Account created! Taking you to your
								dashboard…
							</div>
						) : !tokenResolved || loadingPreview ? (
							<div
								className={`px-4 py-6 rounded-xl border text-sm text-center ${
									d
										? 'border-white/10 bg-white/5 text-gray-300'
										: 'border-gray-200 bg-gray-50 text-gray-600'
								}`}>
								Checking your secure link…
							</div>
						) : !token ? (
							<div className='space-y-4'>
								<div
									className={`px-4 py-3 rounded-xl border text-sm text-center ${
										d
											? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
											: 'border-amber-200 bg-amber-50 text-amber-700'
									}`}>
									This page needs the secure link from your
									free scan report email. Open that link to
									create your password.
								</div>
								<div className='flex flex-col sm:flex-row gap-3'>
									<Link
										href='/Auth/login'
										className='flex-1 inline-flex items-center justify-center rounded-xl bg-[#f97316] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#ea6c0a]'>
										Log in
									</Link>
									<Link
										href='/pages/freescan'
										className={`flex-1 inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition ${
											d
												? 'border-white/15 text-gray-200 hover:bg-white/5'
												: 'border-gray-200 text-gray-700 hover:bg-gray-50'
										}`}>
										Take a free scan
									</Link>
								</div>
							</div>
						) : previewError ? (
							<div className='space-y-4'>
								<div className='px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center'>
									{previewError}
								</div>
								<div className='flex flex-col sm:flex-row gap-3'>
									<Link
										href='/Auth/login'
										className='flex-1 inline-flex items-center justify-center rounded-xl bg-[#f97316] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#ea6c0a]'>
										Log in
									</Link>
									<Link
										href='/pages/freescan'
										className={`flex-1 inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition ${
											d
												? 'border-white/15 text-gray-200 hover:bg-white/5'
												: 'border-gray-200 text-gray-700 hover:bg-gray-50'
										}`}>
										Take a free scan
									</Link>
								</div>
							</div>
						) : (
							<>
								{preview && (
									<div
										className={`rounded-xl border p-4 mb-6 ${
											d
												? 'border-white/10 bg-white/5'
												: 'border-gray-200 bg-gray-50'
										}`}>
										<p
											className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
												d
													? 'text-gray-500'
													: 'text-gray-400'
											}`}>
											Your free scan
										</p>
										<p
											className={`text-sm font-bold ${
												d
													? 'text-white'
													: 'text-gray-900'
											}`}>
											{preview.businessName}
										</p>
										<p
											className={`text-xs mt-0.5 ${
												d
													? 'text-gray-400'
													: 'text-gray-500'
											}`}>
											{preview.email}
										</p>
										<div
											className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs ${
												d
													? 'text-gray-400'
													: 'text-gray-600'
											}`}>
											{preview.staffSize && (
												<span>
													Staff: {preview.staffSize}
												</span>
											)}
											{preview.industry && (
												<span>
													Sector: {preview.industry}
												</span>
											)}
											{preview.operatingYears && (
												<span>
													Years:{' '}
													{preview.operatingYears}
												</span>
											)}
											{preview.state && (
												<span>
													Location: {preview.state}
													{preview.country
														? `, ${preview.country}`
														: ''}
												</span>
											)}
										</div>
									</div>
								)}

								{error && (
									<div className='mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center'>
										{error}
									</div>
								)}

								<form
									onSubmit={handleSubmit}
									className='space-y-5'>
									<div className='relative'>
										<input
											type={
												showPassword
													? 'text'
													: 'password'
											}
											placeholder='Password'
											value={password}
											onChange={(e) =>
												setPassword(e.target.value)
											}
											required
											disabled={isLoading}
											className={inputClass}
										/>
										<button
											type='button'
											onClick={() =>
												setShowPassword(
													!showPassword,
												)
											}
											className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
											aria-label='Toggle password visibility'>
											{showPassword ? (
												<EyeOffIcon />
											) : (
												<EyeIcon />
											)}
										</button>
									</div>

									<div>
										<div className='relative'>
											<input
												type={
													showConfirm
														? 'text'
														: 'password'
												}
												placeholder='Confirm password'
												value={confirmPassword}
												onChange={(e) => {
													setConfirmPassword(
														e.target.value,
													)
													if (confirmError)
														setConfirmError('')
												}}
												required
												disabled={isLoading}
												className={inputClass}
											/>
											<button
												type='button'
												onClick={() =>
													setShowConfirm(
														!showConfirm,
													)
												}
												className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
												aria-label='Toggle confirm password visibility'>
												{showConfirm ? (
													<EyeOffIcon />
												) : (
													<EyeIcon />
												)}
											</button>
										</div>
										{confirmError && (
											<p className='text-red-500 text-xs mt-1'>
												{confirmError}
											</p>
										)}
									</div>

									<p
										className={`text-xs ${
											d
												? 'text-gray-500'
												: 'text-gray-500'
										}`}>
										At least 8 characters with uppercase,
										lowercase, a number, and a special
										character.
									</p>

									<button
										type='submit'
										disabled={isLoading}
										className='w-full py-3.5 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] active:bg-[#f97316] text-white font-semibold text-sm tracking-wide transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed'>
										{isLoading
											? 'Creating account…'
											: 'Create account'}
									</button>
								</form>
							</>
						)}

						{!success && (
							<p
								className={`text-xs text-center mt-6 ${
									d ? 'text-gray-500' : 'text-gray-500'
								}`}>
								Already have an account?{' '}
								<Link
									href='/Auth/login'
									className='font-semibold text-[#f97316] hover:underline'>
									Log in
								</Link>
							</p>
						)}
					</div>
				</div>
			</div>

			<div
				className={`relative z-10 py-4 text-center text-sm backdrop-blur-sm ${
					d
						? 'text-gray-400 bg-[#0d1117]/80'
						: 'text-gray-600 bg-white/80'
				}`}>
				© Beauvision 2026 . All rights reserved.
			</div>
		</div>
	)
}

export default function CreatePasswordPage() {
	const { dark } = useTheme()
	const d = dark

	return (
		<Suspense
			fallback={
				<div className='relative min-h-screen w-full flex items-center justify-center'>
					<div
						className='absolute inset-0 bg-cover bg-center bg-no-repeat'
						style={{
							backgroundImage: "url('/images/loginbg.jpeg')",
						}}
					/>
					<div
						className={`relative rounded-2xl shadow-xl p-10 w-full max-w-md mx-4 text-center ${
							d
								? 'bg-[#161b22] border border-white/10'
								: 'bg-white'
						}`}>
						<p
							className={
								d ? 'text-gray-400' : 'text-gray-600'
							}>
							Loading…
						</p>
					</div>
				</div>
			}>
			<CreatePasswordContent />
		</Suspense>
	)
}
