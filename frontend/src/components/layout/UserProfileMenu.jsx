/**
 * UserProfileMenu.jsx
 *
 * Modern Dribbble-style profile avatar button & dropdown menu.
 * Displays user's profile image (or fallback initials) with an active status dot.
 * Clicking reveals a floating card with user summary, quick links to
 * Profile, Dashboard, Settings, and Sign Out.
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, User, Settings, LogOut, Shield, ExternalLink,
  ChevronDown,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMyProfile } from '../../features/profiles/hooks/useProfile.js'

function decodeJwtPayload(token) {
  try {
    if (!token) return null
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    )
    return payload
  } catch {
    return null
  }
}

export function UserProfileMenu({ onLogout }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const closeTimeoutRef = useRef(null)

  const token = localStorage.getItem('accessToken')
  const jwt = decodeJwtPayload(token)
  const isAdmin = jwt?.role === 'ADMIN'
  const fallbackEmail = jwt?.email || ''

  const { data: profile, isLoading, refetch } = useMyProfile()

  useEffect(() => {
    function onProfileUpdated() {
      refetch()
    }
    window.addEventListener('gebetapro:profile_updated', onProfileUpdated)
    return () => window.removeEventListener('gebetapro:profile_updated', onProfileUpdated)
  }, [refetch])

  // User details
  const displayName = profile?.full_name || fallbackEmail?.split('@')[0] || t('nav.profile', 'Profile')
  const avatarUrl = profile?.avatar_url || null
  const subtitle = profile?.professional_title || profile?.title || fallbackEmail || ''
  const publicSlug = profile?.slug || null
  const initial = (displayName.charAt(0) || 'U').toUpperCase()

  /* Hover handlers with graceful debounce delay */
  function handleMouseEnter() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setOpen(true)
  }

  function handleMouseLeave() {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 200)
  }

  function handleClick() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setOpen((prev) => !prev)
  }

  /* Cleanup timeout on unmount */
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  /* Close on outside click */
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  /* Close on Escape key */
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function handleNavigate(path) {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    setOpen(false)
    navigate(path)
  }

  return (
    <div
      className="relative inline-block text-left"
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Trigger: Circular avatar with emerald active dot ─────────────── */}
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('nav.profile', 'User Profile')}
        className={`
          relative flex items-center justify-center
          w-9 h-9 rounded-full
          border-2 transition-all duration-150 cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
          ${open ? 'border-brand ring-2 ring-brand/20' : 'border-border hover:border-brand-border'}
        `}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-brand-light text-brand font-bold text-xs flex items-center justify-center">
            {initial}
          </div>
        )}

        {/* Dribbble-style active brand dot */}
        <span
          className="
            absolute bottom-0 right-0 block w-2.5 h-2.5
            rounded-full bg-brand ring-2 ring-surface
          "
          aria-hidden="true"
        />
      </button>

      {/* ── Dropdown Flyout Card ─────────────────────────────────────────── */}
      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="
            absolute right-0 top-full mt-2 w-64
            before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-2.5 before:content-['']
            bg-surface/98 backdrop-blur-xl border border-border
            shadow-[0_16px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
            dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]
            rounded-2xl p-2 z-50 animate-fade-down
          "
        >
          {/* Header Card (Dribbble aesthetic) */}
          <div className="px-3 pt-3 pb-3 text-center border-b border-border/70">
            {/* Center Avatar */}
            <div className="relative inline-block mx-auto mb-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-border shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-brand-light text-brand font-bold text-lg flex items-center justify-center ring-2 ring-border shadow-xs">
                  {initial}
                </div>
              )}
              {/* Online status indicator */}
              <span
                className="
                  absolute bottom-0.5 right-0.5 block w-3 h-3
                  rounded-full bg-brand ring-2 ring-surface
                "
                aria-hidden="true"
              />
            </div>

            {/* User display name */}
            <h3 className="text-[14.5px] font-bold text-ink truncate leading-tight">
              {displayName}
            </h3>

            {/* Subtitle / title */}
            {subtitle && (
              <p className="text-[11.5px] text-ink-3 truncate mt-0.5">
                {subtitle}
              </p>
            )}

            {/* If user has a public profile slug, show quick public badge link */}
            {publicSlug && (
              <div className="mt-2.5">
                <Link
                  to={`/@${publicSlug}`}
                  onClick={() => setOpen(false)}
                  className="
                    inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                    bg-surface-2 border border-border/80 text-ink-2
                    hover:text-brand hover:border-brand-border hover:bg-brand-light/30
                    text-[11.5px] font-medium transition-colors hover:no-underline
                  "
                >
                  <ExternalLink size={11} />
                  <span>{t('nav.viewPublicProfile', 'Public Profile')}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1.5 space-y-0.5" role="none">
            {/* Dashboard */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleNavigate('/dashboard')}
              className="
                w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                text-[13px] font-medium text-ink-2
                hover:text-ink hover:bg-surface-2
                transition-colors duration-150 cursor-pointer
              "
            >
              <LayoutDashboard size={15} className="text-ink-3 shrink-0" />
              <span>{t('nav.dashboard', 'Dashboard')}</span>
            </button>

            {/* Settings / Edit Profile */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleNavigate('/dashboard/profile')}
              className="
                w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                text-[13px] font-medium text-ink-2
                hover:text-ink hover:bg-surface-2
                transition-colors duration-150 cursor-pointer
              "
            >
              <Settings size={15} className="text-ink-3 shrink-0" />
              <span>{t('nav.settings', 'Settings')}</span>
            </button>

            {/* Admin Panel (if admin) */}
            {isAdmin && (
              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavigate('/admin')}
                className="
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                  text-[13px] font-medium text-ink-2
                  hover:text-ink hover:bg-surface-2
                  transition-colors duration-150 cursor-pointer
                "
              >
                <Shield size={15} className="text-brand shrink-0" />
                <span>{t('nav.adminPanel', 'Admin Panel')}</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border/70 my-1 mx-2" aria-hidden="true" />

          {/* Sign Out */}
          <div className="pt-0.5 pb-1" role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              className="
                w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                text-[13px] font-medium text-danger
                hover:bg-red-500/10 hover:text-danger
                transition-colors duration-150 cursor-pointer
              "
            >
              <LogOut size={15} className="shrink-0" />
              <span>{t('nav.logout', 'Sign Out')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
