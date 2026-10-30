/**
 * OfflineBanner.jsx — Non-intrusive connectivity status pill.
 *
 * Displays when network is dropped or when returning online.
 * Informs the user that cached profiles are being displayed safely.
 */
import { WifiOff, CheckCircle2 } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'

export function OfflineBanner({ className = '' }) {
  const { isOnline, justReconnected } = useOnlineStatus()

  if (isOnline && !justReconnected) return null

  return (
    <div className={`w-full flex justify-center py-1.5 px-4 bg-surface-2/80 backdrop-blur-xs border-t border-border/60 animate-fade-in ${className}`}>
      <div
        role="status"
        aria-live="polite"
        className={`
          inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium
          transition-all duration-300 select-none shadow-xs
          ${!isOnline
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
          }
        `}
      >
        {!isOnline ? (
          <>
            <WifiOff size={13} className="shrink-0 animate-pulse text-amber-500" />
            <span>Offline mode · Showing saved profiles & services</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
            <span>Back online · Synchronizing data…</span>
          </>
        )}
      </div>
    </div>
  )
}
