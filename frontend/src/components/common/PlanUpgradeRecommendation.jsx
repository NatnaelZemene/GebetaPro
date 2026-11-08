import { useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sparkles, Crown, Zap, Check, ArrowRight,
  Image as ImageIcon, Wrench, FolderOpen, FileText,
  AlertCircle,
} from 'lucide-react'
import { Button } from '../ui/Button.jsx'
import {
  useSubscriptionPlans,
  useMySubscription,
  useCreateCheckoutSession,
} from '../../features/subscriptions/hooks/useSubscriptions.js'

const FEATURE_CONFIG = {
  gallery: {
    title: 'Photo Gallery Limit Reached',
    label: 'Photos',
    icon: <ImageIcon size={18} className="text-brand" />,
    units: 'photos',
    description: 'Upgrade your subscription to unlock more photo slots, build trust, and showcase your storefront and work to potential clients.',
    tierValues: {
      FREE: '3 photos',
      BASIC: '10 photos',
      PRO: '30 photos',
      BUSINESS: 'Unlimited photos',
    },
    gains: {
      BASIC: '+7 more photo uploads',
      PRO: '+27 more photos · Verified badge',
      BUSINESS: 'Unlimited uploads · Top search visibility',
    },
  },
  services: {
    title: 'Services Limit Reached',
    label: 'Services',
    icon: <Wrench size={18} className="text-brand" />,
    units: 'services',
    description: 'Expand your service menu so potential customers can discover everything your business has to offer.',
    tierValues: {
      FREE: '3 services',
      BASIC: '10 services',
      PRO: '50 services',
      BUSINESS: 'Unlimited services',
    },
    gains: {
      BASIC: '+7 more service offerings',
      PRO: '+47 more services · Verified badge',
      BUSINESS: 'Unlimited services · Top search placement',
    },
  },
  portfolio: {
    title: 'Portfolio Limit Reached',
    label: 'Portfolio Items',
    icon: <FolderOpen size={18} className="text-brand" />,
    units: 'portfolio items',
    description: 'Showcase your best completed projects, case studies, and achievements to win higher-value clients.',
    tierValues: {
      FREE: '2 items',
      BASIC: '10 items',
      PRO: '50 items',
      BUSINESS: 'Unlimited items',
    },
    gains: {
      BASIC: '+8 portfolio projects',
      PRO: '+48 projects · Verified badge',
      BUSINESS: 'Unlimited portfolio showcases',
    },
  },
  posts: {
    title: 'Posts Limit Reached',
    label: 'Posts & Updates',
    icon: <FileText size={18} className="text-brand" />,
    units: 'posts',
    description: 'Keep your followers informed with frequent news, promotions, updates, and announcements.',
    tierValues: {
      FREE: '5 posts',
      BASIC: '20 posts',
      PRO: '100 posts',
      BUSINESS: 'Unlimited posts',
    },
    gains: {
      BASIC: '+15 posts & updates',
      PRO: '+95 posts · Featured placement',
      BUSINESS: 'Unlimited posts & announcements',
    },
  },
}

/**
 * PlanUpgradeRecommendation component.
 *
 * Rendered when a user reaches their plan quota for any feature (gallery, services,
 * portfolio, posts, ads). Provides an eye-catching recommendation card with immediate
 * upgrade action and plan comparison.
 */
