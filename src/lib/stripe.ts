import Stripe from 'stripe'

let _stripe: Stripe | null = null

/**
 * Lazy-initialized Stripe client.
 * Only throws if STRIPE_SECRET_KEY is missing when actually used (not at import time).
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    })
  }
  return _stripe
}

/**
 * Stripe Price IDs — configure these in your .env after creating products in Stripe Dashboard
 */
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || '',
  semiannual: process.env.STRIPE_PRICE_SEMIANNUAL || '',
  annual: process.env.STRIPE_PRICE_ANNUAL || '',
} as const

export type PlanInterval = 'monthly' | 'semiannual' | 'annual'

/**
 * Maps a Stripe price_id back to a plan interval
 */
export function getPlanIntervalFromPriceId(priceId: string): PlanInterval | null {
  if (priceId === STRIPE_PRICES.monthly) return 'monthly'
  if (priceId === STRIPE_PRICES.semiannual) return 'semiannual'
  if (priceId === STRIPE_PRICES.annual) return 'annual'
  return null
}
