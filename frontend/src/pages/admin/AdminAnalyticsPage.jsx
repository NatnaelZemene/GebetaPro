/**
 * AdminAnalyticsPage.jsx — Platform analytics & business intelligence.
 */
import { useSearchParams, Link } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout.jsx'
import { Skeleton }    from '../../components/ui/Skeleton.jsx'
import {
  BarChart, StatCard,
} from '../../features/admin/components/AdminTable.jsx'
import { useAdminAnalytics } from '../../features/admin/hooks/useAdmin.js'
import { InteractiveAreaChart } from '../../features/admin/components/InteractiveAreaChart.jsx'
import { ContactChannelBreakdown } from '../../features/admin/components/ContactChannelBreakdown.jsx'
import { ConversionFunnelWidget } from '../../features/admin/components/ConversionFunnelWidget.jsx'
import { CategoryIconInline } from '../../features/profiles/components/CategoryIcon.jsx'
import { exportAnalyticsToCSV } from '../../features/admin/utils/exportAnalyticsCSV.js'
import {
  Users, TrendingUp, AlertCircle,
  Eye, MousePointerClick, Percent,
  MapPin, ExternalLink, BadgeCheck, Download,
} from 'lucide-react'

const RANGE_OPTIONS = [
  { value: '7d',  label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '12m', label: 'Last 12 Months' },
]

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

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const range = searchParams.get('range') || '30d'
  const currentRangeOption = RANGE_OPTIONS.find(o => o.value === range) || RANGE_OPTIONS[1]

  function handleRangeChange(newRange) {
    const p = new URLSearchParams(searchParams)
    p.set('range', newRange)
    setSearchParams(p)
  }

  const { data, isLoading, error } = useAdminAnalytics({ range })

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

  const metrics = data?.summary_metrics
  const prevLabel = range === '7d' ? 'vs prior 7d' : range === '90d' ? 'vs prior 90d' : range === '12m' ? 'vs prior 12m' : 'vs prior 30d'

  const totalViews     = Number(data?.total_views || 0)
  const totalContacts  = Number(data?.total_contacts || 0)
  const leadCtr        = Number(data?.lead_conversion_rate || 0)
  const totalNewUsers  = Number(metrics?.users?.current ?? (data?.users_daily   || []).reduce((s, d) => s + Number(d.count   || 0), 0))
  const totalRevenue   = Number(metrics?.revenue?.current ?? (data?.revenue_daily  || []).reduce((s, d) => s + Number(d.revenue || 0), 0))

  return (
    <AdminLayout title="Analytics">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-bold text-ink tracking-tight">Analytics</h1>
          <p className="text-[13px] text-ink-3 mt-0.5">
            Platform intelligence & engagement overview ({range === '7d' ? 'last 7 days' : range === '90d' ? 'last 90 days' : range === '12m' ? 'last 12 months' : 'last 30 days'}).
          </p>
        </div>

        {/* Header Actions: Range Switcher + CSV Export */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-1 p-1 bg-surface-2/60 dark:bg-surface-2/30 border border-border/70 rounded-xl w-fit">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleRangeChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                  range === opt.value
                    ? 'bg-surface dark:bg-canvas text-ink shadow-xs font-semibold'
                    : 'text-ink-3 hover:text-ink hover:bg-surface/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => exportAnalyticsToCSV(data, range)}
            disabled={isLoading || !data}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 bg-surface hover:bg-surface-2 text-ink text-[12.5px] font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export full analytics report (CSV)"
          >
            <Download size={14} className="text-ink-2" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Summary KPIs ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <StatCard
            label="Directory Views"
            value={isLoading ? undefined : (metrics?.views?.current ?? totalViews).toLocaleString()}
            trend={metrics?.views?.delta_pct}
            sub={prevLabel}
            icon={<Eye size={16} />}
            iconBg="bg-brand-light dark:bg-brand/10"
            iconColor="text-brand"
            loading={isLoading}
          />
          <StatCard
            label="Customer Inquiries"
            value={isLoading ? undefined : (metrics?.contacts?.current ?? totalContacts).toLocaleString()}
            trend={metrics?.contacts?.delta_pct}
            sub={prevLabel}
            icon={<MousePointerClick size={16} />}
            iconBg="bg-indigo-50 dark:bg-indigo-950/40"
            iconColor="text-indigo-600 dark:text-indigo-400"
            loading={isLoading}
          />
          <StatCard
            label="Lead Conversion (CTR)"
            value={isLoading ? undefined : `${(metrics?.conversion_rate?.current ?? leadCtr).toFixed(1)}%`}
            trend={metrics?.conversion_rate?.delta_pct}
            sub="View to lead rate"
            icon={<Percent size={16} />}
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            iconColor="text-emerald-600 dark:text-emerald-400"
            loading={isLoading}
          />
          <StatCard
            label="New Signups"
            value={isLoading ? undefined : totalNewUsers.toLocaleString()}
            trend={metrics?.users?.delta_pct}
            sub={prevLabel}
            icon={<Users size={16} />}
            iconBg="bg-blue-50 dark:bg-blue-950/40"
            iconColor="text-blue-600 dark:text-blue-400"
            loading={isLoading}
          />
          <StatCard
            label="Platform Revenue"
            value={isLoading ? undefined : `ETB ${totalRevenue.toLocaleString()}`}
            trend={metrics?.revenue?.delta_pct}
            sub={prevLabel}
            icon={<TrendingUp size={16} />}
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            iconColor="text-emerald-600 dark:text-emerald-400"
            loading={isLoading}
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {/* ── Main Interactive Trend Chart with Scrubber ───────────────── */}
        <InteractiveAreaChart
          viewsDaily={data?.views_daily}
          contactsDaily={data?.contacts_daily}
          usersDaily={data?.users_daily}
          adsDaily={data?.ads_daily}
          revenueDaily={data?.revenue_daily}
          range={range}
          loading={isLoading}
        />

        {/* ── Channel & Funnel Intelligence ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ContactChannelBreakdown
            channels={data?.channels_breakdown}
            totalViews={data?.total_views}
            totalContacts={data?.total_contacts}
            leadConversionRate={data?.lead_conversion_rate}
          />

          <ConversionFunnelWidget
            funnel={data?.conversion_funnel}
            paymentMethods={data?.payment_methods}
            loading={isLoading}
          />
        </div>

        {/* ── Regional & Sector Market Share ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Ethiopian Cities Distribution */}
          <ChartCard
            title="Geographic Hubs (Ethiopian Cities)"
            subtitle="Commercial directory density across key urban centers"
            loading={isLoading}
          >
            {data?.city_distribution?.length > 0 ? (
              <div className="space-y-3 pt-1">
                {data.city_distribution.map(city => (
                  <div key={city.city} className="space-y-1">
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="font-semibold text-ink flex items-center gap-1.5">
                        <MapPin size={13} className="text-brand shrink-0" />
                        {city.city}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink tabular-nums">
                          {city.count.toLocaleString()}
                        </span>
                        <span className="text-[11.5px] text-ink-3 tabular-nums w-12 text-right">
                          ({city.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border/40">
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(4, city.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-ink-3 text-center py-6">No city data available.</p>
            )}
          </ChartCard>

          {/* Top Industry Sectors */}
          <ChartCard
            title="Industry Sector Demand"
            subtitle="Top performing market categories by listings and providers"
            loading={isLoading}
          >
            {data?.category_engagement?.length > 0 || data?.ads_by_category?.length > 0 ? (
              <div className="space-y-3 pt-1">
                {(data?.category_engagement || data?.ads_by_category || []).slice(0, 8).map(cat => {
                  const ads = cat.ads_count ?? cat.count ?? 0
                  const profiles = cat.profiles_count ?? 0
                  const totalItems = ads + profiles
                  const allItems = (data?.category_engagement || data?.ads_by_category || []).map(c => (c.ads_count ?? c.count ?? 0) + (c.profiles_count ?? 0))
                  const maxItems = Math.max(...allItems, 1)
                  const pct = Math.round((totalItems / maxItems) * 100)

                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-[12.5px]">
                        <span className="font-semibold text-ink flex items-center gap-1.5 truncate max-w-[200px]">
                          <CategoryIconInline slug={cat.category_slug} name={cat.category} size={13} />
                          <span className="truncate">{cat.category}</span>
                        </span>
                        <div className="flex items-center gap-2 text-[11.5px] text-ink-3">
                          <span className="tabular-nums">{ads} ads</span>
                          {profiles > 0 && <span className="tabular-nums">· {profiles} providers</span>}
                        </div>
                      </div>
                      <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border/40">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[12.5px] text-ink-3 text-center py-6">No category data available.</p>
            )}
          </ChartCard>
        </div>

        {/* ── Top 5 Business Profile Leaderboard ─────────────────────── */}
        <ChartCard
          title="Top Business Performers"
          subtitle={`Most engaged commercial listings in directory (${currentRangeOption.label})`}
          loading={isLoading}
        >
          {data?.top_profiles_leaderboard?.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:-mx-5 -mb-4 sm:-mb-5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-surface-2/40 text-[11px] font-semibold text-ink-3 uppercase tracking-wider">
                    <th className="py-2.5 px-4 sm:px-5">Rank</th>
                    <th className="py-2.5 px-3">Business Profile</th>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-right">Views</th>
                    <th className="py-2.5 px-3 text-right">Inquiries</th>
                    <th className="py-2.5 px-4 sm:px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-[12.5px]">
                  {data.top_profiles_leaderboard.map((profile, idx) => {
                    const rank = idx + 1
                    const badgeClass =
                      rank === 1
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold'
                        : rank === 2
                        ? 'bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/30 font-bold'
                        : rank === 3
                        ? 'bg-amber-700/15 text-amber-700 dark:text-amber-500 border-amber-700/30 font-bold'
                        : 'bg-surface-2 text-ink-3 border-border/50'

                    return (
                      <tr key={profile.id || profile.slug} className="hover:bg-surface-2/30 transition-colors">
                        <td className="py-3 px-4 sm:px-5 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] border ${badgeClass}`}>
                            {rank}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5 min-w-[170px]">
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-brand/10 text-brand font-bold text-xs flex items-center justify-center border border-brand/20 shrink-0">
                                {(profile.display_name || '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="truncate">
                              <div className="flex items-center gap-1 font-semibold text-ink truncate">
                                <span className="truncate">{profile.display_name}</span>
                                {profile.is_verified && (
                                  <BadgeCheck size={14} className="text-brand shrink-0" title="Verified business" />
                                )}
                              </div>
                              <p className="text-[11px] text-ink-3 truncate">@{profile.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {profile.category_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-2 text-[11.5px] text-ink font-medium border border-border/50">
                              <CategoryIconInline slug={profile.category_slug} name={profile.category_name} size={12} />
                              <span className="truncate max-w-[130px]">{profile.category_name}</span>
                            </span>
                          ) : (
                            <span className="text-ink-3 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="text-[12px] text-ink-2 flex items-center gap-1">
                            <MapPin size={12} className="text-ink-3 shrink-0" />
                            {profile.city || 'Ethiopia'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-semibold text-ink tabular-nums">
                          {Number(profile.views).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-semibold text-brand tabular-nums">
                          {Number(profile.contacts).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 sm:px-5 text-center whitespace-nowrap">
                          <Link
                            to={`/p/${profile.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-medium text-ink-2 hover:text-brand hover:bg-brand/10 transition-colors"
                          >
                            <span>View</span>
                            <ExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-ink-3 text-[12.5px]">
              <p>No business profile interaction recorded for this period yet.</p>
            </div>
          )}
        </ChartCard>

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
