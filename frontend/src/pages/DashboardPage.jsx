import { useNavigate, Link } from 'react-router-dom'
import {
  Eye, TrendingUp, CreditCard, ArrowRight, Star,
  CheckCircle2, Circle, AlertCircle, Users, MessageSquare,
  Plus, BadgeCheck, Edit3, FileText, Clock, XCircle, Megaphone, EyeOff,
  Image as ImageIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../components/layout/DashboardLayout.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import {
  useMyProfile, useProfileCompletion, useProfileAnalytics,
  usePublishProfile, useUnpublishProfile,
} from '../features/profiles/hooks/useProfile.js'
import { useMySubscription } from '../features/subscriptions/hooks/useSubscriptions.js'
import {
  requiresVerification, canPublish, statusLabel, statusBadgeClasses, VERIFICATION_STATUS,
} from '../utils/profileVerification.js'

function StatCard({ label, value, icon, loading, sub }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 hover:border-border-strong hover:shadow-xs transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11.5px] font-semibold text-ink-3 uppercase tracking-wider">{label}</span>
        <span className="text-ink-2 p-1.5 rounded-lg bg-surface-2 border border-border/60 shrink-0">{icon}</span>
      </div>
      {loading
        ? <Skeleton className="h-8 w-20" />
        : <div className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">{value ?? '0'}</div>
      }
      {sub && <p className="text-[11.5px] font-medium text-ink-3 mt-1.5 truncate">{sub}</p>}
    </div>
  )
}

