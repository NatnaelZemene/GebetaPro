/**
 * analytics.routes.js — Analytics routes.
 * POST /api/analytics/track   — Track profile views, contact clicks, lead actions
 */
import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { trackEventSchema } from './analytics.schemas.js'
import * as ctrl from './analytics.controller.js'

const router = Router()

// Public endpoint for tracking profile events (views, WhatsApp/Telegram/contact clicks)
router.post('/track', validate(trackEventSchema), ctrl.trackEvent)

export default router
