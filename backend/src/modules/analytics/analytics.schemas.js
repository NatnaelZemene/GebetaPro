/**
 * analytics.schemas.js — Zod validation schemas for the analytics module.
 */
import { z } from 'zod'

export const EVENT_TYPES = [
  'VIEW',
  'CONTACT_CLICK',
  'PHONE_CLICK',
  'EMAIL_CLICK',
  'WHATSAPP_CLICK',
  'TELEGRAM_CLICK',
  'WEBSITE_CLICK',
]

export const trackEventSchema = z.object({
  body: z.object({
    profile_id: z.string().uuid('Invalid profile ID format'),
    event_type: z.enum(EVENT_TYPES, {
      errorMap: () => ({ message: `Invalid event_type. Must be one of: ${EVENT_TYPES.join(', ')}` }),
    }),
    metadata: z.record(z.any()).optional().default({}),
  }),
})

