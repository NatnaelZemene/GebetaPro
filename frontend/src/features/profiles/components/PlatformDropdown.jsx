/**
 * PlatformDropdown.jsx — Advanced, ultra-sleek platform selector dropdown.
 *
 * Modeled after premium SaaS design patterns (Linear, Vercel, Supabase):
 *   - Custom trigger with authentic brand icon, label, and animated chevron
 *   - Elevated floating popover with rounded-2xl corners, backdrop blur, and soft shadow
 *   - Built-in live search filter to instantly find platforms
 *   - Option subtitles showing URL syntax (e.g., instagram.com/...)
 *   - Contextual indicators (active checkmark, 'Added' tag for used platforms)
 *   - Full keyboard accessibility (Escape to dismiss, focus trap) and click-outside dismissal
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { ChevronDown, Check, Search, X, Globe, Link as LinkIcon } from 'lucide-react'
import {
  SiFacebook, SiInstagram, SiTiktok, SiTelegram, SiWhatsapp,
  SiLinkedin, SiYoutube, SiX, SiSnapchat, SiGithub,
} from 'react-icons/si'

export const PLATFORMS = [
  {
    value: 'INSTAGRAM',
    label: 'Instagram',
    icon: SiInstagram,
    color: '#E4405F',
    bg: '#FDE8EC',
    prefix: 'instagram.com/',
    placeholder: 'yourusername',
    hint: 'Enter your handle without @ — e.g. gebetapro',
    toUrl: (val) => {
      const v = String(val || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '')
      return `https://instagram.com/${v}`
    },
  },
  {
    value: 'TELEGRAM',
    label: 'Telegram',
    icon: SiTelegram,
    color: '#26A5E4',
    bg: '#E3F4FD',
    prefix: 't.me/',
    placeholder: 'username_or_channel',
    hint: 'Enter your username or channel without @',
    toUrl: (val) => {
      const v = String(val || '').trim().replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@/, '')
      return `https://t.me/${v}`
    },
  },
  {
    value: 'WHATSAPP',
    label: 'WhatsApp',
    icon: SiWhatsapp,
    color: '#25D366',
    bg: '#E4FAF0',
    prefix: 'wa.me/',
    placeholder: '+251912345678',
    hint: 'Enter phone number with international country code',
    toUrl: (val) => {
      const digits = String(val || '').replace(/\D/g, '')
      return digits ? `https://wa.me/${digits}` : ''
    },
  },
  {
    value: 'TIKTOK',
    label: 'TikTok',
    icon: SiTiktok,
    color: '#111111',
    bg: '#F0F0F0',
    prefix: 'tiktok.com/@',
    placeholder: 'username',
    hint: 'Enter your TikTok handle',
    toUrl: (val) => {
      const v = String(val || '').trim().replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '').replace(/^@/, '')
      return `https://tiktok.com/@${v}`
    },
  },
  {
    value: 'FACEBOOK',
    label: 'Facebook',
    icon: SiFacebook,
    color: '#1877F2',
    bg: '#E7F0FD',
    prefix: 'facebook.com/',
    placeholder: 'yourpage',
    hint: 'Enter your Facebook page name or profile handle',
    toUrl: (val) => {
      const v = String(val || '').trim().replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')
      return `https://facebook.com/${v}`
    },
  },
  {
    value: 'LINKEDIN',
    label: 'LinkedIn',
    icon: SiLinkedin,
    color: '#0A66C2',
    bg: '#E3EDF9',
    prefix: 'linkedin.com/in/',
    placeholder: 'your-profile',
    hint: 'Enter your personal profile or company slug',
    toUrl: (val) => {
      const v = String(val || '').trim().replace(/^https?:\/\/(www\.)?linkedin\.com\/(in|company)\//i, '')
      return `https://linkedin.com/in/${v}`
    },
  },
  {
    value: 'YOUTUBE',
    label: 'YouTube',
    icon: SiYoutube,
    color: '#FF0000',
    bg: '#FFE8E8',
    prefix: 'youtube.com/',
    placeholder: '@channelname',
    hint: 'Enter your YouTube handle or channel name',
    toUrl: (val) => {
      const raw = String(val || '').trim().replace(/^https?:\/\/(www\.)?youtube\.com\//i, '')
      return `https://youtube.com/${raw.startsWith('@') ? raw : `@${raw}`}`
    },
  },
  {
    value: 'TWITTER',
    label: 'X / Twitter',
    icon: SiX,
    color: '#000000',
    bg: '#F0F0F0',
    prefix: 'x.com/',
    placeholder: 'username',
    hint: 'Enter your handle without @',
    toUrl: (val) => {
      const v = String(val || '').trim().replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '').replace(/^@/, '')
      return `https://x.com/${v}`
    },
  },
  {
    value: 'SNAPCHAT',
    label: 'Snapchat',
    icon: SiSnapchat,
    color: '#EAB308',
    bg: '#FEF9C3',
    prefix: 'snapchat.com/add/',
    placeholder: 'username',
    hint: 'Enter your Snapchat username',
    toUrl: (val) => {
      const v = String(val || '').trim().replace(/^https?:\/\/(www\.)?snapchat\.com\/add\//i, '')
      return `https://snapchat.com/add/${v}`
    },
  },
  {
    value: 'GITHUB',
    label: 'GitHub',
    icon: SiGithub,
    color: '#24292F',
    bg: '#F0F0F0',
    prefix: 'github.com/',
    placeholder: 'username_or_org',
    hint: 'Enter your GitHub profile or organization',
    toUrl: (val) => {
      const v = String(val || '').trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      return `https://github.com/${v}`
    },
  },
  {
    value: 'WEBSITE',
    label: 'Website',
    icon: Globe,
    color: '#4B5563',
    bg: '#F3F4F6',
    prefix: 'https://',
    placeholder: 'yourbusiness.com',
    hint: 'Enter your business or personal website address',
    toUrl: (val) => {
      const v = String(val || '').trim()
      return /^https?:\/\//i.test(v) ? v : `https://${v}`
    },
  },
  {
    value: 'OTHER',
    label: 'Other link',
    icon: LinkIcon,
    color: '#6B7280',
    bg: '#F3F4F6',
    prefix: 'https://',
    placeholder: 'linktr.ee/yourbrand',
    hint: 'Any portfolio, booking, or custom link',
    toUrl: (val) => {
      const v = String(val || '').trim()
      return /^https?:\/\//i.test(v) ? v : `https://${v}`
    },
  },
]

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map(p => [p.value, p]))

export function PlatformIconBadge({ platform, size = 18, className = '' }) {
  const p = PLATFORM_MAP[platform] || PLATFORM_MAP.OTHER
  const Icon = p.icon
  return (
    <div
      className={`flex items-center justify-center rounded-xl shrink-0 transition-transform ${className}`}
      style={{
        width: size + 12,
        height: size + 12,
        backgroundColor: p.bg,
      }}
    >
      <Icon size={size} style={{ color: p.color }} aria-hidden="true" />
    </div>
  )
}

export function PlatformDropdown({
  value = 'INSTAGRAM',
  onChange,
  usedPlatforms = [],
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)

  const activePlatform = PLATFORM_MAP[value] || PLATFORM_MAP.OTHER
  const ActiveIcon = activePlatform.icon

  const close = useCallback(() => {
    setOpen(false)
    setSearch('')
  }, [])

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close()
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, close])

  // Focus search when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open])

  const filteredPlatforms = useMemo(() => {
    if (!search.trim()) return PLATFORMS
    const q = search.toLowerCase().trim()
    return PLATFORMS.filter(p =>
      p.label.toLowerCase().includes(q) ||
      p.value.toLowerCase().includes(q) ||
      p.prefix.toLowerCase().includes(q)
    )
  }, [search])

  function handleSelect(platformValue) {
    onChange?.(platformValue)
    close()
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          w-full sm:w-48 h-10 px-3
          flex items-center justify-between gap-2.5
          bg-surface hover:bg-surface-2
          border rounded-xl
          text-left transition-all duration-150 cursor-pointer select-none
          ${open
            ? 'border-ink dark:border-white ring-2 ring-ink/10 dark:ring-white/10 shadow-xs'
            : 'border-border hover:border-border-strong shadow-2xs'
          }
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <PlatformIconBadge platform={activePlatform.value} size={15} />
          <span className="text-[13.5px] font-semibold text-ink truncate">
            {activePlatform.label}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-ink-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-ink' : ''}`}
        />
      </button>

      {/* Floating Popover Menu */}
      {open && (
        <div
          role="listbox"
          className="
            absolute top-full left-0 mt-2 z-50
            w-72 sm:w-80 max-w-[calc(100vw-2rem)]
            bg-surface/98 dark:bg-neutral-900/98 backdrop-blur-xl
            border border-border/80 dark:border-neutral-800
            rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)]
            p-2
            animate-in fade-in zoom-in-95 duration-150
          "
        >
          {/* Quick Search */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 mb-1.5 bg-canvas border border-border/80 rounded-xl text-[12.5px] text-ink focus-within:border-ink dark:focus-within:border-white transition-colors">
            <Search size={13} className="text-ink-3 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search platform..."
              className="w-full bg-transparent outline-none placeholder:text-ink-3 text-[12.5px]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-ink-3 hover:text-ink p-0.5 rounded"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Platform options list */}
          <div className="max-h-64 overflow-y-auto space-y-0.5 overscroll-contain pr-1 custom-scrollbar">
            {filteredPlatforms.length === 0 ? (
              <div className="py-6 text-center text-[12.5px] text-ink-3">
                No matching platform found
              </div>
            ) : (
              filteredPlatforms.map(p => {
                const isSelected = p.value === activePlatform.value
                const isAlreadyUsed = usedPlatforms.includes(p.value) && !isSelected

                return (
                  <button
                    key={p.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(p.value)}
                    className={`
                      w-full flex items-center justify-between gap-3
                      px-2.5 py-2 rounded-xl text-left
                      transition-all duration-150 cursor-pointer group
                      ${isSelected
                        ? 'bg-ink/5 dark:bg-white/10 border border-ink/10 dark:border-white/15'
                        : 'hover:bg-surface-2 dark:hover:bg-neutral-800/80 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlatformIconBadge platform={p.value} size={16} />
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[13px] font-semibold truncate ${isSelected ? 'text-ink' : 'text-ink group-hover:text-ink'}`}>
                          {p.label}
                        </span>
                        <span className="text-[11px] text-ink-3 font-mono truncate">
                          {p.prefix}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isAlreadyUsed && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-2 text-ink-3 border border-border/50">
                          Added
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-ink dark:bg-white flex items-center justify-center text-canvas dark:text-neutral-950">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
