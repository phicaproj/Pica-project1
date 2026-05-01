'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/lib/authClient'

function NewPasswordContent() {
	const router = useRouter()

	const [showNew, setShowNew] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [confirmError, setConfirmError] = useState('')
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setConfirmError('')
		setError('')

		if (newPassword !== confirmPassword) {
			setConfirmError('Passwords do not match')
			return
		}

		setIsLoading(true)
		try {
			const res = await resetPassword({ newPassword })

			if (res.error) {
				setError(
					res.error.message ??
						'Failed to reset password. Please try again.',
				)
				return
			}
			alert('Password reset successfully')
			router.push('/Auth/login')
		} catch {
			setError('Something went wrong. Please try again.')
			alert('Something went wrong. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const EyeIcon = () => (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			className='w-5 h-5'
			fill='none'
			viewBox='0 0 24 24'
			stroke='currentColor'
			strokeWidth={1.5}
		>
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
			strokeWidth={1.5}
		>
			<path
				strokeLinecap='round'
				strokeLinejoin='round'
				d='M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88'
			/>
		</svg>
	)

	return (
		<div className='relative min-h-screen w-full flex flex-col'>
			{/* Background image */}
			<div
				className='absolute inset-0 bg-cover bg-center bg-no-repeat'
				style={{ backgroundImage: "url('/images/loginbg.jpeg')" }}
			/>

			{/* Main content */}
			<div className='relative flex-1 flex flex-col'>
				{/* Logo - centered */}
				<div className='pt-10 flex justify-center'>
					<div className='flex items-center gap-2'>
						<img src='/images/logo.png' alt='logo' />
					</div>
				</div>

				{/* Card - centered */}
				<div className='flex-1 flex items-center justify-center pb-10'>
					<div className='bg-white rounded-md shadow-xl p-10 w-full max-w-md mx-4'>
						<h2 className='text-xl font-bold text-gray-900 text-center mb-8'>
							New Password
						</h2>

						{/* General error (e.g. invalid token) */}
						{error && (
							<div className='mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center'>
								{error}
							</div>
						)}

						<form onSubmit={handleSubmit} className='space-y-5'>
							{/* New Password */}
							<div className='relative'>
								<input
									type={showNew ? 'text' : 'password'}
									placeholder='New Password'
									value={newPassword}
									onChange={(e) =>
										setNewPassword(e.target.value)
									}
									required
									disabled={isLoading}
									className='w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#017CA3] focus:border-transparent transition pr-12 disabled:opacity-60'
								/>
								<button
									type='button'
									onClick={() => setShowNew(!showNew)}
									className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition'
									aria-label='Toggle new password visibility'
								>
									{showNew ? <EyeOffIcon /> : <EyeIcon />}
								</button>
							</div>

							{/* Confirm Password */}
							<div>
								<div className='relative'>
									<input
										type={showConfirm ? 'text' : 'password'}
										placeholder='Confirm Password'
										value={confirmPassword}
										onChange={(e) => {
											setConfirmPassword(e.target.value)
											if (confirmError)
												setConfirmError('')
										}}
										required
										disabled={isLoading}
										className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition pr-12 disabled:opacity-60 ${
											confirmError
												? 'border-red-500 focus:ring-red-400'
												: 'border-gray-200 focus:ring-[#017CA3]'
										}`}
									/>
									<button
										type='button'
										onClick={() =>
											setShowConfirm(!showConfirm)
										}
										className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition'
										aria-label='Toggle confirm password visibility'
									>
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

							<button
								type='submit'
								disabled={isLoading}
								className='w-full py-3.5 rounded-xl bg-[#017CA3] hover:bg-[#046f91] active:bg-[#017CA3] text-white font-semibold text-sm tracking-wide transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed'
							>
								{isLoading ? 'Saving...' : 'Continue'}
							</button>
						</form>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className='relative z-10 py-4 text-center text-sm text-gray-600 bg-white/80 backdrop-blur-sm'>
				© Beauvision 2024 . All rights reserved. Powered By{' '}
				<a
					href='https://sundimension.com'
					target='_blank'
					rel='noopener noreferrer'
					className='underline hover:text-[#017CA3] transition'
				>
					SunDimension
				</a>
			</div>
		</div>
	)
}

export default function NewPasswordPage() {
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
					<div className='relative bg-white rounded-md shadow-xl p-10 w-full max-w-md mx-4 text-center'>
						<p className='text-gray-600'>Loading...</p>
					</div>
				</div>
			}
		>
			<NewPasswordContent />
		</Suspense>
	)
}
