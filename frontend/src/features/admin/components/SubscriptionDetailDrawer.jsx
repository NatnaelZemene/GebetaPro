/**
 * SubscriptionDetailDrawer.jsx — Modern Slide-over Inspection Sheet for Admin Subscription Management.
 *
 * Modeled after Stripe Billing & Chargebee customer drawers:
 *   - Slide-in from right with backdrop blur and escape dismissal (useFocusTrap).
 *   - Rich customer identity (avatar, business name, category, directory link).
 *   - Billing lifecycle details (start/end dates, exact countdown, MRR, limits).
 *   - In-drawer payment transaction audit history.
 *   - Quick administrative actions (courtesy extensions, plan change, status toggle).
 */
import { useEffect, useState } from 'react'
import {
  X, Calendar, CreditCard, ExternalLink, Copy, Check,
  BadgeCheck, Mail, Phone, MapPin, Globe, Sparkles,
  CalendarPlus, Layers, AlertCircle, RefreshCw, Clock,
  ArrowUpRight, CheckCircle2, ChevronDown, CheckCircle,
} from 'lucide-react'
import { Badge } from '../../../components/ui/Badge.jsx'
import { CategoryIcon } from '../../profiles/components/CategoryIcon.jsx'
import { useAdminSubscriptionDetail } from '../hooks/useAdmin.js'
import { useFocusTrap } from '../../../hooks/useFocusTrap.js'

const PLAN_BADGE = {
  FREE:     <Badge variant="default" size="xs">Free Plan</Badge>,
  BASIC:    <Badge variant="info"    size="xs">Basic Plan</Badge>,
  PRO:      <Badge variant="brand"   size="xs">Pro Plan</Badge>,
  BUSINESS: <Badge variant="dark"    size="xs">Business Plan</Badge>,
}

const STATUS_BADGE = {
  ACTIVE:  <Badge variant="success" dot size="xs">Active</Badge>,
  EXPIRED: <Badge variant="danger"  dot size="xs">Expired</Badge>,
  FREE:    <Badge variant="default" size="xs">Free Plan</Badge>,
}