function CompletionBar({ score }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('accessToken')

  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const { data: analytics, isLoading: analyticsLoading } = useProfileAnalytics()
  const { data: completion, isLoading: completionLoading } = useProfileCompletion()
  const { data: subscription, isLoading: subLoading } = useMySubscription()
  const publishMutation   = usePublishProfile()
  const unpublishMutation = useUnpublishProfile()

  // Post-login: redirect to profile creation if no profile exists and data is loaded
  if (!profileLoading && isLoggedIn && profile === null) {
    navigate('/dashboard/profile', { replace: true })
    return null
  }

  if (!isLoggedIn) {
    return (
      <DashboardLayout title={t('dashboard.title')}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-ink-2">{t('dashboard.loginRequired')}</p>
          <Button variant="primary" onClick={() => navigate('/login')}>{t('dashboard.login')}</Button>
        </div>
      </DashboardLayout>
    )
  }

  const score = completion?.score ?? 0
  const checks = completion?.checks ?? []
  const incompleteChecks = checks.filter(c => !c.done).slice(0, 4)
  const isPublished = profile?.is_published ?? false
  const planName = subscription?.plan?.display_name || t('pricing.free')
  const verStatus = profile?.verification_status || VERIFICATION_STATUS.UNVERIFIED
  const profileType = profile?.profile_type || 'PERSONAL'
  const needsVerification = requiresVerification(profileType)
  const publishAllowed = canPublish(verStatus, profileType)
  const badgeCls = statusBadgeClasses(verStatus)

  const QUICK_ACTIONS = [
    { label: t('dashboard.quickActions.editProfileInfo'), to: '/dashboard/profile',              icon: <Edit3 size={15} /> },
    { label: t('dashboard.quickActions.services'),        to: '/dashboard/profile/services',      icon: <Plus size={15} /> },
    { label: t('dashboard.quickActions.portfolio'),       to: '/dashboard/profile/portfolio',     icon: <Plus size={15} /> },
    { label: t('dashboard.quickActions.gallery', 'Photo Gallery'), to: '/dashboard/profile/gallery', icon: <ImageIcon size={15} /> },
    { label: t('dashboard.quickActions.socialLinks'),     to: '/dashboard/profile/social-links',  icon: <Plus size={15} /> },
    { label: t('dashboard.quickActions.businessHours'),   to: '/dashboard/profile/hours',         icon: <Plus size={15} /> },
    { label: t('dashboard.quickActions.posts'),           to: '/dashboard/profile/posts',         icon: <Plus size={15} /> },
    { label: t('dashboard.quickActions.achievements'),    to: '/dashboard/profile/achievements',  icon: <Plus size={15} /> },
  ]

  async function handleTogglePublish() {
    if (!profile) return
    if (isPublished) {
      await unpublishMutation.mutateAsync().catch(() => {})
    } else {
      await publishMutation.mutateAsync().catch((e) => {
        // Surface the error inline — the button will re-enable
        console.error('Publish failed:', e?.response?.data?.message)
      })
    }
  }

  const isPending = publishMutation.isPending || unpublishMutation.isPending
  const publishError =
    publishMutation.error?.response?.data?.message ||
    unpublishMutation.error?.response?.data?.message || null

  return (
    <DashboardLayout title={t('dashboard.overview')}>
      <div className="flex flex-col gap-7">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">
              {profile ? t('dashboard.welcome', { name: profile.display_name || '' }) : t('dashboard.title')}
            </h2>
            <p className="text-sm text-ink-2 mt-0.5">{t('dashboard.yourPresence')}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {profile?.slug && (
              <Link to={`/p/${profile.slug}`} target="_blank">
                <Button variant="ghost" size="sm" icon={<Eye size={13} />}>{t('dashboard.viewProfile')}</Button>
              </Link>
            )}
            <Button variant="primary" size="sm" icon={<Edit3 size={13} />} onClick={() => navigate('/dashboard/profile')}>
              {t('dashboard.editProfile')}
            </Button>
          </div>
        </div>

        {/* Profile completion */}
        {!completionLoading && (
          <div className={`rounded-2xl border p-5 transition-colors ${
            score >= 80
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : score >= 50
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className={`text-[13.5px] font-bold ${
                  score >= 80 ? 'text-emerald-700 dark:text-emerald-300' : score >= 50 ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {t('dashboard.profileComplete', { score })}
                  {score >= 80 && <CheckCircle2 size={14} className="inline-block ml-1 text-emerald-600 dark:text-emerald-400" aria-label="Complete" />}
                </p>
                <p className="text-[12px] text-ink-2 mt-0.5">
                  {score < 100 ? t('dashboard.rankHigher') : t('dashboard.fullyComplete')}
                </p>
              </div>
              <span className={`text-xl font-extrabold ${
                score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {score}%
              </span>
            </div>
            <div className="w-full bg-surface-2 border border-border/60 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${score}%` }}
              />
            </div>
            {incompleteChecks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {incompleteChecks.map(c => (
                  <span key={c.key} className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-2 bg-surface border border-border px-2.5 py-1 rounded-full shadow-xs">
                    <Circle size={8} className="text-ink-3" /> {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Verification status (only for types that require it) ── */}
        {profile && needsVerification && (
          <div className={`rounded-2xl border p-5 ${badgeCls.bg} ${badgeCls.border}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3">
                {verStatus === VERIFICATION_STATUS.UNDER_REVIEW && <Clock size={18} className="text-blue-500 shrink-0 mt-0.5" />}
                {verStatus === VERIFICATION_STATUS.ACTIVE      && <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />}
                {verStatus === VERIFICATION_STATUS.REJECTED    && <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />}
                {(verStatus === VERIFICATION_STATUS.UNVERIFIED || verStatus === VERIFICATION_STATUS.PENDING) && <FileText size={18} className="text-ink-3 shrink-0 mt-0.5" />}
                <div>
                  <p className={`text-[13.5px] font-bold ${badgeCls.text}`}>
                    Verification Status: {statusLabel(verStatus)}
                  </p>
                  {verStatus === VERIFICATION_STATUS.UNDER_REVIEW && (
                    <p className="text-[12px] text-blue-600 dark:text-blue-400 mt-0.5">
                      Your profile and verification documents are waiting for admin review. Your profile will become public after approval.
                    </p>
                  )}
                  {verStatus === VERIFICATION_STATUS.ACTIVE && (
                    <p className="text-[12px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Your profile has been approved. You can now publish it publicly.
                    </p>
                  )}
                  {verStatus === VERIFICATION_STATUS.REJECTED && (
                    <div>
                      <p className="text-[12px] text-red-600 dark:text-red-400 mt-0.5">
                        Your profile verification was not approved.
                      </p>
                      {profile.rejection_reason && (
                        <p className="text-[12px] text-red-700 dark:text-red-300 mt-1 font-medium">
                          Reason: {profile.rejection_reason}
                        </p>
                      )}
                    </div>
                  )}
                  {(verStatus === VERIFICATION_STATUS.UNVERIFIED || verStatus === VERIFICATION_STATUS.PENDING) && (
                    <p className="text-[12px] text-ink-2 mt-0.5">
                      Complete your business information and upload a document, then submit for review.
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/profile')}>
                {verStatus === VERIFICATION_STATUS.REJECTED ? 'Edit & Resubmit' : 'View Details'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Publish / unpublish ── */}
        <div className={`flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border transition-colors ${
          isPublished
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-surface border-border'
        }`}>
          <div className="flex items-center gap-3">
            {isPublished
              ? <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
              : <AlertCircle size={18} className="text-amber-500 shrink-0" />
            }
            <div>
              <p className={`text-[13.5px] font-semibold ${isPublished ? 'text-emerald-700 dark:text-emerald-300' : 'text-ink'}`}>
                {isPublished ? t('dashboard.profileLive') : t('dashboard.notPublished')}
              </p>
              {publishError && !isPublished && (
                <p className="text-[11.5px] text-danger mt-0.5">{publishError}</p>
              )}
              {!isPublished && needsVerification && !publishAllowed && (
                <p className="text-[12px] text-ink-2 mt-0.5">
                  {verStatus === VERIFICATION_STATUS.UNDER_REVIEW
                    ? 'Awaiting admin approval before you can publish.'
                    : verStatus === VERIFICATION_STATUS.REJECTED
                    ? 'Fix the rejection reason and resubmit before publishing.'
                    : 'Submit for verification before publishing.'}
                </p>
              )}
              {!isPublished && !needsVerification && (
                <p className="text-[12px] text-ink-2">{t('dashboard.publish')}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={isPublished ? 'secondary' : 'primary'}
              size="sm"
              icon={isPublished ? <EyeOff size={13} /> : <Megaphone size={13} />}
              loading={isPending}
              disabled={!isPublished && !publishAllowed}
              onClick={handleTogglePublish}
              title={!isPublished && !publishAllowed ? 'Verification required before publishing' : undefined}
            >
              {isPublished ? t('dashboard.unpublish') : t('dashboard.publishNow')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/profile')}>
              {t('dashboard.edit')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label={t('dashboard.stats.profileViews')}
            value={(analytics?.views_30d ?? profile?.views_30d ?? 0).toLocaleString()}
            icon={<Eye size={15} />}
            loading={profileLoading && analyticsLoading}
            sub={t('dashboard.stats.last30Days')}
          />
          <StatCard
            label={t('dashboard.stats.contactClicks')}
            value={(analytics?.contact_clicks_30d ?? profile?.contact_clicks_30d ?? 0).toLocaleString()}
            icon={<TrendingUp size={15} />}
            loading={profileLoading && analyticsLoading}
            sub={t('dashboard.stats.last30Days')}
          />
          <StatCard
            label={t('dashboard.stats.reviews')}
            value={(analytics?.review_count ?? profile?.review_count ?? 0).toLocaleString()}
            icon={<Star size={15} />}
            loading={profileLoading && analyticsLoading}
            sub={(analytics?.avg_rating || profile?.avg_rating) > 0
              ? `${Number(analytics?.avg_rating || profile?.avg_rating).toFixed(1)} ★ rating`
              : t('dashboard.stats.noReviews', 'No reviews yet')}
          />
          <StatCard
            label={t('dashboard.stats.plan')}
            value={subLoading ? '—' : planName}
            icon={<CreditCard size={15} />}
            loading={subLoading}
            sub={subscription?.status ? subscription.status.toLowerCase() : undefined}
          />
        </div>

        {/* Subscription */}
        {!subLoading && subscription && (
          <div className={`flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl border transition-colors ${
            subscription.status === 'ACTIVE'
              ? 'bg-blue-500/10 border-blue-500/30'
              : 'bg-surface border-border'
          }`}>
            <div>
              <p className={`text-[13px] font-bold ${
                subscription.status === 'ACTIVE' ? 'text-blue-700 dark:text-blue-300' : 'text-ink'
              }`}>
                {planName} · {subscription.status}
              </p>
              {subscription.days_remaining != null && (
                <p className="text-[12px] text-ink-2 mt-0.5">
                  {subscription.days_remaining > 0
                    ? t('dashboard.subscriptionCard.daysRemaining', { days: subscription.days_remaining })
                    : t('dashboard.subscriptionCard.expired')}
                </p>
              )}
            </div>
            <Link to="/pricing">
              <Button variant="ghost" size="sm">
                {subscription.plan?.name === 'FREE'
                  ? t('dashboard.subscriptionCard.upgrade')
                  : t('dashboard.subscriptionCard.manage')}
              </Button>
            </Link>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h3 className="text-[15px] font-bold text-ink mb-3">{t('dashboard.manageProfile')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map(({ label, to, icon }) => (
              <Link key={to} to={to}
                className="flex items-center gap-2.5 p-3.5 bg-surface border border-border rounded-xl hover:border-brand hover:shadow-sm transition-all group hover:no-underline">
                <span className="text-ink-3 group-hover:text-brand transition-colors">{icon}</span>
                <span className="text-[13px] font-medium text-ink">{label}</span>
                <ArrowRight size={12} className="ml-auto text-ink-4 group-hover:text-brand transition-colors" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
