import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create a new ratelimiter, that allows:
// - 15 requests per 1 hour for AI generations
// - 5 requests per 1 hour for Audio processing
// - 30 requests per 1 hour for Document processing

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Failsafe: if keys are missing, we provide a mock limiter that always allows
// This prevents the "Failed to parse URL from /pipeline" error if the server hasn't been restarted
const isConfigured = !!(redisUrl && redisToken)

const redis = isConfigured 
  ? new Redis({ url: redisUrl, token: redisToken })
  : null

// Limiter for Flashcards
export const flashcardLimiter = isConfigured && redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 h'),
  analytics: true,
  prefix: 'ratelimit:fc',
}) : { limit: () => Promise.resolve({ success: true }) } as any

// Limiter for Quiz
export const quizLimiter = isConfigured && redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 h'),
  analytics: true,
  prefix: 'ratelimit:qz',
}) : { limit: () => Promise.resolve({ success: true }) } as any

// Limiter for MindMaps
export const mindmapLimiter = isConfigured && redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 h'),
  analytics: true,
  prefix: 'ratelimit:mm',
}) : { limit: () => Promise.resolve({ success: true }) } as any

// Limiter for Reports
export const reportLimiter = isConfigured && redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 h'),
  analytics: true,
  prefix: 'ratelimit:rp',
}) : { limit: () => Promise.resolve({ success: true }) } as any

// Limiter for Audio (Whisper can be expensive/heavy)
export const audioLimiter = isConfigured && redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix: 'ratelimit:audio',
}) : { limit: () => Promise.resolve({ success: true }) } as any

// Limiter for Document Extraction
export const documentLimiter = isConfigured && redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 h'),
  analytics: true,
  prefix: 'ratelimit:doc',
}) : { limit: () => Promise.resolve({ success: true }) } as any


