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
import { CreditCard, CheckCircle2, TrendingUp, Clock } from 'lucide-react'

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
  EXPIRED: <Badge variant="default" dot size="xs">Expired</Badge>,
  FREE:    <Badge variant="default" dot size="xs">Free</Badge>,
}

const PLAN_BADGE = {
  FREE:     <Badge variant="default" size="xs">Free</Badge>,
  BASIC:    <Badge variant="info"    size="xs">Basic</Badge>,
  PRO:      <Badge variant="brand"   size="xs">Pro</Badge>,
  BUSINESS: <Badge variant="dark"    size="xs">Business</Badge>,
}

/* ── Days remaining indicator ──────────────────────────────────────────── */
function DaysLeft({ end, status }) {
  if (!end || status !== 'ACTIVE') return null
  const ms = new Date(end) - Date.now()
  const d  = Math.ceil(ms / 86400000)
  if (d < 0)   return <span className="text-[11px] text-danger font-medium">Expired</span>
  if (d === 0) return <span className="text-[11px] text-warning font-medium">Expires today</span>
  if (d <= 7)  return <span className="text-[11px] text-warning font-medium">{d}d left</span>
  return <span className="text-[11px] text-ink-3">{d}d left</span>
}

/* ── Expiry bar ────────────────────────────────────────────────────────── */
function ExpiryBar({ start, end, status }) {
  if (!start || !end || status !== 'ACTIVE') return null
  const total   = new Date(end) - new Date(start)
  const elapsed = Date.now() - new Date(start)
  const pct     = Math.max(0, Math.min(100, (elapsed / total) * 100))
  const isLow   = pct > 80

  return (
    <div className="mt-1.5 w-full max-w-[80px] h-1 bg-surface-2 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${isLow ? 'bg-warning' : 'bg-brand'}`}
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
      key: 'email',
      label: 'User',
      render: s => (
        <div>
          <p className="text-[13.5px] font-medium text-ink">{s.email || '—'}</p>
          {s.phone && <p className="text-[11.5px] text-ink-3">{s.phone}</p>}
        </div>
      ),
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
      className: 'hidden md:table-cell',
      cellClass:  'hidden md:table-cell',
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
      className: 'hidden lg:table-cell',
      cellClass:  'hidden lg:table-cell',
    },
    {
      key: 'price_etb',
      label: 'Price',
      render: s => (
        <span className="text-[13px] font-medium text-ink tabular-nums">
          {s.price_etb > 0 ? `ETB ${Number(s.price_etb).toLocaleString()}` : <span className="text-ink-3 font-normal">Free</span>}
        </span>
      ),
      className: 'hidden xl:table-cell',
      cellClass:  'hidden xl:table-cell',
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
          emptyMessage="No subscriptions found."
        />

        <Pagination pagination={pagination} onPage={setPage} />
      </div>
    </AdminLayout>
  )
}
