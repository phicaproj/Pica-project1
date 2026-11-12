'use client'

import { Check } from 'lucide-react'

interface Rule {
	label: string
	test: (password: string) => boolean
}

const RULES: Rule[] = [
	{ label: 'At least 8 characters', test: (p) => p.length >= 8 },
	{ label: 'At least one uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
	{ label: 'At least one lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
	{ label: 'At least one number (0-9)', test: (p) => /[0-9]/.test(p) },
	{ label: 'At least one special character (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

interface PasswordStrengthProps {
	password: string
	visible: boolean
	dark?: boolean
}

export default function PasswordStrength({ password, visible, dark = false }: PasswordStrengthProps) {
	const results = RULES.map((rule) => rule.test(password))
	const met = results.filter(Boolean).length
	const total = RULES.length
	const percent = Math.round((met / total) * 100)

	const strength =
		met >= 5 ? 'Strong' : met >= 3 ? 'Medium' : 'Weak'

	const strengthStyles =
		strength === 'Strong'
			? { bar: 'bg-emerald-500', text: dark ? 'text-emerald-400' : 'text-emerald-600' }
			: strength === 'Medium'
				? { bar: 'bg-amber-500', text: dark ? 'text-amber-400' : 'text-amber-600' }
				: { bar: 'bg-rose-500', text: dark ? 'text-rose-400' : 'text-rose-600' }

	return (
		<div
			className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
				visible ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
			}`}
			aria-hidden={!visible}
		>
			<div className='min-h-0 overflow-hidden'>
				<div
					className={`mt-2 rounded-xl border p-4 transition-colors ${
						dark ? 'border-white/10 bg-[#0f1722]' : 'border-gray-200 bg-gray-50'
					}`}
				>
					<ul className='space-y-1.5'>
						{RULES.map((rule, i) => {
							const passed = results[i]
							return (
								<li key={rule.label} className='flex items-center gap-2'>
									<span
										className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
											passed
												? 'border-emerald-500 bg-emerald-500 text-white'
												: dark
													? 'border-gray-600 text-transparent'
													: 'border-gray-300 text-transparent'
										}`}
									>
										<Check className='h-2.5 w-2.5' strokeWidth={3} />
									</span>
									<span
										className={`text-xs transition-colors ${
											passed
												? dark
													? 'text-gray-300'
													: 'text-gray-700'
												: dark
													? 'text-gray-500'
													: 'text-gray-500'
										}`}
									>
										{rule.label}
									</span>
								</li>
							)
						})}
					</ul>

					<div className='mt-3'>
						<div className='mb-1.5 flex items-center justify-between'>
							<span className={`text-[11px] font-medium ${dark ? 'text-gray-500' : 'text-gray-500'}`}>
								Password strength
							</span>
							<span className={`text-[11px] font-bold ${strengthStyles.text}`}>
								{strength}
							</span>
						</div>
						<div className={`h-1.5 w-full overflow-hidden rounded-full ${dark ? 'bg-white/10' : 'bg-gray-200'}`}>
							<div
								className={`h-full rounded-full transition-all duration-300 ease-out ${strengthStyles.bar}`}
								style={{ width: `${percent}%` }}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
