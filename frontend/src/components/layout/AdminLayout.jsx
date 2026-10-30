/**
 * AdminLayout.jsx — Premium SaaS admin shell.
 *
 * Desktop: collapsible sidebar (expanded 248px / collapsed 68px).
 *          Collapsed state shows icons only with tooltip labels.
 * Mobile:  top bar + slide-out drawer from left.
 *
 * Accessibility improvements:
 * - Mobile drawer uses useFocusTrap: Tab/Shift+Tab stays inside, Escape closes.
 * - Focus returns to hamburger button when drawer closes.
 * - Hamburger has aria-expanded + aria-controls wired to drawer.
 * - Tooltip (Tip) renders a visually-hidden span for screen readers when
 *   collapsed rather than relying on CSS hover tooltips alone.
 * - Collapse toggle button has a clear aria-label that updates with state.
 * - <main id="main-content"> retained for skip-nav link.
 * - Breadcrumb uses <nav aria-label="Breadcrumb"> semantics.
 */
import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard,
  Tag, BarChart2, TrendingUp, LogOut, Menu, X,
  ChevronLeft, ChevronRight, ArrowLeft, Layers, ShieldCheck,
} from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { ThemeToggle } from '../ui/ThemeToggle.jsx'
import { LogoutConfirmation } from '../ui/LogoutConfirmation.jsx'

/* ── Nav definition ──────────────────────────────────────────────────────── */
const NAV = [
  { group: 'Workspace', to: '/admin',               label: 'Overview',           icon: LayoutDashboard, end: true },
  { group: 'Directory', to: '/admin/users',         label: 'Users',              icon: Users },
  { group: 'Directory', to: '/admin/verifications', label: 'Verifications',      icon: ShieldCheck },
  { group: 'Directory', to: '/admin/categories',    label: 'Categories',         icon: Tag },
  { group: 'Billing',   to: '/admin/subscriptions', label: 'Subscriptions',      icon: CreditCard },
  { group: 'Billing',   to: '/admin/plans',         label: 'Plans',              icon: Layers },
  { group: 'Billing',   to: '/admin/revenue',       label: 'Revenue',            icon: TrendingUp },
  { group: 'Insights',  to: '/admin/analytics',     label: 'Analytics',          icon: BarChart2 },
]
const NAV_GROUPS = ['Workspace', 'Directory', 'Billing', 'Insights']

/* ── Breadcrumb helper ───────────────────────────────────────────────────── */
function useBreadcrumbs() {
  const { pathname } = useLocation()
  const found = NAV.find(n =>
    n.end ? pathname === n.to : pathname.startsWith(n.to)
  )
  return found?.label ?? 'Admin'
}

