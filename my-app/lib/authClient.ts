// Barrel module. The API client was split into focused files under lib/api/*
// so each domain (auth, payment, assessment, user, admin, reports, payments-admin)
// can be read and edited on its own. This file keeps the old import path
// working — every existing `from '@/lib/authClient'` continues to resolve.
//
// New code should prefer the narrower modules:
//
//   import { Login, getMe } from '@/lib/api/auth'
//   import { initPayment } from '@/lib/api/payment'
//
// instead of pulling everything through this barrel.

export * from './api/config'
export * from './api/auth'
export * from './api/payment'
export * from './api/assessment'
export * from './api/user'
export * from './api/admin'
export * from './api/reports'
export * from './api/payments-admin'
export * from './api/subscription'
