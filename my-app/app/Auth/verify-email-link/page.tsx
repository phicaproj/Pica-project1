'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { verifyEmailLink } from '@/lib/authClient'
import { useTheme } from '@/components/ThemeContext'
import { getAccessToken } from '@/lib/api/config'

export default function VerifyEmailLinkPage() {
	const { dark } = useTheme()
	const d = dark
	const router = useRouter()

	const [token, setToken] = useState<string>('')
	const [loading, setLoading] = useState(true)
	const [verified, setVerified] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Read the token from the URL on the client only — SSR-safe.
	useEffect(() => {
		if (typeof window === 'undefined') return

		const params = new URLSearchParams(window.location.search)
		const t = params.get('token') || ''
		setToken(t)

		if (!t) {
			setError('No verification token provided.')
			setLoading(false)
			return
		}

		;(async () => {
			try {
				const res = await verifyEmailLink({ token: t })
				if (res.error || !res.data) {
					setError(res.error?.message ?? 'Failed to verify email.')
					setLoading(false)
					return
				}
				setVerified(true)
			} catch {
				setError('Something went wrong. Please try again.')
			} finally {
				setLoading(false)
			}
		})()
	}, [])

	// Auto-redirect after verification: dashboard if logged in, else login.
	useEffect(() => {
		if (!verified || loading) return

		const hasSession = typeof window !== 'undefined' && !!getAccessToken()

		setTimeout(() => {
			router.push(hasSession ? '/dashboard' : '/Auth/login')
		}, 1500)
	}, [verified, loading, router])

	if (loading) {
		return (
			<div className={`min-h-screen flex items-center justify-center ${d ? 'bg-[#0d1117]' : 'bg-gray-50'}`}>
				<div className='flex flex-col items-center gap-3 text-gray-400'>
					<div className='w-8 h-8 rounded-full border border-teal-400/20 flex items-center justify-center'>
						<div className='w-6 h-6 rounded-full bg-teal-400 animate-pulse' />
					</div>
					<p className='text-sm'>Verifying your email…</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className={`min-h-screen flex items-center justify-center px-4 ${d ? 'bg-[#0d1117]' : 'bg-gray-50'}`}>
				<div className='flex flex-col items-center gap-3 text-center max-w-md'>
					<div className='w-10 h-10 rounded-full border border-rose-400/20 flex items-center justify-center'>
						<div className='w-8 h-8 rounded-full bg-rose-400' />
					</div>
					<h2 className='text-xl font-bold text-gray-900'>Verification failed</h2>
					<p className='text-sm text-gray-400'>{error}</p>
					<Link
						href='/Auth/login'
						className='mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-gray-900 text-sm font-bold transition'
					>
						Go to login
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className={`min-h-screen flex items-center justify-center px-4 ${d ? 'bg-[#0d1117]' : 'bg-gray-50'}`}>
			<div className='flex flex-col items-center gap-3 text-center max-w-md'>
				<div className='w-12 h-12 rounded-full border border-teal-400/20 flex items-center justify-center'>
					<div className='w-8 h-8 rounded-full bg-teal-400' />
				</div>
				<h2 className='text-xl font-bold text-gray-900'>Email verified!</h2>
				<p className='text-sm text-gray-400'>
					Your email address has been confirmed. Redirecting you…
				</p>
				{!loading && (
					<p className='text-xs text-gray-400'>
						If you are not redirected automatically,{' '}
						<Link
							href={typeof window !== 'undefined' && !!getAccessToken() ? '/dashboard' : '/Auth/login'}
							className='font-semibold text-teal-300 underline'
						>
							click here
						</Link>
					</p>
				)}
			</div>
		</div>
	)
}
