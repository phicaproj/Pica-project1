import dotenv from 'dotenv'
import AppError from './appError'

dotenv.config()

interface SendEmailResponse {
	success: boolean
	error?: string
}

export async function sendVerificationEmail(
	email: string,
	otp: string,
): Promise<SendEmailResponse> {
	try {
		const response = await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': process.env.BREVO_API_KEY as string,
			},
			body: JSON.stringify({
				sender: {
					email: process.env.EMAIL_FROM as string,
					name: 'Sardius Rentals App',
				},
				to: [{ email }],
				templateId: Number(process.env.BREVO_TEMPLATE_ID),
				params: {
					CODE: otp,
				},
			}),
		})

		if (!response.ok) {
			const errorData: unknown = await response.json()
			throw new AppError(JSON.stringify(errorData), 500)
		}

		return { success: true }
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : 'Unknown error occurred'

		console.error('Error sending verification email:', message)

		return { success: false, error: message }
	}
}

export async function sendWelcomeEmail(
	email: string,
	fullName: string,
): Promise<SendEmailResponse> {
	try {
		const response = await fetch('https://api.brevo.com/v3/smtp/email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': process.env.BREVO_API_KEY as string,
			},
			body: JSON.stringify({
				sender: {
					email: process.env.EMAIL_FROM as string,
					name: 'Sardius Rentals App',
				},
				to: [{ email }],
				templateId: Number(process.env.BREVO_WELCOME_TEMPLATE_ID),
				params: {
					NAME: fullName,
				},
			}),
		})

		if (!response.ok) {
			const errorData: unknown = await response.json()
			throw new AppError(JSON.stringify(errorData), 500)
		}

		return { success: true }
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : 'Unknown error occurred'

		console.error('Error sending verification email:', message)

		return { success: false, error: message }
	}
}