/* ── Tooltip wrapper (for collapsed sidebar) ─────────────────────────────── */
function Tip({ label, children, collapsed }) {
  if (!collapsed) return children
  return (
    <div className="relative group/tip">
      {children}
      {/* CSS tooltip for mouse users */}
      <div
        className="
          pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
          bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-white/10 text-[11.5px] font-medium
          px-2.5 py-1 rounded-lg whitespace-nowrap
          opacity-0 group-hover/tip:opacity-100
          transition-opacity duration-150
          shadow-lg
        "
        aria-hidden="true"
      >
        {label}
        <span
          className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-ink"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

/* ── Sidebar content (shared desktop + mobile) ───────────────────────────── */
function SidebarContent({ collapsed, onClose, onRequestLogout }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Brand */}
      <div
        className={`
          flex items-center h-[72px] shrink-0
          border-b border-border
          ${collapsed ? 'justify-center px-0' : 'px-5'}
          transition-all duration-200
        `}
      >
        {collapsed ? (
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0 shadow-sm" aria-hidden="true">
            <span className="text-white text-[15px] font-black leading-none">G</span>
          </div>
        ) : (
          <div>
            <Link
              to="/"
              className="text-[17px] font-bold text-ink tracking-[-0.035em] hover:no-underline block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:rounded"
              aria-label="GebetaPro — back to site"
            >
              Gebeta<span className="text-brand">Pro</span>
            </Link>
            <p className="text-[10px] font-medium text-ink-3 mt-0.5">
              Administration
            </p>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-1.5' : 'px-3'}`} aria-label="Admin navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group} className="mb-5 last:mb-0">
            {!collapsed && <p className="px-3 mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.15em] text-ink-4">{group}</p>}
            <div className="flex flex-col gap-1">
              {NAV.filter((item) => item.group === group).map(({ to, label, icon: Icon, end }) => (
                <Tip key={to} label={label} collapsed={collapsed}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) => `relative flex items-center gap-3 ${collapsed ? 'h-10 w-10 justify-center mx-auto rounded-xl' : 'h-10 px-3 rounded-xl'} text-[12.5px] font-medium transition-all duration-150 hover:no-underline group select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white focus-visible:ring-inset ${isActive ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-950 dark:hover:text-white'}`}
                    aria-label={collapsed ? label : undefined}
                  >
                    {({ isActive }) => <><Icon size={16} aria-hidden="true" className={`shrink-0 transition-colors ${isActive ? 'text-white dark:text-neutral-950' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white'}`} />{!collapsed && <span className="truncate">{label}</span>}</>}
                  </NavLink>
                </Tip>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={`shrink-0 border-t border-border py-3 ${collapsed ? 'px-1.5' : 'px-2.5'} flex flex-col gap-0.5`}
      >
        <Tip label="Back to platform" collapsed={collapsed}>
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className={`
              flex items-center gap-3
              ${collapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-3'}
              rounded-lg text-[13px] font-medium text-ink-2
              hover:bg-surface-2 hover:text-ink transition-all duration-150
              hover:no-underline
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset
            `}
            aria-label={collapsed ? 'Back to platform' : undefined}
          >
            <ArrowLeft size={15} className="shrink-0 text-ink-3" aria-hidden="true" />
            {!collapsed && <span>Back to platform</span>}
          </NavLink>
        </Tip>

        <Tip label="Log out" collapsed={collapsed}>
          <button
            onClick={onRequestLogout}
            className={`
              flex items-center gap-3 w-full text-left
              ${collapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-3'}
              rounded-lg text-[13px] font-medium text-ink-2
              hover:bg-danger-bg hover:text-danger transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-inset
            `}
            aria-label="Log out of admin console"
          >
            <LogOut size={15} className="shrink-0" aria-hidden="true" />
            {!collapsed && <span>Log out</span>}
          </button>
        </Tip>
      </div>
    </div>
  )
}

/* ── AdminLayout ─────────────────────────────────────────────────────────── */
export function AdminLayout({ children, title }) {
  const [collapsed,   setCollapsed]   = useState(false)
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const currentPage = useBreadcrumbs()

  // Ref to hamburger so focus returns when drawer closes
  const hamburgerRef = useRef(null)

  // Focus trap for mobile drawer — Escape closes it
  const drawerRef = useFocusTrap(drawerOpen, () => {
    setDrawerOpen(false)
    setTimeout(() => hamburgerRef.current?.focus(), 50)
  })

  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/')
    window.location.reload()
  }

  return (
    <div className="admin-console min-h-screen bg-canvas flex">

      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside
        className={`
          hidden lg:flex flex-col shrink-0
          bg-surface border-r border-border
          sticky top-0 h-screen
          transition-[width] duration-200 ease-out
          ${collapsed ? 'w-[68px]' : 'w-[248px]'}
          overflow-hidden
        `}
        aria-label="Admin sidebar"
      >
        <SidebarContent collapsed={collapsed} onClose={() => {}} onRequestLogout={() => setLogoutConfirmOpen(true)} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="
            absolute bottom-[68px] -right-3 z-10
            w-6 h-6 flex items-center justify-center
            bg-surface border border-border rounded-full
            text-ink-3 hover:text-brand hover:border-brand-border
            transition-all duration-150
            shadow-sm
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
          "
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed
            ? <ChevronRight size={11} aria-hidden="true" />
            : <ChevronLeft  size={11} aria-hidden="true" />
          }
        </button>
      </aside>

      {/* ── Mobile drawer backdrop ────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden animate-fade-in"
          onClick={() => { setDrawerOpen(false); setTimeout(() => hamburgerRef.current?.focus(), 50) }}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <div
        id="admin-mobile-drawer"
        ref={drawerRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px]
          bg-surface border-r border-border
          flex flex-col lg:hidden
          transition-transform duration-200 ease-out
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Admin navigation"
        role="dialog"
        aria-modal="true"
        /* Hide from AT when closed so it isn't tab-navigable while off-screen */
        aria-hidden={!drawerOpen}
        inert={!drawerOpen ? '' : undefined}
      >
        {/* Drawer close button */}
        <button
          onClick={() => { setDrawerOpen(false); setTimeout(() => hamburgerRef.current?.focus(), 50) }}
          className="absolute top-4 right-3 z-10 text-ink-3 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:rounded"
          aria-label="Close navigation"
          tabIndex={drawerOpen ? 0 : -1}
        >
          <X size={16} aria-hidden="true" />
        </button>
        <SidebarContent collapsed={false} onClose={() => { setDrawerOpen(false); setTimeout(() => hamburgerRef.current?.focus(), 50) }} onRequestLogout={() => setLogoutConfirmOpen(true)} />
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header
          className="
            sticky top-0 z-30
            bg-surface/95 backdrop-blur-sm
            border-b border-border
            h-[60px] px-5 sm:px-7
            flex items-center gap-4
          "
        >
          {/* Mobile hamburger */}
          <button
            ref={hamburgerRef}
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden h-9 w-9 rounded-lg flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:rounded"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            aria-controls="admin-mobile-drawer"
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 flex-1 min-w-0">
            <Link
              to="/admin"
              className="text-[12px] text-ink-3 hover:text-ink hover:no-underline transition-colors hidden sm:block shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:rounded"
            >
              Administration
            </Link>
            <span className="text-[12.5px] text-ink-4 hidden sm:block" aria-hidden="true">/</span>
            <h1 className="text-[13px] font-semibold text-ink truncate" aria-current="page">
              {title || currentPage}
            </h1>
          </nav>

          {/* Right side — Theme toggle & Admin badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />
            <span
              className="
                hidden sm:inline-flex items-center gap-2
                text-[11px] font-semibold text-ink-2
                bg-canvas border border-border
                px-3 py-1.5 rounded-full
              "
              aria-label="Admin role"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />Admin workspace
            </span>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-7 sm:py-8 xl:px-10 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
      <LogoutConfirmation
        isOpen={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  )
}
