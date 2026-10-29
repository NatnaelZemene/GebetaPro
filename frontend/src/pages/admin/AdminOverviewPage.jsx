/**
 * AdminOverviewPage.jsx — concise, data-backed admin command centre.
 * Uses the existing stats, analytics, revenue, and verification endpoints.
 */
import { Link } from 'react-router-dom'
import {
  Users, Megaphone, CreditCard, TrendingUp, AlertCircle,
  CheckCircle2, Clock, ArrowUpRight, ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AdminLayout } from '../../components/layout/AdminLayout.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { BarChart, LineChart, PageHeader, StatCard } from '../../features/admin/components/AdminTable.jsx'
import {
  useAdminStats, useAdminRevenue, useAdminAnalytics,
  useAdminVerificationStats,
} from '../../features/admin/hooks/useAdmin.js'

function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-[12px] text-ink-3">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function AttentionLink({ to, icon: Icon, title, detail, count, tone = 'brand', loading }) {
  const tones = {
    brand: 'bg-brand-light text-brand',
    warning: 'bg-warning-bg text-warning',
    danger: 'bg-danger-bg text-danger',
  }
  return (
    <Link to={to} className="group flex min-w-0 items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-brand-border hover:bg-surface-2/50 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={17} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-ink-3">{detail}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {loading ? <Skeleton className="h-5 w-8 rounded" /> : <span className="text-[16px] font-bold tabular-nums text-ink">{count == null ? '—' : Number(count).toLocaleString()}</span>}
        <ArrowUpRight size={14} className="text-ink-4 transition-colors group-hover:text-brand" aria-hidden="true" />
      </span>
    </Link>
  )
}

function ChartPanel({ title, subtitle, data, valueField, formatValue, loading, error }) {
  return (
    <Panel title={title} subtitle={subtitle}>
      {loading ? <Skeleton className="h-[220px] w-full rounded-xl" /> : error ? (
        <p className="flex min-h-[190px] items-center justify-center gap-2 text-[12.5px] text-danger"><AlertCircle size={15} /> Analytics data is temporarily unavailable.</p>
      ) : <LineChart data={data} valueField={valueField} formatValue={formatValue} label={title} />}
    </Panel>
  )
}

export default function AdminOverviewPage() {
  const { t } = useTranslation()
  const statsQuery = useAdminStats()
  const revenueQuery = useAdminRevenue()
  const analyticsQuery = useAdminAnalytics()
  const verificationQuery = useAdminVerificationStats()
  const { data: stats, isLoading } = statsQuery
  const { data: revenue, isLoading: revenueLoading } = revenueQuery
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = analyticsQuery
  const { data: verification, isLoading: verificationLoading, error: verificationError } = verificationQuery

  const fmt = value => value == null ? '—' : Number(value).toLocaleString()
  const money = value => value == null ? '—' : `ETB ${Number(value).toLocaleString()}`

  if (statsQuery.error) {
    return (
      <AdminLayout title={t('admin.overview')}>
        <PageHeader title={t('admin.overview')} subtitle={t('admin.platformHealth')} />
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-danger/20 bg-danger-bg p-6 text-center">
          <AlertCircle size={26} className="text-danger" />
          <p className="text-[13px] font-medium text-danger">{statsQuery.error?.response?.data?.message || t('admin.loadFailed')}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={t('admin.overview')}>
      <PageHeader title={t('admin.overview')} subtitle={t('admin.platformHealth')} />

      <div className="flex flex-col gap-6">
        <section aria-label="Platform summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/admin/users" className="rounded-2xl hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <StatCard label={t('admin.stats.totalUsers')} value={fmt(stats?.total_users)} sub={t('admin.stats.thisWeek', { count: fmt(stats?.new_users_7d) })} icon={<Users size={16} />} iconBg="bg-brand-light" iconColor="text-brand" loading={isLoading} />
          </Link>
          <Link to="/admin/ads" className="rounded-2xl hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <StatCard label={t('admin.stats.publishedAds')} value={fmt(stats?.published_ads)} sub={`${fmt(stats?.new_ads_7d)} ${t('admin.stats.newAds7d')}`} icon={<Megaphone size={16} />} iconBg="bg-success-bg" iconColor="text-success" loading={isLoading} />
          </Link>
          <Link to="/admin/revenue" className="rounded-2xl hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <StatCard label={t('admin.stats.totalRevenue')} value={money(stats?.total_revenue_etb)} sub={t('admin.stats.payments', { count: fmt(stats?.total_payments) })} icon={<TrendingUp size={16} />} iconBg="bg-success-bg" iconColor="text-success" loading={isLoading} />
          </Link>
          <Link to="/admin/subscriptions" className="rounded-2xl hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <StatCard label={t('admin.stats.activeSubs')} value={fmt(stats?.active_subscriptions)} sub={t('admin.stats.paidPlans')} icon={<CreditCard size={16} />} iconBg="bg-brand-light" iconColor="text-brand" loading={isLoading} />
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Platform trends">
          <ChartPanel title="User growth" subtitle="New registrations · last 30 days" data={analytics?.users_daily} valueField="count" loading={analyticsLoading} error={analyticsError} />
          <ChartPanel title="Revenue trend" subtitle="Daily payments · last 30 days" data={analytics?.revenue_daily} valueField="revenue" formatValue={n => `ETB ${Number(n).toLocaleString()}`} loading={analyticsLoading} error={analyticsError} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Needs attention" subtitle="Items that may need an administrator’s review">
            <div className="flex flex-col gap-2.5">
              <AttentionLink to="/admin/verifications" icon={ShieldCheck} title="Profile verifications" detail={verificationError ? 'Could not load verification count' : 'Profiles awaiting review'} count={verificationError ? null : verification?.under_review} loading={verificationLoading} tone="brand" />
              <AttentionLink to="/admin/revenue" icon={Clock} title="Pending payments" detail="Payments awaiting confirmation" count={stats?.pending_payments} loading={isLoading} tone="warning" />
              <AttentionLink to="/admin/revenue" icon={AlertCircle} title="Failed payments" detail="Payments that need follow-up" count={stats?.failed_payments} loading={isLoading} tone="danger" />
            </div>
          </Panel>

          <Panel title="Advertisements by status" subtitle="Current listing distribution" action={<Link to="/admin/analytics" className="text-[12px] font-medium text-brand hover:underline">Analytics</Link>}>
            {analyticsLoading ? <div className="flex flex-col gap-3 py-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-4 w-full rounded" />)}</div> : analyticsError ? (
              <p className="flex min-h-36 items-center justify-center gap-2 text-[12.5px] text-danger"><AlertCircle size={15} /> Analytics data is temporarily unavailable.</p>
            ) : <BarChart data={analytics?.ads_by_status || []} keyField="status" valueField="count" label="Advertisements by status" />}
          </Panel>
        </section>

        <Link to="/admin/revenue" className="group flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-border hover:no-underline sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span>
            <span className="block text-[13px] font-semibold text-ink">{t('admin.stats.thisMonth')}</span>
            <span className="mt-1 block text-[11.5px] text-ink-3">{t('admin.stats.currentMonth')}</span>
          </span>
          <span className="flex items-center gap-2 text-[20px] font-bold tracking-tight text-ink">{revenueLoading ? <Skeleton className="h-6 w-28 rounded" /> : money(revenue?.current_month_etb)}<CheckCircle2 size={16} className="text-brand" aria-hidden="true" /></span>
        </Link>
      </div>
    </AdminLayout>
  )
}
