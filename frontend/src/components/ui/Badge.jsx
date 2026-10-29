const variants = {
  default: 'bg-surface-2 text-ink-2 border border-border',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25',
  danger:  'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/25',
  info:    'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25',
  brand:   'bg-brand-light text-brand border border-brand-border',
  dark:    'bg-surface-2 text-ink border border-border',
}

const sizes = {
  xs: 'text-[11px] px-1.5 py-0.5',
  sm: 'text-xs     px-2   py-0.5',
  md: 'text-sm     px-2.5 py-1',
}

export function Badge({ children, variant = 'default', size = 'sm', dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded leading-tight whitespace-nowrap ${variants[variant] ?? variants.default} ${sizes[size] ?? sizes.sm} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  )
}
