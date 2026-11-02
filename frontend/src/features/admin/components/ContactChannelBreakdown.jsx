/**
 * ContactChannelBreakdown.jsx — Breakdown of direct customer inquiry channels across Ethiopia.
 */
import { PhoneCall, Send, MessageSquare, Globe, Mail, MousePointer, Target } from 'lucide-react'

const CHANNEL_CONFIG = {
  PHONE_CLICK: {
    label: 'Direct Phone Calls',
    shortLabel: 'Phone',
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-900/60',
    icon: PhoneCall,
  },
  TELEGRAM_CLICK: {
    label: 'Telegram Inquiries',
    shortLabel: 'Telegram',
    color: 'bg-sky-500',
    textColor: 'text-sky-600 dark:text-sky-400',
    bgLight: 'bg-sky-50 dark:bg-sky-950/40',
    borderColor: 'border-sky-200 dark:border-sky-900/60',
    icon: Send,
  },
  WHATSAPP_CLICK: {
    label: 'WhatsApp Messages',
    shortLabel: 'WhatsApp',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-900/60',
    icon: MessageSquare,
  },
  WEBSITE_CLICK: {
    label: 'Website / Portfolio Clicks',
    shortLabel: 'Website',
    color: 'bg-purple-500',
    textColor: 'text-purple-600 dark:text-purple-400',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-900/60',
    icon: Globe,
  },
  EMAIL_CLICK: {
    label: 'Email Inquiries',
    shortLabel: 'Email',
    color: 'bg-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-900/60',
    icon: Mail,
  },
  CONTACT_CLICK: {
    label: 'General Contact Actions',
    shortLabel: 'General',
    color: 'bg-neutral-500',
    textColor: 'text-neutral-600 dark:text-neutral-400',
    bgLight: 'bg-neutral-50 dark:bg-neutral-900/40',
    borderColor: 'border-neutral-200 dark:border-neutral-800',
    icon: MousePointer,
  },
}

export function ContactChannelBreakdown({
  channels = [],
  totalViews = 0,
  totalContacts = 0,
  leadConversionRate = 0,
}) {
  const hasData = channels.length > 0 && totalContacts > 0

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-ink tracking-tight flex items-center gap-2">
              <Target size={17} className="text-brand" />
              Customer Inquiry Channels
            </h3>
            <p className="text-[12px] text-ink-3 mt-0.5">
              How visitors in Ethiopia contact business providers.
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-4 block">
              Lead CTR
            </span>
            <span className="text-[16px] font-bold text-brand leading-none tabular-nums">
              {Number(leadConversionRate).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Multi-segment Channel Progress Bar */}
        {hasData ? (
          <div className="mt-2 mb-5">
            <div className="h-3 w-full bg-surface-2 rounded-full overflow-hidden flex border border-border/50 shadow-2xs">
              {channels.map(c => {
                const cfg = CHANNEL_CONFIG[c.event_type] || CHANNEL_CONFIG.CONTACT_CLICK
                if (c.percentage <= 0) return null
                return (
                  <div
                    key={c.event_type}
                    style={{ width: `${c.percentage}%` }}
                    className={`${cfg.color} transition-all duration-300 hover:opacity-90`}
                    title={`${cfg.label}: ${c.count} (${c.percentage}%)`}
                  />
                )
              })}
            </div>
          </div>
        ) : (
          <div className="my-6 text-center py-4 px-3 bg-surface-2/40 border border-border/60 rounded-xl">
            <p className="text-[12.5px] font-medium text-ink-3">No direct inquiry clicks recorded yet in this range.</p>
            <p className="text-[11.5px] text-ink-4 mt-0.5">Clicks on phone, Telegram, and WhatsApp will appear here.</p>
          </div>
        )}

        {/* Channel Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Object.entries(CHANNEL_CONFIG).map(([type, cfg]) => {
            const found = channels.find(c => c.event_type === type)
            const count = found ? Number(found.count) : 0
            const percentage = found ? Number(found.percentage) : 0
            const Icon = cfg.icon

            return (
              <div
                key={type}
                className={`p-3 rounded-xl border ${cfg.borderColor} ${cfg.bgLight} flex items-center justify-between gap-3 transition-all`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-surface dark:bg-canvas flex items-center justify-center shrink-0 shadow-2xs border border-border/40">
                    <Icon size={14} className={cfg.textColor} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-ink leading-tight truncate">
                      {cfg.shortLabel}
                    </p>
                    <p className="text-[11px] text-ink-4">
                      {percentage}% share
                    </p>
                  </div>
                </div>
                <span className="text-[14px] font-bold text-ink tabular-nums shrink-0">
                  {count.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer conversion efficiency */}
      <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between text-[11.5px] text-ink-3">
        <span>Total Leads Generated: <strong className="text-ink font-semibold">{totalContacts.toLocaleString()}</strong></span>
        <span>From <strong className="text-ink font-semibold">{totalViews.toLocaleString()}</strong> views</span>
      </div>
    </div>
  )
}
