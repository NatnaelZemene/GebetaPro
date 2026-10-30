/**
 * LanguageSelector.jsx — Accessible language picker for GebetaPro.
 *
 * Supports 4 languages:
 *   en — English
 *   am — አማርኛ (Amharic)
 *   om — Afaan Oromoo (Oromo)
 *   ti — ትግርኛ (Tigrinya)
 *
 * Renders a compact dropdown triggered by a globe button.
 * Includes GPS auto-detection option to automatically pick language
 * based on user's region (e.g. Amhara → Amharic).
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Check, ChevronDown, MapPin, Loader2 } from 'lucide-react'
import { detectAndApplyGeoLanguage } from '../../i18n.js'

/** All supported languages with display metadata */
const LANGUAGES = [
  { code: 'en', label: 'EN',  full: 'English',      native: 'English'      },
  { code: 'am', label: 'አማ', full: 'Amharic',      native: 'አማርኛ'         },
  { code: 'om', label: 'OM',  full: 'Afaan Oromoo', native: 'Afaan Oromoo' },
  { code: 'ti', label: 'ትግ', full: 'Tigrinya',     native: 'ትግርኛ'         },
]

/* ─────────────────────────────────────────────────────────────────────────
   LanguageSelector — light surface (Navbar / DashboardLayout)
───────────────────────────────────────────────────────────────────────── */
export function LanguageSelector({
  className = '',
  variant = 'dropdown',
  align = 'right',
  fullWidth = false,
}) {
  const { i18n, t }  = useTranslation()
  const current       = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]
  const [open, setOpen] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const containerRef  = useRef(null)

  // Close on outside click or Escape
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') close() }
    function onClick(e) { if (!containerRef.current?.contains(e.target)) close() }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open, close])

  function select(code) {
    if (code !== i18n.language) {
      localStorage.setItem('gebetapro_lang', code)
      i18n.changeLanguage(code)
    }
    close()
  }

  async function handleAutoDetect() {
    setDetecting(true)
    try {
      await detectAndApplyGeoLanguage(true)
    } finally {
      setDetecting(false)
      close()
    }
  }

  /* ── Mobile-First Segmented Pill Variant (for drawers & settings) ───── */
  if (variant === 'segmented') {
    return (
      <div className={`w-full space-y-2 ${className}`}>
        <div
          role="group"
          aria-label={t('lang.select', 'Language')}
          className="w-full grid grid-cols-4 gap-1 p-1 bg-surface-2 border border-border rounded-xl select-none"
        >
          {LANGUAGES.map(({ code, native, label }) => {
            const isActive = code === i18n.language
            return (
              <button
                key={code}
                type="button"
                onClick={() => select(code)}
                aria-pressed={isActive}
                className={`
                  py-2 px-1 rounded-lg text-center transition-all duration-150 cursor-pointer flex flex-col items-center justify-center
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink
                  ${isActive
                    ? 'bg-ink text-surface font-semibold shadow-xs'
                    : 'text-ink-2 hover:text-ink hover:bg-surface/60 font-medium'}
                `}
              >
                <span className={`text-[12px] leading-tight truncate max-w-full ${isActive ? 'text-surface font-bold' : 'text-ink font-medium'}`}>
                  {code === 'om' ? 'Oromoo' : native}
                </span>
                <span className={`text-[10.5px] uppercase tracking-wide leading-none mt-1 font-semibold ${isActive ? 'text-surface/80' : 'text-ink-3'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        {/* GPS Auto-detect button */}
        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={detecting}
          className="
            w-full flex items-center justify-center gap-2 py-2.5 px-3
            text-[12px] font-medium text-ink-2 hover:text-ink
            bg-surface-2/60 border border-border rounded-xl
            hover:bg-surface-2 hover:border-ink/20 transition-all duration-150 cursor-pointer disabled:opacity-50
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink
          "
        >
          {detecting ? (
            <Loader2 size={13} className="animate-spin text-ink-3 shrink-0" />
          ) : (
            <MapPin size={13} className="text-ink-3 shrink-0" />
          )}
          <span>{detecting ? 'Detecting region…' : t('lang.autoDetect', 'Auto-detect language by location')}</span>
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? 'w-full block' : 'inline-block'} ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        id="lang-selector-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.select', 'Language')}
        onClick={() => setOpen(o => !o)}
        className={[
          fullWidth
            ? 'w-full h-11 px-3.5 rounded-2xl justify-between flex items-center'
            : 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg',
          'bg-surface border border-border text-ink cursor-pointer',
          'hover:border-ink/30 hover:bg-surface-2 transition-all duration-150 select-none shadow-xs',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
          open ? 'border-ink/40 bg-surface-2' : '',
        ].join(' ')}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Globe size={fullWidth ? 15 : 12} aria-hidden="true" className="shrink-0 text-ink-3" />
          <span className={`${fullWidth ? 'text-[13.5px]' : 'text-[12px]'} font-semibold text-ink truncate`}>
            {fullWidth ? current.native : current.label}
          </span>
          {fullWidth && (
            <span className="text-[12px] text-ink-3 shrink-0 font-medium">
              ({current.label} · {current.full})
            </span>
          )}
        </span>
        <ChevronDown
          size={fullWidth ? 14 : 10}
          aria-hidden="true"
          className={`shrink-0 text-ink-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          role="listbox"
          aria-label={t('lang.select', 'Language')}
          aria-activedescendant={`lang-opt-${current.code}`}
          className={[
            fullWidth
              ? 'absolute left-0 right-0 top-[calc(100%+6px)] z-[200] w-full'
              : align === 'left'
                ? 'absolute left-0 top-[calc(100%+6px)] z-[200] w-52'
                : 'absolute right-0 top-[calc(100%+6px)] z-[200] w-52',
            'rounded-2xl border border-border',
            'bg-surface shadow-xl shadow-black/15',
            'p-1.5 overflow-hidden',
            'animate-fade-in',
          ].join(' ')}
        >
          {/* GPS Auto-detect button */}
          <li className="border-b border-border/80 mb-1 pb-1">
            <button
              type="button"
              onClick={handleAutoDetect}
              disabled={detecting}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[12.5px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
            >
              {detecting ? (
                <Loader2 size={14} className="animate-spin text-ink-3 shrink-0" />
              ) : (
                <MapPin size={14} className="text-ink-3 shrink-0" />
              )}
              <span className="truncate">
                {detecting ? 'Detecting region…' : t('lang.autoDetect', 'Auto-detect location')}
              </span>
            </button>
          </li>

          {LANGUAGES.map(({ code, full, native, label }) => {
            const isActive = code === i18n.language
            return (
              <li
                key={code}
                id={`lang-opt-${code}`}
                role="option"
                aria-selected={isActive}
              >
                <button
                  type="button"
                  onClick={() => select(code)}
                  className={[
                    'w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl',
                    'text-left text-[13px] transition-colors duration-100 cursor-pointer',
                    'focus-visible:outline-none focus-visible:bg-surface-2',
                    isActive
                      ? 'text-ink bg-surface-2 font-bold border border-border/80'
                      : 'text-ink-2 hover:bg-surface-2/60 hover:text-ink border border-transparent',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`w-7 h-6 rounded-md flex items-center justify-center text-[10.5px] font-bold tabular-nums shrink-0 ${isActive ? 'bg-ink text-surface' : 'bg-surface-2 text-ink-3'}`}>
                      {label}
                    </span>
                    <span>
                      <span className="block leading-tight font-semibold text-ink">{native}</span>
                      <span className="block text-[11px] text-ink-3 leading-tight">{full}</span>
                    </span>
                  </span>
                  {isActive && <Check size={14} className="shrink-0 text-ink" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   LanguageSelectorDark — dark-surface variant (dark headers / footers)
───────────────────────────────────────────────────────────────────────── */
export function LanguageSelectorDark({ className = '' }) {
  const { i18n, t }   = useTranslation()
  const current        = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]
  const [open, setOpen] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const containerRef   = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') close() }
    function onClick(e) { if (!containerRef.current?.contains(e.target)) close() }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open, close])

  function select(code) {
    if (code !== i18n.language) {
      localStorage.setItem('gebetapro_lang', code)
      i18n.changeLanguage(code)
    }
    close()
  }

  async function handleAutoDetect() {
    setDetecting(true)
    try {
      await detectAndApplyGeoLanguage(true)
    } finally {
      setDetecting(false)
      close()
    }
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.select', 'Language')}
        onClick={() => setOpen(o => !o)}
        className={[
          'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg',
          'bg-white/10 border border-white/15',
          'text-white text-[12px] font-semibold',
          'hover:bg-white/20 hover:border-white/30 transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1',
        ].join(' ')}
      >
        <Globe size={12} aria-hidden="true" className="shrink-0 text-white/60" />
        <span>{current.label}</span>
        <ChevronDown
          size={10}
          aria-hidden="true"
          className={`shrink-0 text-white/40 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('lang.select', 'Language')}
          className={[
            'absolute right-0 bottom-[calc(100%+8px)] sm:bottom-auto sm:top-[calc(100%+6px)] z-[200]',
            'w-48 rounded-xl border border-white/15',
            'bg-[#121820] shadow-2xl shadow-black/60',
            'py-1 overflow-hidden',
            'animate-fade-in',
          ].join(' ')}
        >
          {/* GPS Auto-detect button */}
          <li className="border-b border-white/10 mb-1 pb-1">
            <button
              type="button"
              onClick={handleAutoDetect}
              disabled={detecting}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-brand hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {detecting ? (
                <Loader2 size={13} className="animate-spin text-brand" />
              ) : (
                <MapPin size={13} className="text-brand shrink-0" />
              )}
              <span className="truncate text-brand">
                {detecting ? 'Detecting region…' : 'Auto-detect location'}
              </span>
            </button>
          </li>

          {LANGUAGES.map(({ code, full, native, label }) => {
            const isActive = code === i18n.language
            return (
              <li key={code} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => select(code)}
                  className={[
                    'w-full flex items-center justify-between gap-2 px-3 py-2',
                    'text-left text-[13px] transition-colors duration-100',
                    'focus-visible:outline-none focus-visible:bg-white/10',
                    isActive
                      ? 'text-white bg-white/15 font-semibold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 text-center text-[11px] font-bold text-white/40 tabular-nums">
                      {label}
                    </span>
                    <span>
                      <span className="block leading-tight text-white">{native}</span>
                      <span className="block text-[10.5px] text-white/50 leading-tight">{full}</span>
                    </span>
                  </span>
                  {isActive && <Check size={12} className="shrink-0 text-brand" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
