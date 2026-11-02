/**
 * AdminSubscriptionsPage.jsx — Subscription records.
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminLayout }  from '../../components/layout/AdminLayout.jsx'
import { Badge }        from '../../components/ui/Badge.jsx'
import {
  AdminTable, SearchBar, FilterSelect,
  Pagination, PageHeader, StatCard,
} from '../../features/admin/components/AdminTable.jsx'
import { useAdminSubscriptions, useAdminSubOverview } from '../../features/admin/hooks/useAdmin.js'
import { CategoryIconInline } from '../../features/profiles/components/CategoryIcon.jsx'
import { SubscriptionDetailDrawer } from '../../features/admin/components/SubscriptionDetailDrawer.jsx'
import {
  CreditCard, CheckCircle2, TrendingUp, Clock,
  BadgeCheck, ExternalLink, Copy, Check,
} from 'lucide-react'

const STATUS_OPTS = [
  { value: 'ACTIVE',  label: 'Active'  },
  { value: 'EXPIRED', label: 'Expired' },
]

const PLAN_OPTS = [
  { value: 'FREE',     label: 'Free' },
  { value: 'BASIC',    label: 'Basic' },
  { value: 'PRO',      label: 'Pro' },
  { value: 'BUSINESS', label: 'Business' },
]

const STATUS_BADGE = {
  ACTIVE:  <Badge variant="success" dot size="xs">Active</Badge>,
  EXPIRED: <Badge variant="danger"  dot size="xs">Expired</Badge>,
  FREE:    <Badge variant="default" size="xs">Free Plan</Badge>,
}

const PLAN_BADGE = {
  FREE:     <Badge variant="default" size="xs">Free</Badge>,
  BASIC:    <Badge variant="info"    size="xs">Basic</Badge>,
  PRO:      <Badge variant="brand"   size="xs">Pro</Badge>,
  BUSINESS: <Badge variant="dark"    size="xs">Business</Badge>,
}

/* ── Avatar component ─────────────────────────────────────────────────── */
function SubscriberAvatar({ avatarUrl, email, name }) {
  const [imgError, setImgError] = useState(false)
  const initial = (name?.[0] || email?.[0] || '?').toUpperCase()

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt=""
        onError={() => setImgError(true)}
        className="w-8 h-8 rounded-full object-cover shrink-0 border border-border/80 shadow-2xs"
      />
    )
  }

  return (
    <div className="w-8 h-8 rounded-full bg-brand-light dark:bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
      <span className="text-[12px] font-bold text-brand leading-none">{initial}</span>
    </div>
  )
}

/* ── Inline 1-click copy button ────────────────────────────────────────── */
function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e) {
    e.stopPropagation()
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard!' : label}
      className="p-1 rounded text-ink-4 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
    >
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
    </button>
  )
}

/* ── Days remaining indicator ──────────────────────────────────────────── */
function DaysLeft({ end, status }) {
  if (status === 'FREE') {
    return <span className="text-[11px] text-ink-4 font-normal">Perpetual</span>
  }
  if (!end) return null
  const ms = new Date(end) - Date.now()
  const d  = Math.ceil(ms / 86400000)

  if (status === 'EXPIRED' || d < 0) {
    const ago = Math.abs(d)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
        Expired {ago > 0 ? `${ago}d ago` : 'today'}
      </span>
    )
  }

  if (d === 0) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold">
        Expires today!
      </span>
    )
  }

  if (d <= 3) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
        {d}d left (critical)
      </span>
    )
  }

  if (d <= 7) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
        {d}d left
      </span>
    )
  }

  return <span className="text-[11.5px] text-ink-3 tabular-nums font-medium">{d} days left</span>
}

