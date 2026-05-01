const getEnv = (key: string): string => {
	const value = process.env[key]

	if (!value) {
		throw new Error(`Missing Environment Variable ${key}`)
	}

	return value
}

export const DATABASE_URL = getEnv('DATABASE_URL')
export const PORT = Number(getEnv('PORT'))
export const NODE_ENV = getEnv('NODE_ENV')
export const BREVO_API_KEY = getEnv('BREVO_API_KEY')
export const EMAIL_FROM = getEnv('EMAIL_FROM')
export const BREVO_TEMPLATE_ID = getEnv('BREVO_TEMPLATE_ID')
export const JWT_ACCESS_SECRET = getEnv('JWT_ACCESS_SECRET')
export const JWT_ACCESS_EXPIRE = getEnv('JWT_ACCESS_EXPIRE')
export const JWT_REFRESH_SECRET = getEnv('JWT_REFRESH_SECRET')
export const JWT_REFRESH_EXPIRE = getEnv('JWT_REFRESH_EXPIRE')
export const JWT_OTP_SECRET = getEnv('JWT_OTP_SECRET')
export const JWT_OTP_EXPIRE = getEnv('JWT_OTP_EXPIRE')
export const JWT_PASSWORD_RESET_SECRET = getEnv('JWT_PASSWORD_RESET_SECRET')
export const JWT_PASSWORD_RESET_EXPIRE = getEnv('JWT_PASSWORD_RESET_EXPIRE')