function CopyTx({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        if (!text) return
        navigator.clipboard?.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      title="Copy transaction reference"
      className="p-0.5 text-ink-4 hover:text-ink cursor-pointer"
    >
      {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
    </button>
  )
}

export function SubscriptionDetailDrawer({
  subscription,
  onClose,
  onExtend,
  onChangePlan,
  onUpdateStatus,
  loading = false,
}) {
  const [copiedSubId, setCopiedSubId] = useState(false)
  const [copiedUserId, setCopiedUserId] = useState(false)

  // Fetch full details including payment history
  const { data: detailData, isLoading: detailLoading } = useAdminSubscriptionDetail(subscription?.id)
  const fullSub = detailData || subscription

  // Accessible focus trap
  const trapRef = useFocusTrap(Boolean(subscription), onClose)

  if (!subscription) return null

  function handleCopy(text, type) {
    if (!text) return
    navigator.clipboard?.writeText(text)
    if (type === 'sub') {
      setCopiedSubId(true)
      setTimeout(() => setCopiedSubId(false), 1800)
    } else {
      setCopiedUserId(true)
      setTimeout(() => setCopiedUserId(false), 1800)
    }
  }

  const name = fullSub.business_name || fullSub.display_name || fullSub.email
  const initial = (name?.[0] || '?').toUpperCase()
  const isExpired = fullSub.status === 'EXPIRED'
  const isActive = fullSub.status === 'ACTIVE'

  // Expiry countdown calculation
  const msRemaining = fullSub.current_period_end ? new Date(fullSub.current_period_end) - Date.now() : 0
  const daysRemaining = Math.ceil(msRemaining / 86400000)

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end"
      aria-labelledby="subscription-drawer-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Slide-over panel */}
      <div
        ref={trapRef}
        className="
          w-full max-w-md sm:max-w-xl bg-surface border-l border-border h-full flex flex-col shadow-2xl
          animate-in slide-in-from-right duration-200
        "
      >
        {/* ── Drawer Header ────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 border-b border-border bg-surface-2/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {fullSub.avatar_url ? (
              <img
                src={fullSub.avatar_url}
                alt=""
                className="w-13 h-13 rounded-2xl object-cover shrink-0 border border-border shadow-xs"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-brand-light dark:bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
                <span className="text-[18px] font-bold text-brand">{initial}</span>
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h2 id="subscription-drawer-title" className="text-[17px] font-bold text-ink truncate leading-tight">
                  {name}
                </h2>
                {fullSub.profile_verified && (
                  <BadgeCheck size={16} className="text-brand shrink-0" aria-label="Verified profile" />
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {PLAN_BADGE[fullSub.plan_name] || <Badge variant="default" size="xs">{fullSub.plan_display_name || fullSub.plan_name}</Badge>}
                {STATUS_BADGE[fullSub.status] || <Badge variant="default" size="xs">{fullSub.status}</Badge>}
                {fullSub.price_etb > 0 ? (
                  <span className="text-[12px] font-semibold text-ink-2 tabular-nums">
                    ETB {Number(fullSub.price_etb).toLocaleString()} / mo
                  </span>
                ) : (
                  <span className="text-[12px] text-ink-3">Free Tier</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Drawer Scrollable Body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Quick ID & Meta Bar */}
          <div className="bg-surface-2/40 border border-border/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-ink-3">
            <div className="flex items-center gap-2">
              <span>Sub ID:</span>
              <code className="text-ink font-mono text-[11px] bg-surface px-1.5 py-0.5 rounded border border-border">
                {fullSub.id?.slice(0, 8)}…{fullSub.id?.slice(-4)}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(fullSub.id, 'sub')}
                title="Copy subscription ID"
                className="p-1 hover:text-ink transition-colors cursor-pointer"
              >
                {copiedSubId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span>User ID:</span>
              <code className="text-ink font-mono text-[11px] bg-surface px-1.5 py-0.5 rounded border border-border">
                {fullSub.user_id?.slice(0, 8)}…{fullSub.user_id?.slice(-4)}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(fullSub.user_id, 'user')}
                title="Copy user ID"
                className="p-1 hover:text-ink transition-colors cursor-pointer"
              >
                {copiedUserId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </div>
          </div>

          {/* ── Billing & Period Section ──────────────────────────────── */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-ink flex items-center gap-2">
                <CreditCard size={15} className="text-brand" />
                <span>Billing Period & Status</span>
              </h3>

              {isActive && (
                daysRemaining <= 7 ? (
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Clock size={11} /> {daysRemaining <= 0 ? 'Expires today' : `${daysRemaining} days left`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} /> {daysRemaining} days left
                  </span>
                )
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div className="p-3 rounded-xl bg-surface-2/40 border border-border/60">
                <span className="block text-[11px] font-medium text-ink-3 mb-1">Period Started</span>
                <span className="font-semibold text-ink tabular-nums">
                  {fullSub.current_period_start
                    ? new Date(fullSub.current_period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-2/40 border border-border/60">
                <span className="block text-[11px] font-medium text-ink-3 mb-1">Period Expires</span>
                <span className="font-semibold text-ink tabular-nums">
                  {fullSub.current_period_end
                    ? new Date(fullSub.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Perpetual (Free)'}
                </span>
              </div>
            </div>

            {/* Plan Entitlements Summary */}
            <div className="pt-2 border-t border-border/60 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-surface-2/30">
                <span className="block text-[10.5px] text-ink-3">Published Ads</span>
                <span className="text-[14px] font-bold text-ink tabular-nums">
                  {fullSub.published_ads ?? 0}
                  <span className="text-[11px] text-ink-4 font-normal"> / {fullSub.max_active_ads ?? '—'}</span>
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface-2/30">
                <span className="block text-[10.5px] text-ink-3">Max Images/Ad</span>
                <span className="text-[14px] font-bold text-ink tabular-nums">
                  {fullSub.max_images_per_ad ?? '—'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface-2/30">
                <span className="block text-[10.5px] text-ink-3">Featured Listing</span>
                <span className="text-[13px] font-bold text-ink">
                  {fullSub.is_featured ? 'Yes ⭐' : 'Standard'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Directory Profile Block ────────────────────────────────── */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-ink">Directory Identity</h3>
              {fullSub.slug && (
                <a
                  href={`/p/${fullSub.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
                >
                  <span>View live profile</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {fullSub.headline && (
              <p className="text-[13px] text-ink-2 italic border-l-2 border-brand/50 pl-3">
                "{fullSub.headline}"
              </p>
            )}

            <div className="space-y-2 text-[12.5px] text-ink">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-ink-3 shrink-0" />
                <span className="truncate">{fullSub.email}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(fullSub.email, 'email')}
                  className="text-ink-4 hover:text-ink cursor-pointer ml-1"
                >
                  <Copy size={11} />
                </button>
              </div>

              {fullSub.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-ink-3 shrink-0" />
                  <span>{fullSub.phone}</span>
                </div>
              )}

              {fullSub.category_name && (
                <div className="flex items-center gap-2">
                  <CategoryIcon slug={fullSub.category_slug} name={fullSub.category_name} size={13} />
                  <span className="font-medium">{fullSub.category_name}</span>
                </div>
              )}

              {fullSub.city && (
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-ink-3 shrink-0" />
                  <span>{fullSub.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── In-Drawer Payment & Invoice History List (Task 8 hook) ── */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-ink flex items-center gap-2">
                <CreditCard size={15} className="text-ink-3" />
                <span>Payment & Transaction History</span>
              </h3>
              {detailLoading && <span className="text-[11px] text-ink-4">Loading…</span>}
            </div>

            {(!fullSub.payments || fullSub.payments.length === 0) ? (
              <p className="text-[12px] text-ink-4 py-2">No payment transactions recorded for this account.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {fullSub.payments.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-[12px]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink">
                        <span className="truncate max-w-[140px]">{p.tx_ref}</span>
                        <CopyTx text={p.tx_ref} />
                        <span className="text-[10px] text-ink-4 uppercase">({p.payment_method || 'Chapa'})</span>
                      </div>
                      <span className="text-[11px] text-ink-3">
                        {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-ink tabular-nums">
                        ETB {Number(p.amount_etb).toLocaleString()}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : p.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Action Footer (Tasks 9 & 10 controls) ───────────────────── */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface-2/30 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onExtend?.(fullSub)}
              disabled={loading}
              className="
                inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold
                bg-brand text-white hover:bg-brand-hover shadow-xs transition-colors cursor-pointer
                disabled:opacity-50
              "
            >
              <CalendarPlus size={14} />
              <span>Extend Period</span>
            </button>

            <button
              type="button"
              onClick={() => onChangePlan?.(fullSub)}
              disabled={loading}
              className="
                inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium
                bg-surface hover:bg-surface-2 text-ink border border-border shadow-xs transition-colors cursor-pointer
                disabled:opacity-50
              "
            >
              <Layers size={14} className="text-ink-3" />
              <span>Change Plan</span>
            </button>
          </div>

          <div>
            {isActive ? (
              <button
                type="button"
                onClick={() => onUpdateStatus?.(fullSub.id, 'EXPIRED')}
                disabled={loading}
                className="
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium
                  bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20
                  transition-colors cursor-pointer disabled:opacity-50
                "
              >
                <span>Expire Subscription</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onUpdateStatus?.(fullSub.id, 'ACTIVE')}
                disabled={loading}
                className="
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium
                  bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20
                  transition-colors cursor-pointer disabled:opacity-50
                "
              >
                <CheckCircle2 size={13} />
                <span>Reactivate</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
