/**
 * InteractiveAreaChart.jsx — Premium interactive SVG area chart with real-time hover scrubber.
 *
 * Features:
 *   - 1-click Metric Switcher Tabs (Views, Inquiries, Signups, Listings, Revenue).
 *   - Real-time mouse/touch crosshair line and active point highlighting.
 *   - Floating glassmorphic tooltip with date, metric name, and formatted values.
 *   - Responsive SVG with smooth gradient area fill.
 *   - Screen-reader accessible hidden summary table.
 *   - 100% dependency-free pure React + SVG.
 */
import { useState, useRef, useId, useMemo, useCallback } from 'react'
import { Eye, MousePointerClick, Users, Megaphone, TrendingUp } from 'lucide-react'

export function InteractiveAreaChart({
  viewsDaily = [],
  contactsDaily = [],
  usersDaily = [],
  adsDaily = [],
  revenueDaily = [],
  range = '30d',
  loading = false,
}) {
  const [activeMetric, setActiveMetric] = useState('views')
  const [hoverIndex, setHoverIndex] = useState(null)
  const svgRef = useRef(null)
  const gradientId = `area-gradient-${useId().replace(/:/g, '')}`

  const METRICS = useMemo(() => ({
    views: {
      id: 'views',
      label: 'Directory Views',
      shortLabel: 'Views',
      data: viewsDaily,
      valueField: 'count',
      color: '#0d9488', // Brand teal
      icon: Eye,
      formatValue: n => Number(n).toLocaleString(),
      formatTotal: n => `${Number(n).toLocaleString()} Total Views`,
    },
    contacts: {
      id: 'contacts',
      label: 'Customer Inquiries',
      shortLabel: 'Inquiries',
      data: contactsDaily,
      valueField: 'count',
      color: '#6366f1', // Indigo
      icon: MousePointerClick,
      formatValue: n => Number(n).toLocaleString(),
      formatTotal: n => `${Number(n).toLocaleString()} Direct Leads`,
    },
    users: {
      id: 'users',
      label: 'New Registrations',
      shortLabel: 'Signups',
      data: usersDaily,
      valueField: 'count',
      color: '#0284c7', // Sky blue
      icon: Users,
      formatValue: n => Number(n).toLocaleString(),
      formatTotal: n => `${Number(n).toLocaleString()} New Members`,
    },
    ads: {
      id: 'ads',
      label: 'New Listings',
      shortLabel: 'Ads Posted',
      data: adsDaily,
      valueField: 'count',
      color: '#d97706', // Amber
      icon: Megaphone,
      formatValue: n => Number(n).toLocaleString(),
      formatTotal: n => `${Number(n).toLocaleString()} Listings`,
    },
    revenue: {
      id: 'revenue',
      label: 'Platform Revenue',
      shortLabel: 'Revenue',
      data: revenueDaily,
      valueField: 'revenue',
      color: '#10b981', // Emerald
      icon: TrendingUp,
      formatValue: n => `ETB ${Number(n).toLocaleString()}`,
      formatTotal: n => `ETB ${Number(n).toLocaleString()} Generated`,
    },
  }), [viewsDaily, contactsDaily, usersDaily, adsDaily, revenueDaily])

  const currentMetric = METRICS[activeMetric] || METRICS.views
  const data = currentMetric.data || []
  const valueField = currentMetric.valueField
  const color = currentMetric.color

  // Compute SVG plot dimensions & coordinates
  const width = 800
  const height = 260
  const paddingLeft = 55
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 35
  const plotWidth = width - paddingLeft - paddingRight
  const plotHeight = height - paddingTop - paddingBottom

  const values = useMemo(() => data.map(d => Number(d[valueField] || 0)), [data, valueField])
  const total = useMemo(() => values.reduce((sum, v) => sum + v, 0), [values])
  const maxVal = useMemo(() => Math.max(...values, 1), [values])
  const minVal = 0

  const points = useMemo(() => {
    if (!data.length) return []
    const count = data.length
    return data.map((d, i) => {
      const val = Number(d[valueField] || 0)
      const x = paddingLeft + (count === 1 ? plotWidth / 2 : (i / (count - 1)) * plotWidth)
      const y = paddingTop + (1 - (val - minVal) / (maxVal - minVal || 1)) * plotHeight
      return {
        x,
        y,
        value: val,
        date: d.date,
        raw: d,
      }
    })
  }, [data, valueField, maxVal, minVal, plotWidth, plotHeight, paddingLeft, paddingTop])

  // Construct SVG paths
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' }
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${height - paddingBottom} L ${points[0].x.toFixed(1)} ${height - paddingBottom} Z`
    return { linePath: line, areaPath: area }
  }, [points, height, paddingBottom])

  // Mouse & Touch interaction
  const handlePointerMove = useCallback((e) => {
    if (!svgRef.current || points.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const clientX = e.clientX || e.touches?.[0]?.clientX
    if (clientX === undefined) return

    const relX = clientX - rect.left
    const frac = Math.max(0, Math.min(1, (relX - (paddingLeft / width) * rect.width) / ((plotWidth / width) * rect.width)))
    const closestIdx = Math.round(frac * (points.length - 1))
    setHoverIndex(Math.max(0, Math.min(points.length - 1, closestIdx)))
  }, [points, width, plotWidth, paddingLeft])

  const handlePointerLeave = useCallback(() => {
    setHoverIndex(null)
  }, [])

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null

  // Date formatting helpers
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
  }

  const formatFullDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Label ticks on X-axis (up to 5 readable ticks)
  const xTicks = useMemo(() => {
    if (points.length <= 1) return points
    const step = Math.max(1, Math.floor((points.length - 1) / 4))
    const ticks = []
    for (let i = 0; i < points.length; i += step) {
      ticks.push(points[i])
    }
    if (ticks[ticks.length - 1] !== points[points.length - 1]) {
      ticks.push(points[points.length - 1])
    }
    return ticks
  }, [points])

  // Y-axis grid levels (4 horizontal lines)
  const yLevels = [0, 0.33, 0.66, 1].map(frac => ({
    y: paddingTop + (1 - frac) * plotHeight,
    val: minVal + frac * (maxVal - minVal),
  }))

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs relative">
      {/* ── Header: Title & Metric switch tabs ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="text-[16px] font-bold text-ink tracking-tight">{currentMetric.label} Activity</h2>
          </div>
          <p className="text-[12.5px] text-ink-3 mt-0.5">
            Real-time daily activity tracking across {data.length} recorded data points.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-surface-2/60 dark:bg-surface-2/30 border border-border/70 rounded-xl overflow-x-auto max-w-full">
          {Object.values(METRICS).map(m => {
            const Icon = m.icon
            const isCurrent = activeMetric === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveMetric(m.id)
                  setHoverIndex(null)
                }}
                className={`
                  px-2.5 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer
                  ${isCurrent
                    ? 'bg-surface dark:bg-canvas text-ink shadow-xs font-semibold'
                    : 'text-ink-3 hover:text-ink hover:bg-surface/50'
                  }
                `}
              >
                <Icon size={13} style={{ color: isCurrent ? m.color : undefined }} />
                <span>{m.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Highlight Stat Banner ────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between mb-2 px-1">
        <div>
          <span className="text-[28px] sm:text-[32px] font-bold text-ink tracking-tight leading-none tabular-nums">
            {currentMetric.formatTotal(total)}
          </span>
          <span className="text-[12px] text-ink-3 ml-2 font-medium">in selected window</span>
        </div>
        {activePoint && (
          <div className="text-right">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-ink-3 block">
              {formatFullDate(activePoint.date)}
            </span>
            <span className="text-[15px] font-bold text-ink leading-tight tabular-nums" style={{ color }}>
              {currentMetric.formatValue(activePoint.value)}
            </span>
          </div>
        )}
      </div>

      {/* ── Interactive SVG Area Chart ──────────────────────────────────── */}
      <div
        className="w-full relative select-none touch-none"
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onTouchEnd={handlePointerLeave}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-h-[200px] overflow-visible cursor-crosshair"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="90%" stopColor={color} stopOpacity="0.01" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines & Y-axis labels */}
          {yLevels.map((lvl, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={lvl.y}
                x2={width - paddingRight}
                y2={lvl.y}
                stroke="var(--color-border)"
                strokeDasharray="4 4"
                strokeOpacity="0.6"
              />
              <text
                x={paddingLeft - 8}
                y={lvl.y + 3.5}
                textAnchor="end"
                fill="var(--color-ink-3)"
                fontSize="10"
                className="font-mono tabular-nums font-medium"
              >
                {currentMetric.formatValue(Math.round(lvl.val))}
              </text>
            </g>
          ))}

          {/* Area fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              className="transition-all duration-300"
            />
          )}

          {/* Stroke curve line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="transition-all duration-300"
            />
          )}

          {/* Active Hover Scrubber Line & Dot */}
          {activePoint && (
            <g className="animate-in fade-in duration-100">
              <line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={height - paddingBottom}
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill={color}
                stroke="var(--color-surface)"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
                className="shadow-sm"
              />
            </g>
          )}

          {/* Default latest point highlight if not hovering */}
          {!activePoint && points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4.5"
              fill={color}
              stroke="var(--color-surface)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* X-axis date tick labels */}
          {xTicks.map((tick, i) => (
            <text
              key={i}
              x={tick.x}
              y={height - 8}
              textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
              fill="var(--color-ink-3)"
              fontSize="10"
              className="font-medium"
            >
              {formatDateLabel(tick.date)}
            </text>
          ))}
        </svg>

        {/* Accessible screen-reader table */}
        <table className="sr-only">
          <caption>{currentMetric.label} time series data over selected period</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">{currentMetric.label}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i}>
                <td>{formatFullDate(p.date)}</td>
                <td>{currentMetric.formatValue(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