/* ── Expiry bar ────────────────────────────────────────────────────────── */
function ExpiryBar({ start, end, status }) {
  if (!start || !end || status !== 'ACTIVE') return null
  const total   = new Date(end) - new Date(start)
  if (total <= 0) return null
  const elapsed = Date.now() - new Date(start)
  const pct     = Math.max(0, Math.min(100, (elapsed / total) * 100))
  const isCritical = pct >= 90
  const isWarning  = pct >= 75 && !isCritical

  return (
    <div
      className="mt-1.5 w-full max-w-[90px] h-1.5 bg-surface-2 dark:bg-surface-2/60 rounded-full overflow-hidden border border-border/40"
      title={`${Math.round(pct)}% of billing period elapsed`}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          isCritical
            ? 'bg-rose-500'
            : isWarning
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function AdminSubscriptionsPage() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [plan,   setPlan]   = useState(searchParams.get('plan')   || '')
  const [expiringDays, setExpiringDays] = useState(searchParams.get('expiring_days') || '')
  const [page,   setPage]   = useState(1)
  const [debSearch, setDebSearch] = useState(search)

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debSearch, status, plan, expiringDays])

  const params = {
    page, page_size: 20,
    ...(debSearch    && { search: debSearch }),
    ...(status       && { status }),
    ...(plan         && { plan }),
    ...(expiringDays && { expiring_days: expiringDays }),
  }

  const { data, isLoading, error } = useAdminSubscriptions(params)
  const { data: overview, isLoading: overviewLoading } = useAdminSubOverview()
  const subs       = data?.subscriptions || []
  const pagination = data?.pagination    || null

  const [selectedSubscription, setSelectedSubscription] = useState(null)

  const totalSubs    = Number(overview?.total_users ?? pagination?.total ?? subs.length)
  const activeSubs   = Number(overview?.active_subscriptions ?? 0)
  const expiringSoon = Number(overview?.expiring_soon_7d ?? 0)
  const expiredSubs  = Number(overview?.expired_subscriptions ?? 0)
  const mrrEtb       = Number(overview?.mrr_etb ?? overview?.total_revenue_etb ?? 0)
  const activeRate   = totalSubs > 0 ? Math.round((activeSubs / totalSubs) * 100) : 100

  // Quick segment tab selection
  const activeSegment = expiringDays === '7'
    ? 'expiring'
    : plan === 'PAID'
    ? 'paid'
    : status === 'ACTIVE'
    ? 'active'
    : status === 'EXPIRED'
    ? 'expired'
    : 'all'

  function handleSelectSegment(seg) {
    setPage(1)
    if (seg === 'all') {
      setStatus('')
      setPlan('')
      setExpiringDays('')
    } else if (seg === 'active') {
      setStatus('ACTIVE')
      setPlan('')
      setExpiringDays('')
    } else if (seg === 'expiring') {
      setStatus('')
      setPlan('')
      setExpiringDays('7')
    } else if (seg === 'expired') {
      setStatus('EXPIRED')
      setPlan('')
      setExpiringDays('')
    } else if (seg === 'paid') {
      setStatus('')
      setPlan('PAID')
      setExpiringDays('')
    }
  }

  const SEGMENTS = [
    { id: 'all',      label: 'All Subscriptions', count: totalSubs },
    { id: 'active',   label: 'Active',            count: activeSubs },
    { id: 'expiring', label: 'Expiring Soon (7d)', count: expiringSoon, alert: expiringSoon > 0 },
    { id: 'expired',  label: 'Expired',           count: expiredSubs },
    { id: 'paid',     label: 'Paid Plans' },
  ]

  const columns = [
    {
      key: 'subscriber',
      label: 'Subscriber & Business',
      render: s => {
        const name = s.business_name || s.display_name
        return (
          <div className="flex items-center gap-3 min-w-0">
            <SubscriberAvatar avatarUrl={s.avatar_url} email={s.email} name={name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[13.5px] font-semibold text-ink leading-snug truncate">
                  {name || s.email || '—'}
                </span>
                {s.profile_verified && (
                  <BadgeCheck size={13} className="text-brand shrink-0" aria-label="Verified" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
                <span className="truncate max-w-[150px]">{s.email}</span>
                <CopyButton text={s.email} label="Copy email" />
                {s.phone && <span className="text-ink-4">· {s.phone}</span>}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'category',
      label: 'Sector',
      render: s => (
        s.category_name ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-2 dark:bg-surface-2/60 text-[12px] font-medium text-ink max-w-[140px] truncate border border-border/60">
            <CategoryIconInline slug={s.category_slug} name={s.category_name} size={11} />
            <span className="truncate">{s.category_name}</span>
          </span>
        ) : (
          <span className="text-[12px] text-ink-4">—</span>
        )
      ),
      className: 'hidden md:table-cell',
      cellClass:  'hidden md:table-cell',
    },
    {
      key: 'city',
      label: 'City',
      render: s => (
        s.city ? (
          <span className="text-[12.5px] text-ink font-medium">{s.city}</span>
        ) : (
          <span className="text-[12px] text-ink-4">—</span>
        )
      ),
      className: 'hidden lg:table-cell',
      cellClass:  'hidden lg:table-cell',
    },
    {
      key: 'plan_name',
      label: 'Plan',
      render: s => PLAN_BADGE[s.plan_name] || <Badge variant="default" size="xs">{s.plan_display_name}</Badge>,
      className: 'hidden sm:table-cell',
      cellClass:  'hidden sm:table-cell',
    },
    {
      key: 'status',
      label: 'Status',
      render: s => STATUS_BADGE[s.status] || <Badge variant="default" size="xs">{s.status}</Badge>,
      className: 'hidden sm:table-cell',
      cellClass:  'hidden sm:table-cell',
    },
    {
      key: 'current_period_start',
      label: 'Started',
      render: s => (
        <span className="text-[12px] text-ink-3 tabular-nums">
          {s.current_period_start
            ? new Date(s.current_period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      ),
      className: 'hidden xl:table-cell',
      cellClass:  'hidden xl:table-cell',
    },
    {
      key: 'current_period_end',
      label: 'Expires',
      render: s => (
        <div>
          <p className="text-[12px] text-ink-3 tabular-nums">
            {s.current_period_end
              ? new Date(s.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </p>
          <DaysLeft end={s.current_period_end} status={s.status} />
          <ExpiryBar start={s.current_period_start} end={s.current_period_end} status={s.status} />
        </div>
      ),
      className: 'hidden sm:table-cell',
      cellClass:  'hidden sm:table-cell',
    },
    {
      key: 'price_etb',
      label: 'Price',
      render: s => (
        <span className="text-[13px] font-medium text-ink tabular-nums">
          {s.price_etb > 0 ? `ETB ${Number(s.price_etb).toLocaleString()}` : <span className="text-ink-3 font-normal">Free</span>}
        </span>
      ),
      className: 'hidden 2xl:table-cell',
      cellClass:  'hidden 2xl:table-cell',
    },
    {
      key: 'actions',
      label: '',
      render: s => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          {s.slug && (
            <a
              href={`/p/${s.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View live public directory profile"
              className="p-1.5 rounded-lg text-ink-3 hover:text-brand hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      ),
      cellClass: 'text-right',
      className: 'text-right w-12',
    },
  ]

  return (
    <AdminLayout title="Subscriptions">
      <PageHeader
        title="Subscriptions"
        subtitle="All active and expired subscription records."
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        <StatCard
          label="Active Subscribers"
          value={activeSubs.toLocaleString()}
          sub={`${activeRate}% active rate`}
          icon={<CheckCircle2 size={16} />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          iconColor="text-emerald-600 dark:text-emerald-400"
          loading={overviewLoading && isLoading}
        />
        <StatCard
          label="Monthly Value (MRR)"
          value={`ETB ${mrrEtb.toLocaleString()}`}
          sub="Active subscriber run-rate"
          icon={<TrendingUp size={16} />}
          iconBg="bg-brand-light dark:bg-brand/10"
          iconColor="text-brand"
          loading={overviewLoading}
        />
        <StatCard
          label="Expiring Soon (7d)"
          value={expiringSoon.toLocaleString()}
          sub={expiringSoon > 0 ? "Requires renewal watch" : "All renewals healthy"}
          icon={<Clock size={16} />}
          iconBg={expiringSoon > 0 ? "bg-amber-50 dark:bg-amber-950/40" : "bg-surface-2"}
          iconColor={expiringSoon > 0 ? "text-amber-600 dark:text-amber-400" : "text-ink-3"}
          loading={overviewLoading}
        />
        <StatCard
          label="Expired Accounts"
          value={expiredSubs.toLocaleString()}
          sub="Lapsed memberships"
          icon={<CreditCard size={16} />}
          iconBg="bg-surface-2"
          iconColor="text-ink-3"
          loading={overviewLoading}
        />
      </div>

      {/* Segment filter pills */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-2/60 dark:bg-surface-2/30 border border-border/70 rounded-xl w-fit mb-4 overflow-x-auto max-w-full">
        {SEGMENTS.map(tab => {
          const isCurrent = activeSegment === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectSegment(tab.id)}
              className={`
                px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap
                flex items-center gap-2
                ${isCurrent
                  ? 'bg-surface dark:bg-canvas text-ink shadow-xs font-semibold'
                  : 'text-ink-3 hover:text-ink hover:bg-surface/50'
                }
              `}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`
                    px-1.5 py-0.2 rounded-md text-[11px] font-semibold tabular-nums
                    ${tab.alert
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                      : isCurrent
                      ? 'bg-brand/10 text-brand'
                      : 'bg-surface-2 text-ink-3'
                    }
                  `}
                >
                  {tab.count.toLocaleString()}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by email, name, business…"
            className="w-full sm:flex-1 sm:max-w-xs"
          />
          <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTS} placeholder="All statuses" />
          <FilterSelect value={plan}   onChange={setPlan}   options={PLAN_OPTS}   placeholder="All plans" />
          {(search || status || plan || expiringDays) && (
            <button
              onClick={() => { setSearch(''); setStatus(''); setPlan(''); setExpiringDays('') }}
              className="text-[12.5px] text-ink-3 hover:text-danger transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        <AdminTable
          columns={columns}
          rows={subs}
          loading={isLoading}
          error={error}
          onRowClick={s => setSelectedSubscription(s)}
          emptyMessage="No subscriptions found."
        />

        <Pagination pagination={pagination} onPage={setPage} />
      </div>

      {/* Slide-over Subscription Detail Drawer */}
      {selectedSubscription && (
        <SubscriptionDetailDrawer
          subscription={selectedSubscription}
          onClose={() => setSelectedSubscription(null)}
        />
      )}
    </AdminLayout>
  )
}
