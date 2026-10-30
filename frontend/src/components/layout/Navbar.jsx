/**
 * Navbar.jsx — Minimal, confident navigation.
 * Sticky, auth-aware, mobile-first.
 * i18n: English / አማርኛ via react-i18next
 *
 * Accessibility:
 * - Skip-to-main-content link is always the first focusable element
 * - aria-current="page" on active desktop nav links
 * - Mobile drawer: full-screen overlay with focus trap (useFocusTrap)
 * - Hamburger wired to drawer via aria-controls / aria-expanded
 * - All interactive elements have focus-visible rings
 * - Body scroll locked while mobile drawer is open
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, Menu, X, LayoutDashboard, LogOut, Settings, User,
  Compass, MapPin, CreditCard, ChevronRight, ArrowRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from '../ui/LanguageSelector.jsx'
import { ThemeToggle } from '../ui/ThemeToggle.jsx'
import { LogoutConfirmation } from '../ui/LogoutConfirmation.jsx'
import { UserProfileMenu } from './UserProfileMenu.jsx'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { useMyProfile } from '../../features/profiles/hooks/useProfile.js'

export function Navbar() {
  const { t }        = useTranslation()
  const { data: profile } = useMyProfile()
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen]       = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isLoggedIn = !!localStorage.getItem('accessToken')

  const hamburgerRef = useRef(null)
  const drawerRef    = useFocusTrap(open, () => setOpen(false))

  const NAV_LINKS = [
    {
      to: '/directory',
      label: t('nav.discover', 'Discover'),
      sub: t('nav.discoverSub', 'Find verified businesses & services'),
      icon: Compass,
    },
    {
      to: '/directory/map',
      label: t('nav.map', 'Map View'),
      sub: t('nav.mapSub', 'Explore locations & routes nearby'),
      icon: MapPin,
    },
    {
      to: '/pricing',
      label: t('nav.pricing', 'Pricing & Plans'),
      sub: t('nav.pricingSub', 'Subscription plans for providers'),
      icon: CreditCard,
    },
  ]

  /* ── Scroll detection ─────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  /* ── Close drawer on navigation ─────────────────────────────────────── */
  useEffect(() => {
    if (open) {
      setOpen(false)
      setTimeout(() => hamburgerRef.current?.focus(), 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  /* ── Prevent body scroll while drawer is open ──────────────────────── */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/')
    window.location.reload()
  }

  function closeDrawer() {
    setOpen(false)
    setTimeout(() => hamburgerRef.current?.focus(), 50)
  }

  /* ── Route matching helper — prevents /directory from activating on /directory/map ── */
  function isNavActive(to, path) {
    if (path === to) return true
    if (to === '/directory') {
      return path === '/directory' || path.startsWith('/directory?')
    }
    if (to === '/') {
      return path === '/'
    }
    return path.startsWith(to + '/') || path.startsWith(to + '?')
  }

  /* ── Shared link style helper ────────────────────────────────────────── */
  function desktopNavClass(active) {
    return [
      'relative text-[13.5px] px-3.5 py-1.5 rounded-lg select-none',
      'transition-all duration-150 hover:no-underline',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-1',
      active
        ? '!text-ink dark:!text-white font-semibold bg-surface-2 dark:bg-surface-2 shadow-xs'
        : '!text-ink-2 hover:!text-ink hover:bg-surface-2/60 font-medium',
    ].join(' ')
  }



  return (
    <>
      {/* ── Skip navigation — first focusable element on every page ──── */}
      <a href="#main-content" className="skip-nav">
        {t('nav.skipToMain', 'Skip to main content')}
      </a>

      {/* ── Main header ─────────────────────────────────────────────────── */}
      <header
        className={[
          'sticky top-0 z-50 transition-all duration-200',
          scrolled
            ? 'bg-surface/95 backdrop-blur-sm border-b border-border shadow-[0_1px_0_0_rgba(0,0,0,0.06)]'
            : 'bg-surface border-b border-border',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-[60px] flex items-center justify-between gap-3">

          {/* Wordmark */}
          <Link
            to={isLoggedIn ? '/directory' : '/'}
            className="shrink-0 hover:no-underline group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-sm"
            aria-label={t('nav.logoLabel')}
          >
            <span className="text-[17px] font-bold tracking-[-0.03em] text-ink leading-none">
              Gebeta
              <span className="text-brand transition-colors duration-150 group-hover:text-brand-hover">
                Pro
              </span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1 ml-4" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label }) => {
              const active = isNavActive(to, pathname)
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={desktopNavClass(active)}
                >
                  {label}
                  {/* Active bottom indicator — monochrome black/white */}
                  {active && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-ink dark:bg-white"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Desktop Controls (768px+) */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <LanguageSelector />

              {/* Search pill — desktop only */}
              <button
                type="button"
                onClick={() => navigate('/directory')}
                aria-label={t('common.search')}
                className="
                  hidden lg:flex items-center gap-2 h-8 px-3
                  bg-surface-2 border border-border text-ink-3
                  rounded-lg cursor-pointer
                  hover:border-brand-border hover:text-ink-2
                  transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1
                "
              >
                <Search size={13} aria-hidden="true" className="shrink-0" />
                <span className="text-[12.5px]">{t('nav.search')}</span>
                <kbd
                  className="ml-1 text-[10px] text-ink-4 font-mono bg-surface border border-border px-1 py-0.5 rounded"
                  aria-label="keyboard shortcut: slash"
                >
                  /
                </kbd>
              </button>

              {/* Auth controls for desktop */}
              {isLoggedIn ? (
                <UserProfileMenu onLogout={() => setLogoutConfirmOpen(true)} />
              ) : (
                <>
                  <Link
                    to="/login"
                    className="
                      text-[13.5px] font-medium
                      text-ink-2 hover:text-ink hover:no-underline
                      px-3 py-1.5 rounded-md hover:bg-surface-2
                      transition-colors duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1
                    "
                  >
                    {t('nav.login')}
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/register')}
                    className="rounded-lg text-[13px]"
                  >
                    {t('nav.getStarted')}
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Controls (< 768px): Only ThemeToggle + Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                ref={hamburgerRef}
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
                aria-expanded={open}
                aria-controls="mobile-nav-drawer"
                className="
                  h-9 w-9 flex items-center justify-center
                  border border-border rounded-xl text-ink bg-surface-2/60
                  hover:bg-surface-2 active:bg-surface-2
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1
                "
              >
                {open
                  ? <X    size={18} aria-hidden="true" />
                  : <Menu size={18} aria-hidden="true" />
                }
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {open && (
        <div
          id="mobile-nav-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.mobileMenuLabel', 'Navigation menu')}
          className="
            fixed inset-0 top-[60px] z-40
            bg-surface/98 backdrop-blur-xl border-t border-border
            flex flex-col overflow-y-auto
            md:hidden animate-fade-in
          "
        >
          {/* Quick search input button inside drawer */}
          <div className="px-4 pt-4 pb-2">
            <button
              type="button"
              onClick={() => { setOpen(false); navigate('/directory') }}
              className="
                w-full flex items-center gap-3 h-11 px-3.5
                bg-surface-2/70 border border-border text-ink-3
                rounded-2xl cursor-pointer hover:border-ink/20 hover:text-ink
                transition-all duration-150 text-[13px] group shadow-xs
              "
            >
              <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border text-ink-2 group-hover:text-ink">
                <Search size={14} aria-hidden="true" />
              </div>
              <span className="text-[13px] text-ink-3 group-hover:text-ink-2 transition-colors">
                {t('home.searchPlaceholder', 'Who or what are you looking for?')}
              </span>
              <kbd className="ml-auto text-[10.5px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-surface border border-border text-ink-4">
                /
              </kbd>
            </button>
          </div>

          {/* Section: Main Navigation */}
          <div className="px-4 py-2">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-4 px-2 mb-2">
              Menu
            </p>
            <nav className="flex flex-col gap-1.5" aria-label="Mobile navigation">
              {NAV_LINKS.map(({ to, label, sub, icon: Icon }) => {
                const active = isNavActive(to, pathname)
                return (
                  <Link
                    key={to}
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={`
                      group flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-150 hover:no-underline
                      border cursor-pointer
                      ${active
                        ? 'bg-surface-2 border-border shadow-xs'
                        : 'border-transparent hover:bg-surface-2/60 hover:border-border/60'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
                        ${active
                          ? 'bg-ink text-surface shadow-xs'
                          : 'bg-surface-2 text-ink-2 group-hover:text-ink group-hover:bg-surface-2'
                        }
                      `}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[14px] leading-tight ${active ? 'font-bold text-ink' : 'font-medium text-ink-2 group-hover:text-ink'}`}>
                          {label}
                        </span>
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-ink dark:bg-white" aria-hidden="true" />
                        )}
                      </div>
                      <p className="text-[11.5px] text-ink-3 truncate mt-0.5">
                        {sub}
                      </p>
                    </div>

                    <ChevronRight
                      size={15}
                      className={`shrink-0 transition-transform ${active ? 'text-ink' : 'text-ink-4 group-hover:text-ink-3 group-hover:translate-x-0.5'}`}
                    />
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Section: Preferences (Language & Theme) */}
          <div className="px-4 py-3 border-t border-border/60 space-y-4">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-4 px-2 mb-2">
                {t('lang.select', 'Language')}
              </p>
              <LanguageSelector variant="segmented" />
            </div>

            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-4 px-2 mb-2">
                Appearance
              </p>
              <ThemeToggle variant="segmented" className="w-full" />
            </div>
          </div>

          {/* Section: Account & Authentication — pinned to bottom */}
          <div className="mt-auto px-4 py-4 border-t border-border bg-surface-2/30 backdrop-blur-md">
            {isLoggedIn ? (
              <div className="space-y-3">
                {/* User card in mobile drawer */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border shadow-xs">
                  <div className="relative shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile?.display_name || profile?.full_name || 'User'}
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-surface-2 border border-border text-ink font-bold text-sm flex items-center justify-center">
                        {(profile?.display_name?.charAt(0) || profile?.full_name?.charAt(0) || 'U').toUpperCase()}
                      </div>
                    )}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-surface"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-ink truncate leading-tight">
                      {profile?.display_name || profile?.full_name || t('nav.profile', 'Profile')}
                    </p>
                    <p className="text-[11.5px] text-ink-3 truncate mt-0.5">
                      {profile?.headline || profile?.professional_title || profile?.city || 'Verified Member'}
                    </p>
                  </div>

                  {profile?.slug && (
                    <Link
                      to={`/@${profile.slug}`}
                      onClick={() => setOpen(false)}
                      className="p-2 rounded-xl text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors shrink-0 border border-border/80"
                      title={t('nav.viewPublicProfile', 'Public Profile')}
                    >
                      <User size={15} />
                    </Link>
                  )}
                </div>

                {/* Executive Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); navigate('/dashboard') }}
                    className="
                      h-11 rounded-xl bg-ink text-surface font-semibold text-[13px]
                      hover:opacity-90 active:scale-[0.98] transition-all
                      flex items-center justify-center gap-2 shadow-xs cursor-pointer
                    "
                  >
                    <LayoutDashboard size={15} aria-hidden="true" />
                    <span>{t('nav.dashboard')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOpen(false); navigate('/dashboard/profile') }}
                    className="
                      h-11 rounded-xl bg-surface border border-border text-ink font-semibold text-[13px]
                      hover:bg-surface-2 active:scale-[0.98] transition-all
                      flex items-center justify-center gap-2 shadow-xs cursor-pointer
                    "
                  >
                    <Settings size={15} aria-hidden="true" />
                    <span>{t('nav.settings', 'Settings')}</span>
                  </button>
                </div>

                {/* Log out */}
                <button
                  type="button"
                  onClick={() => { setOpen(false); setLogoutConfirmOpen(true) }}
                  className="
                    w-full h-9 rounded-xl text-ink-3 hover:text-danger hover:bg-danger/10
                    flex items-center justify-center gap-1.5 text-[12px] font-medium
                    transition-colors cursor-pointer
                  "
                >
                  <LogOut size={13} aria-hidden="true" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate('/register') }}
                  className="
                    w-full h-11 rounded-xl bg-ink text-surface font-semibold text-[13.5px]
                    hover:opacity-90 active:scale-[0.98] transition-all
                    flex items-center justify-center gap-2 shadow-xs cursor-pointer
                  "
                >
                  <span>{t('nav.getStartedFree', 'Get Started Free')}</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate('/login') }}
                  className="
                    w-full h-11 rounded-xl bg-surface border border-border text-ink font-semibold text-[13.5px]
                    hover:bg-surface-2 active:scale-[0.98] transition-all
                    flex items-center justify-center gap-2 shadow-xs cursor-pointer
                  "
                >
                  <span>{t('nav.login')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <LogoutConfirmation
        isOpen={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  )
}
