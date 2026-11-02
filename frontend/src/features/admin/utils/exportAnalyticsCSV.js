/**
 * exportAnalyticsCSV.js — RFC 4180 compliant CSV export utility for Admin Analytics Hub.
 */

function escapeCSVField(val) {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

export function exportAnalyticsToCSV(analyticsData, range = '30d') {
  if (!analyticsData) return

  const filename = `gebetapro-analytics-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`
  const sm = analyticsData.summary_metrics || {}

  const lines = []

  // 1. Report Header
  lines.push(['"GebetaPro Platform Analytics & Executive Performance Report"'])
  lines.push([`"Generated At"`, escapeCSVField(new Date().toLocaleString())])
  lines.push([`"Time Horizon"`, escapeCSVField(range.toUpperCase())])
  lines.push([])

  // 2. Executive Summary Metrics
  lines.push(['"EXECUTIVE KPI SUMMARY"'])
  lines.push(['"Metric"', '"Current Period Total"', '"Period-over-Period Delta"'])
  lines.push([
    '"Total Profile Views"',
    escapeCSVField(sm.views?.current ?? analyticsData.total_views ?? 0),
    escapeCSVField(`${sm.views?.delta_pct >= 0 ? '+' : ''}${sm.views?.delta_pct ?? 0}%`),
  ])
  lines.push([
    '"Customer Inquiries / Leads"',
    escapeCSVField(sm.contacts?.current ?? analyticsData.total_contacts ?? 0),
    escapeCSVField(`${sm.contacts?.delta_pct >= 0 ? '+' : ''}${sm.contacts?.delta_pct ?? 0}%`),
  ])
  lines.push([
    '"Lead Conversion Rate (CTR)"',
    escapeCSVField(`${sm.ctr?.current ?? analyticsData.lead_conversion_rate ?? 0}%`),
    escapeCSVField(`${sm.ctr?.delta_pct >= 0 ? '+' : ''}${sm.ctr?.delta_pct ?? 0}%`),
  ])
  lines.push([
    '"New User Registrations"',
    escapeCSVField(sm.users?.current ?? 0),
    escapeCSVField(`${sm.users?.delta_pct >= 0 ? '+' : ''}${sm.users?.delta_pct ?? 0}%`),
  ])
  lines.push([
    '"New Ad Listings"',
    escapeCSVField(sm.ads?.current ?? 0),
    escapeCSVField(`${sm.ads?.delta_pct >= 0 ? '+' : ''}${sm.ads?.delta_pct ?? 0}%`),
  ])
  lines.push([
    '"Total Revenue (ETB)"',
    escapeCSVField(sm.revenue?.current ?? 0),
    escapeCSVField(`${sm.revenue?.delta_pct >= 0 ? '+' : ''}${sm.revenue?.delta_pct ?? 0}%`),
  ])
  lines.push([])

  // 3. Daily Time Series
  lines.push(['"DAILY ACTIVITY TIME SERIES"'])
  lines.push([
    '"Date"',
    '"Profile Views"',
    '"Customer Inquiries"',
    '"New Users"',
    '"New Ads"',
    '"Revenue (ETB)"',
  ])

  // Map dates from views_daily or any available daily series
  const dateMap = new Map()
  const mergeDaily = (series, key) => {
    if (!Array.isArray(series)) return
    series.forEach(item => {
      const rawDate = item.date ? (typeof item.date === 'string' ? item.date.slice(0, 10) : new Date(item.date).toISOString().slice(0, 10)) : ''
      if (!rawDate) return
      if (!dateMap.has(rawDate)) {
        dateMap.set(rawDate, { date: rawDate, views: 0, contacts: 0, users: 0, ads: 0, revenue: 0 })
      }
      dateMap.get(rawDate)[key] = Number(item.count ?? item.revenue ?? 0)
    })
  }

  mergeDaily(analyticsData.views_daily, 'views')
  mergeDaily(analyticsData.contacts_daily, 'contacts')
  mergeDaily(analyticsData.users_daily, 'users')
  mergeDaily(analyticsData.ads_daily, 'ads')
  mergeDaily(analyticsData.revenue_daily, 'revenue')

  const sortedDates = Array.from(dateMap.keys()).sort()
  sortedDates.forEach(d => {
    const entry = dateMap.get(d)
    lines.push([
      escapeCSVField(entry.date),
      escapeCSVField(entry.views),
      escapeCSVField(entry.contacts),
      escapeCSVField(entry.users),
      escapeCSVField(entry.ads),
      escapeCSVField(entry.revenue),
    ])
  })
  lines.push([])

  // 4. Contact Channels Breakdown
  if (Array.isArray(analyticsData.channels_breakdown) && analyticsData.channels_breakdown.length > 0) {
    lines.push(['"CUSTOMER INQUIRY CHANNELS BREAKDOWN"'])
    lines.push(['"Channel / Touchpoint"', '"Total Clicks"', '"Share (%)"'])
    analyticsData.channels_breakdown.forEach(ch => {
      lines.push([
        escapeCSVField(ch.event_type),
        escapeCSVField(ch.count),
        escapeCSVField(`${ch.percentage}%`),
      ])
    })
    lines.push([])
  }

  // 5. Regional Hubs (Cities)
  if (Array.isArray(analyticsData.city_distribution) && analyticsData.city_distribution.length > 0) {
    lines.push(['"REGIONAL MARKET SHARE (ETHIOPIAN CITIES)"'])
    lines.push(['"City"', '"Published Businesses"', '"Market Share (%)"'])
    analyticsData.city_distribution.forEach(c => {
      lines.push([
        escapeCSVField(c.city),
        escapeCSVField(c.count),
        escapeCSVField(`${c.percentage}%`),
      ])
    })
    lines.push([])
  }

  // 6. Top Business Performers
  if (Array.isArray(analyticsData.top_profiles_leaderboard) && analyticsData.top_profiles_leaderboard.length > 0) {
    lines.push(['"TOP PERFORMING BUSINESS PROFILES"'])
    lines.push([
      '"Rank"',
      '"Business Name"',
      '"Username / Slug"',
      '"Sector"',
      '"City"',
      '"Verified"',
      '"Views"',
      '"Inquiries"',
    ])
    analyticsData.top_profiles_leaderboard.forEach((p, idx) => {
      lines.push([
        escapeCSVField(idx + 1),
        escapeCSVField(p.display_name),
        escapeCSVField(`@${p.slug}`),
        escapeCSVField(p.category_name || ''),
        escapeCSVField(p.city || ''),
        escapeCSVField(p.is_verified ? 'Yes' : 'No'),
        escapeCSVField(p.views),
        escapeCSVField(p.contacts),
      ])
    })
  }

  // UTF-8 BOM (\uFEFF) ensures Excel handles UTF-8 characters correctly
  const csvContent = '\uFEFF' + lines.map(row => row.join(',')).join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