export function PlanUpgradeRecommendation({
  feature = 'gallery',
  currentCount,
  maxAllowed,
  currentPlanName: propPlanName,
  compact = false,
  className = '',
}) {
  const navigate = useNavigate()
  const { data: plansData } = useSubscriptionPlans()
  const { data: mySub } = useMySubscription()
  const checkout = useCreateCheckoutSession()

  const config = FEATURE_CONFIG[feature] || FEATURE_CONFIG.gallery

  const isExpired = mySub?.status === 'EXPIRED'

  const activePlanName = useMemo(() => {
    if (isExpired) return 'FREE'
    const raw = propPlanName || mySub?.plan?.name || 'FREE'
    return String(raw).toUpperCase()
  }, [propPlanName, mySub, isExpired])

  // Determine the best target tier to recommend
  const recommendedTier = useMemo(() => {
    if (isExpired && mySub?.plan?.name && mySub.plan.name !== 'FREE') {
      return mySub.plan.name
    }
    if (activePlanName === 'FREE') return 'PRO'
    if (activePlanName === 'BASIC') return 'PRO'
    if (activePlanName === 'PRO') return 'BUSINESS'
    return 'BUSINESS'
  }, [activePlanName, isExpired, mySub])

  // Find the plan object from plans list
  const targetPlan = useMemo(() => {
    if (!plansData || !plansData.length) return null
    return plansData.find((p) => p.name === recommendedTier) || plansData.find((p) => p.name === 'PRO') || plansData[0]
  }, [plansData, recommendedTier])

  // Handle direct checkout
  const handleUpgrade = () => {
    if (!targetPlan) {
      navigate('/pricing')
      return
    }
    checkout.mutate({ planId: targetPlan.id })
  }

  const isCurrentMaxTier = activePlanName === 'BUSINESS'
  const countDisplay = currentCount != null ? currentCount : maxAllowed
  const limitDisplay = maxAllowed != null ? maxAllowed : '—'

  if (isCurrentMaxTier) {
    return (
      <div className={`p-5 rounded-2xl bg-surface border border-border text-center space-y-2 ${className}`}>
        <p className="text-[14px] font-semibold text-ink">You are currently on our highest tier (Business)</p>
        <p className="text-[12.5px] text-ink-3">
          If you need custom enterprise storage or limits, please contact platform support.
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={`p-4 rounded-xl bg-gradient-to-r from-brand/10 via-brand/5 to-surface-2 border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand/15 text-brand flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-ink">
              Quota Reached: {countDisplay} / {limitDisplay} {config.units}
            </p>
            <p className="text-[12px] text-ink-3">
              Upgrade to <span className="font-semibold text-brand">{targetPlan?.display_name || recommendedTier}</span> for {config.gains[recommendedTier] || 'more space'}.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpgrade}
            loading={checkout.isPending}
            className="shadow-sm"
          >
            <Zap size={14} className="mr-1 fill-current" />
            {isExpired ? `Reactivate ${targetPlan?.display_name || recommendedTier}` : `Upgrade to ${targetPlan?.display_name || recommendedTier}`}
          </Button>
          <Link to="/pricing">
            <Button variant="ghost" size="sm">
              Plans
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-brand/30 dark:border-brand/40 bg-gradient-to-br from-brand/5 via-surface to-brand/10 dark:from-brand/10 dark:via-surface dark:to-brand/5 p-6 sm:p-7 shadow-sm ${className}`}>
      {/* Decorative ambient background blur */}
      <div
        className="absolute -top-16 -right-16 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Column: Notice & Value proposition */}
        <div className="space-y-3.5 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle size={13} className="shrink-0" />
              Storage Quota {countDisplay} / {limitDisplay}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-brand/15 text-brand border border-brand/20">
              <Sparkles size={13} className="shrink-0" />
              Recommended: {targetPlan?.display_name || recommendedTier} Plan
            </span>
          </div>

          <div>
            <h3 className="text-[17px] sm:text-[19px] font-bold text-ink tracking-tight flex items-center gap-2">
              <span>{config.title}</span>
            </h3>
            <p className="text-[13px] sm:text-[13.5px] text-ink-2 mt-1 leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Feature comparison pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {['FREE', 'BASIC', 'PRO', 'BUSINESS'].map((tier) => {
              const isCurrent = tier === activePlanName
              const isTarget = tier === recommendedTier
              return (
                <div
                  key={tier}
                  className={`px-3 py-2 rounded-xl text-center border transition-all ${
                    isTarget
                      ? 'bg-brand/10 border-brand text-brand ring-1 ring-brand/30 shadow-xs'
                      : isCurrent
                      ? 'bg-surface-2 border-border text-ink-3'
                      : 'bg-surface/60 border-border/70 text-ink-3'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                    {tier}
                    {isCurrent && <span className="text-[9px] lowercase opacity-70">(now)</span>}
                    {isTarget && <Crown size={11} className="text-brand shrink-0" />}
                  </div>
                  <div className={`text-[12px] font-semibold ${isTarget ? 'text-brand font-bold' : 'text-ink'}`}>
                    {config.tierValues[tier]}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Perks */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-3 pt-1">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500 shrink-0" />
              Instant limit unlock
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500 shrink-0" />
              Chapa & Telebirr secure checkout
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500 shrink-0" />
              Cancel or switch anytime
            </span>
          </div>
        </div>

        {/* Right Column: CTA Box */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch justify-center gap-3 shrink-0 md:min-w-[240px] bg-surface/80 backdrop-blur-sm border border-brand/20 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="text-center md:text-left mb-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              Upgrade to {targetPlan?.display_name || recommendedTier}
            </div>
            <div className="flex items-baseline justify-center md:justify-start gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-ink tracking-tight">
                ETB {targetPlan ? Number(targetPlan.price_etb).toLocaleString() : '299'}
              </span>
              <span className="text-[12px] font-medium text-ink-3">/ month</span>
            </div>
            <p className="text-[11.5px] text-brand font-medium mt-1">
              {config.gains[recommendedTier] || 'Unlock higher limits'}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={handleUpgrade}
            loading={checkout.isPending}
            className="shadow-md shadow-brand/20 hover:shadow-lg hover:shadow-brand/25 transition-all text-[13.5px] font-semibold py-2.5"
          >
            <Crown size={15} className="mr-1.5 fill-current" />
            {isExpired ? `Reactivate ${targetPlan?.display_name || recommendedTier}` : `Upgrade to ${targetPlan?.display_name || recommendedTier}`}
          </Button>

          <Link to="/pricing" className="w-full">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              className="text-[12.5px] text-ink-2 hover:text-ink hover:bg-surface-2"
            >
              Compare all plans & pricing
              <ArrowRight size={13} className="ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
