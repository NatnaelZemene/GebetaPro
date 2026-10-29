/**
 * AdminAnalyticsPage.jsx — Platform analytics.
 * All charts CSS/SVG — no chart library dependency.
 */
import { AdminLayout } from '../../components/layout/AdminLayout.jsx'
import { Skeleton }    from '../../components/ui/Skeleton.jsx'
import {
  BarChart, LineChart, PageHeader, StatCard,
} from '../../features/admin/components/AdminTable.jsx'
import { useAdminAnalytics } from '../../features/admin/hooks/useAdmin.js'
import { Users, Megaphone, TrendingUp, AlertCircle } from 'lucide-react'

/* ── Chart card wrapper ────────────────────────────────────────────────── */
function ChartCard({ title, subtitle, children, loading, className = '' }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl p-4 sm:p-5 ${className}`}>
      <div className="mb-4">
        <p className="text-[13.5px] font-semibold text-ink">{title}</p>
        {subtitle && <p className="text-[12px] text-ink-3 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <Skeleton className="h-[210px] w-full rounded-xl" />
      ) : children}
    </div>
  )
}

/* ── Timeline with accessible trend chart ───────────────────────────────── */
function Timeline({ data, dateField = 'date', valueField = 'count', formatTotal, formatValue }) {
  if (!data || data.length === 0) return (
    <p className="text-[12.5px] text-ink-3 text-center py-6">No data for this period.</p>
  )

  const total  = data.reduce((s, d) => s + Number(d[valueField] || 0), 0)
  return (
    <div>
      {/* Total + period */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <span className="text-[27px] font-bold text-ink leading-none tracking-tight tabular-nums">
            {formatTotal ? formatTotal(total) : total.toLocaleString()}
          </span>
        </div>
        <span className="text-[11.5px] text-ink-3 mb-1">last 30 days</span>
      </div>

      <LineChart data={data} dateField={dateField} valueField={valueField} formatValue={formatValue} label="Platform activity over the last 30 days" />
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const { data, isLoading, error } = useAdminAnalytics()

  if (error) {
    return (
      <AdminLayout title="Analytics">
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertCircle size={24} className="text-danger" />
          <p className="text-[13px] text-ink-2">{error?.response?.data?.message || 'Failed to load analytics.'}</p>
        </div>
      </AdminLayout>
    )
  }

  /* Compute simple totals for header KPIs */
  const totalNewUsers  = (data?.users_daily   || []).reduce((s, d) => s + Number(d.count   || 0), 0)
  const totalNewAds    = (data?.ads_daily      || []).reduce((s, d) => s + Number(d.count   || 0), 0)
  const totalRevenue   = (data?.revenue_daily  || []).reduce((s, d) => s + Number(d.revenue || 0), 0)

  return (
    <AdminLayout title="Analytics">
      <PageHeader
        title="Analytics"
        subtitle="Platform usage trends over the last 30 days."
      />

      <div className="flex flex-col gap-6">

        {/* ── Summary KPIs ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="New users (30d)"
            value={isLoading ? undefined : totalNewUsers.toLocaleString()}
            icon={<Users size={15} />}
            iconBg="bg-brand-light"
            iconColor="text-brand"
            loading={isLoading}
          />
          <StatCard
            label="New ads (30d)"
            value={isLoading ? undefined : totalNewAds.toLocaleString()}
            icon={<Megaphone size={15} />}
            iconBg="bg-brand-light"
            iconColor="text-brand"
            loading={isLoading}
          />
          <StatCard
            label="Revenue (30d)"
            value={isLoading ? undefined : `ETB ${totalRevenue.toLocaleString()}`}
            icon={<TrendingUp size={15} />}
            iconBg="bg-success-bg"
            iconColor="text-success"
            loading={isLoading}
            className=""
          />
        </div>

        {/* ── Trend charts ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChartCard
            title="User growth"
            subtitle="New registrations over 30 days"
            loading={isLoading}
          >
            <Timeline data={data?.users_daily} valueField="count" />
          </ChartCard>

          <ChartCard
            title="Advertisement activity"
            subtitle="New listings over 30 days"
            loading={isLoading}
          >
            <Timeline data={data?.ads_daily} valueField="count" />
          </ChartCard>
        </div>

        <ChartCard
          title="Revenue trend"
          subtitle="Daily revenue over 30 days"
          loading={isLoading}
        >
            <Timeline
            data={data?.revenue_daily}
            valueField="revenue"
            formatTotal={n => `ETB ${n.toLocaleString()}`}
              formatValue={n => `ETB ${Number(n).toLocaleString()}`}
          />
        </ChartCard>

        {/* ── Distribution charts ───────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChartCard
            title="Ads by status"
            loading={isLoading}
          >
            {data?.ads_by_status?.length > 0 ? (
              <BarChart
                data={data.ads_by_status}
                keyField="status"
                valueField="count"
              />
            ) : (
              <p className="text-[12.5px] text-ink-3 text-center py-4">No data.</p>
            )}
          </ChartCard>

          <ChartCard
            title="Top categories by ads"
            subtitle="Top 10 categories"
            loading={isLoading}
          >
            {data?.ads_by_category?.length > 0 ? (
              <BarChart
                data={data.ads_by_category.slice(0, 10)}
                keyField="category"
                valueField="count"
              />
            ) : (
              <p className="text-[12.5px] text-ink-3 text-center py-4">No data.</p>
            )}
          </ChartCard>
        </div>

        {/* ── Subscriptions by plan ─────────────────────────────────── */}
        {(isLoading || data?.subs_by_plan?.length > 0) && (
          <ChartCard
            title="Users by subscription plan"
            loading={isLoading}
          >
            {!isLoading && (
              <>
                <BarChart
                  data={data.subs_by_plan}
                  keyField="plan"
                  valueField="count"
                  className="mb-5"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
                  {data.subs_by_plan.map(p => (
                    <div key={p.plan_name || p.plan} className="text-center">
                      <p className="text-[22px] font-bold text-ink leading-none">
                        {Number(p.count).toLocaleString()}
                      </p>
                      <p className="text-[11.5px] text-ink-3 mt-1">{p.plan}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>
        )}
      </div>
    </AdminLayout>
  )
}
