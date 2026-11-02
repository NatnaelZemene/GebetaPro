/**
 * ConversionFunnelWidget.jsx — 4-stage advertiser conversion funnel and payment gateway share.
 */
import { Users, Store, ShieldCheck, Crown, ChevronRight, Wallet, ArrowDown } from 'lucide-react'

const STAGE_ICONS = {
  'Registered Users': Users,
  'Published Profiles': Store,
  'Verified Businesses': ShieldCheck,
  'Paid Subscribers': Crown,
}

const STAGE_COLORS = [
  'bg-slate-500 text-slate-500',
  'bg-blue-500 text-blue-500',
  'bg-teal-500 text-teal-500',
  'bg-brand text-brand',
]

export function ConversionFunnelWidget({
  funnel = [],
  paymentMethods = [],
  loading = false,
}) {
  const topCount = funnel[0]?.count || 1

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-[15px] font-bold text-ink tracking-tight flex items-center gap-2">
              <Store size={17} className="text-brand" />
              Advertiser Lifecycle Funnel
            </h3>
            <p className="text-[12px] text-ink-3 mt-0.5">
              Progression from account creation to paid subscription.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-brand/10 text-brand text-[11.5px] font-bold shrink-0">
            Platform Health
          </span>
        </div>

        {/* 4-Stage Funnel Bars */}
        <div className="space-y-3 mb-6">
          {funnel.map((step, idx) => {
            const Icon = STAGE_ICONS[step.stage] || Users
            const barWidth = Math.max(12, Math.round((Number(step.count) / Math.max(topCount, 1)) * 100))
            const prevCount = idx > 0 ? funnel[idx - 1].count : null
            const stepConversion = prevCount > 0 ? ((Number(step.count) / prevCount) * 100).toFixed(1) : null

            return (
              <div key={step.stage} className="relative">
                <div className="flex items-center justify-between text-[12.5px] font-medium mb-1.5">
                  <span className="flex items-center gap-2 text-ink">
                    <Icon size={14} className={idx === 3 ? 'text-brand' : 'text-ink-3'} />
                    <span className={idx === 3 ? 'font-bold text-brand' : 'font-semibold'}>{step.stage}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {stepConversion !== null && (
                      <span className="text-[11px] font-medium text-ink-4 bg-surface-2 px-1.5 py-0.5 rounded">
                        {stepConversion}% step-thru
                      </span>
                    )}
                    <span className="font-bold text-ink tabular-nums">
                      {Number(step.count).toLocaleString()}
                    </span>
                    <span className="text-[11.5px] text-ink-3 tabular-nums w-12 text-right">
                      ({step.rate}%)
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden border border-border/40">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 3
                        ? 'bg-gradient-to-r from-teal-500 to-brand'
                        : idx === 2
                        ? 'bg-teal-500'
                        : idx === 1
                        ? 'bg-blue-500'
                        : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Gateways breakdown */}
      <div className="pt-4 border-t border-border/60">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] font-bold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
            <Wallet size={13} className="text-ink-4" />
            Payment Gateway Share
          </span>
          <span className="text-[11.5px] text-ink-4">Successful transactions</span>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {paymentMethods.map(m => (
              <div
                key={m.method}
                className="p-2.5 bg-surface-2/60 dark:bg-surface-2/30 border border-border/70 rounded-xl"
              >
                <p className="text-[11.5px] font-bold text-ink uppercase tracking-wide truncate">
                  {m.method}
                </p>
                <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                  ETB {Number(m.revenue || 0).toLocaleString()}
                </p>
                <p className="text-[10.5px] text-ink-4 mt-0.5">
                  {Number(m.count).toLocaleString()} payments
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-ink-4 italic">No gateway transactions recorded in this period.</p>
        )}
      </div>
    </div>
  )
}
