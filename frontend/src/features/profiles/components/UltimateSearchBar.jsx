/**
 * UltimateSearchBar.jsx — Ultimate Floating Command-Bar Search Engine.
 *
 * Features:
 *   - Sleek floating pill / command-bar aesthetic with backdrop blur and high-contrast styling.
 *   - Keyboard shortcut: press '/' or '⌘K' / 'Ctrl+K' to focus from anywhere on the page.
 *   - Live Auto-Complete Popover:
 *       * Instant query suggestions
 *       * Matching categories with icons
 *       * Direct provider results with avatar, rating, and verified badges
 *       * Search history integration
 *   - Smart Location Picker Popover:
 *       * Quick "Use My Current Location" GPS action
 *       * Popular Ethiopian cities & Addis Ababa sub-cities (Bole, Piassa, Kazanchis, CMC...)
 *   - High-contrast monochrome submit action button (no outdated green styling).
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, MapPin, X, ArrowUpRight, Star, BadgeCheck,
  Compass, Clock, Sparkles, Navigation, ChevronRight,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getSearchSuggestions } from '../../../services/profiles.service.js'
import { CategoryIconInline } from './CategoryIcon.jsx'

const POPULAR_CITIES = [
  { name: 'Addis Ababa', sub: 'Capital Metro' },
  { name: 'Hawassa', sub: 'Sidama' },
  { name: 'Bahir Dar', sub: 'Amhara' },
  { name: 'Gondar', sub: 'Amhara' },
  { name: 'Mekelle', sub: 'Tigray' },
  { name: 'Adama', sub: 'Oromia' },
  { name: 'Dire Dawa', sub: 'Chartered City' },
  { name: 'Jimma', sub: 'Oromia' },
  { name: 'Bishoftu', sub: 'Oromia' },
]

const ADDIS_NEIGHBORHOODS = [
  'Bole', 'Piassa', 'Kazanchis', 'CMC', 'Sarbet', 'Megenagna', 'Mexico', 'Gerji',
]

const TRENDING_SEARCHES = [
  'Electrician', 'Coffee Shop', 'Plumber', 'Hair Salon', 'Lawyer',
  'Software Developer', 'Restaurant', 'Dentist', 'Gym & Fitness',
]

export function UltimateSearchBar({
  initialSearch = '',
  initialCity = '',
  onSearch,
  recentSearches = [],
  onSelectRecent,
  onClearRecent,
  onUseCurrentLocation,
  isLocating = false,
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [query, setQuery] = useState(initialSearch)
  const [city, setCity] = useState(initialCity)

  // Popover states
  const [isQueryOpen, setIsQueryOpen] = useState(false)
  const [isCityOpen, setIsCityOpen] = useState(false)

  // Live auto-complete results
  const [suggestions, setSuggestions] = useState({ profiles: [], categories: [] })
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false)

  const queryInputRef = useRef(null)
  const cityInputRef = useRef(null)
  const containerRef = useRef(null)

  // Sync external filter changes
  useEffect(() => { setQuery(initialSearch) }, [initialSearch])
  useEffect(() => { setCity(initialCity) }, [initialCity])

  // Global keyboard shortcut: '/' or 'Cmd+K' / 'Ctrl+K' focuses search
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      if ((e.key === '/' && !isInput) || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault()
        queryInputRef.current?.focus()
        setIsQueryOpen(true)
      } else if (e.key === 'Escape') {
        setIsQueryOpen(false)
        setIsCityOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsQueryOpen(false)
        setIsCityOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced live suggestion fetching
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || trimmed.length < 2) {
      setSuggestions({ profiles: [], categories: [] })
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true)
      try {
        const res = await getSearchSuggestions(trimmed)
        setSuggestions(res || { profiles: [], categories: [] })
      } catch (err) {
        console.debug('Failed to fetch suggestions:', err?.message)
      } finally {
        setIsSearchingSuggestions(false)
      }
    }, 180)

    return () => clearTimeout(timer)
  }, [query])

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    setIsQueryOpen(false)
    setIsCityOpen(false)
    onSearch({ search: query.trim(), city: city.trim() })
  }

  const handleSelectQuery = (val) => {
    setQuery(val)
    setIsQueryOpen(false)
    onSearch({ search: val, city: city.trim() })
  }

  const handleSelectCity = (cityName) => {
    setCity(cityName)
    setIsCityOpen(false)
    onSearch({ search: query.trim(), city: cityName })
  }

  const handleSelectProfile = (profile) => {
    setIsQueryOpen(false)
    navigate(`/p/${profile.slug}`)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto mb-6">
      {/* ── Main Command Bar ────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        role="search"
        className="
          group relative flex flex-col sm:flex-row sm:items-center
          bg-surface/90 backdrop-blur-xl border border-border/80 hover:border-ink/20
          focus-within:border-ink/40 focus-within:ring-4 focus-within:ring-ink/5
          rounded-2xl sm:rounded-full p-1.5 sm:p-2
          shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
          transition-all duration-200
        "
      >
        {/* 1. What / Query Section */}
        <div className="relative flex items-center flex-1 min-w-0 px-3 sm:px-4 h-12">
          <Search
            size={18}
            className={`shrink-0 transition-colors ${
              isQueryOpen ? 'text-ink' : 'text-ink-3 group-focus-within:text-ink'
            }`}
          />
          <input
            ref={queryInputRef}
            type="text"
            value={query}
            onFocus={() => {
              setIsQueryOpen(true)
              setIsCityOpen(false)
            }}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!isQueryOpen) setIsQueryOpen(true)
            }}
            placeholder={t('directory.searchPlaceholder', 'Find electricians, salons, cafes, legal...')}
            className="
              w-full bg-transparent text-[14px] sm:text-[15px] font-normal text-ink
              placeholder:text-ink-4 placeholder:font-normal outline-none px-3 min-w-0
            "
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                queryInputRef.current?.focus()
              }}
              className="w-5 h-5 rounded-full bg-surface-2 hover:bg-border text-ink-3 hover:text-ink flex items-center justify-center transition-colors shrink-0"
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}

          {/* Keyboard shortcut hint */}
          {!query && (
            <div className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-surface-2 text-ink-4 text-[10px] font-mono shrink-0">
              <span>⌘</span><span>K</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-7 bg-border mx-1 shrink-0" />
        <div className="sm:hidden h-px bg-border/60 mx-3 my-0.5" />

        {/* 2. Where / Location Section */}
        <div className="relative flex items-center sm:w-64 lg:w-72 px-3 sm:px-4 h-12 min-w-0">
          <MapPin
            size={17}
            className={`shrink-0 transition-colors ${
              city ? 'text-ink' : 'text-ink-3'
            }`}
          />
          <input
            ref={cityInputRef}
            type="text"
            value={city}
            onFocus={() => {
              setIsCityOpen(true)
              setIsQueryOpen(false)
            }}
            onChange={(e) => {
              setCity(e.target.value)
              if (!isCityOpen) setIsCityOpen(true)
            }}
            placeholder={t('directory.locationPlaceholder', 'City or area in Ethiopia')}
            className="
              w-full bg-transparent text-[13.5px] sm:text-[14px] font-normal text-ink
              placeholder:text-ink-4 outline-none px-2.5 min-w-0
            "
          />

          {city && (
            <button
              type="button"
              onClick={() => {
                setCity('')
                cityInputRef.current?.focus()
              }}
              className="w-5 h-5 rounded-full bg-surface-2 hover:bg-border text-ink-3 hover:text-ink flex items-center justify-center transition-colors shrink-0"
              title="Clear city"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* 3. Action Submit Button */}
        <button
          type="submit"
          className="
            h-11 sm:h-12 px-6 sm:px-7 rounded-xl sm:rounded-full
            bg-ink text-surface font-semibold text-[13.5px] sm:text-[14px]
            hover:opacity-90 active:scale-[0.98]
            transition-all duration-150 flex items-center justify-center gap-2
            shadow-sm shrink-0 cursor-pointer select-none
          "
        >
          <Search size={15} />
          <span>{t('directory.searchBtn', 'Search')}</span>
        </button>
      </form>

      {/* ── Live Auto-complete / Suggestion Popover ──────────────────── */}
      {isQueryOpen && (
        <div
          className="
            absolute left-0 right-0 top-full mt-2 z-50
            bg-surface/98 backdrop-blur-2xl border border-border
            rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-5
            animate-in fade-in zoom-in-95 duration-150
            max-h-[500px] overflow-y-auto space-y-4
          "
        >
          {/* Direct Profile Matches */}
          {suggestions.profiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink-4 mb-2.5 px-1">
                <span>Top Matching Businesses & Providers</span>
                <Sparkles size={13} className="text-amber-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.profiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className="
                      flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-surface-2/40
                      hover:border-ink/30 hover:bg-surface-2 transition-all cursor-pointer group
                    "
                  >
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-surface-2 shrink-0 border border-border">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-ink-3 text-[14px]">
                          {p.display_name?.charAt(0) || 'P'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-ink truncate group-hover:text-brand transition-colors">
                          {p.display_name}
                        </span>
                        {p.is_verified && (
                          <BadgeCheck size={13} className="text-blue-500 shrink-0 fill-blue-500/20" />
                        )}
                      </div>
                      <p className="text-[11.5px] text-ink-3 truncate">
                        {p.headline || p.category_name || p.city || 'Verified provider'}
                      </p>
                    </div>

                    {Number(p.avg_rating) > 0 && (
                      <div className="flex items-center gap-1 text-[11.5px] font-semibold text-ink shrink-0 bg-surface px-2 py-0.5 rounded-md border border-border">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{Number(p.avg_rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matching Categories */}
          {suggestions.categories.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-4 mb-2 px-1">
                Matching Categories
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setIsQueryOpen(false)
                      onSearch({ search: '', category_id: cat.id, city: city.trim() })
                    }}
                    className="
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                      bg-surface-2 border border-border hover:border-ink/30 text-ink text-[12.5px] font-medium
                      transition-all hover:scale-[1.02] cursor-pointer
                    "
                  >
                    <CategoryIconInline slug={cat.slug} name={cat.name} size={13} />
                    <span>{cat.name}</span>
                    <ArrowUpRight size={12} className="text-ink-4" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches && recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink-4 mb-2 px-1">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> Recent Searches
                </span>
                {onClearRecent && (
                  <button
                    type="button"
                    onClick={onClearRecent}
                    className="text-ink-4 hover:text-danger text-[11px] font-normal hover:underline cursor-pointer"
                  >
                    Clear history
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="
                      inline-flex items-center gap-1 px-3 py-1 rounded-full
                      bg-surface-2 border border-border/80 text-ink-2 text-[12px]
                      hover:border-ink/20 hover:text-ink transition-colors
                    "
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRecent && onSelectRecent(item)}
                      className="cursor-pointer"
                    >
                      {item.search || item.city}
                      {item.search && item.city && <span className="text-ink-4"> in {item.city}</span>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-4 mb-2 px-1">
              Popular Searches Across Ethiopia
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_SEARCHES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelectQuery(item)}
                  className="
                    px-3 py-1 rounded-full bg-surface-2 border border-border/80
                    hover:border-ink/30 hover:bg-surface text-ink-2 hover:text-ink
                    text-[12px] font-medium transition-all cursor-pointer
                  "
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Smart Location Picker Popover ───────────────────────────── */}
      {isCityOpen && (
        <div
          className="
            absolute left-0 right-0 sm:left-auto sm:right-0 sm:w-96 top-full mt-2 z-50
            bg-surface/98 backdrop-blur-2xl border border-border
            rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-5
            animate-in fade-in zoom-in-95 duration-150 space-y-4
          "
        >
          {/* GPS Location Button */}
          {onUseCurrentLocation && (
            <button
              type="button"
              onClick={() => {
                setIsCityOpen(false)
                onUseCurrentLocation()
              }}
              disabled={isLocating}
              className="
                w-full flex items-center justify-between p-3 rounded-2xl
                bg-surface-2 hover:bg-surface border border-border hover:border-ink/30
                transition-all cursor-pointer group text-left
              "
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-ink text-surface flex items-center justify-center shrink-0">
                  <Navigation size={16} className={isLocating ? 'animate-spin' : ''} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink">
                    {isLocating ? 'Locating...' : 'Use My Current Location'}
                  </p>
                  <p className="text-[11.5px] text-ink-3">Find nearby providers using GPS</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-ink-4 group-hover:text-ink transition-colors" />
            </button>
          )}

          {/* Major Ethiopian Metros */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-4 mb-2.5 px-1">
              Popular Ethiopian Cities
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleSelectCity(c.name)}
                  className="
                    flex items-center justify-between p-2 rounded-xl
                    hover:bg-surface-2 text-left transition-colors cursor-pointer
                  "
                >
                  <div>
                    <p className="text-[12.5px] font-medium text-ink">{c.name}</p>
                    <p className="text-[10.5px] text-ink-4">{c.sub}</p>
                  </div>
                  {city.toLowerCase() === c.name.toLowerCase() && (
                    <div className="w-2 h-2 rounded-full bg-ink" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Addis Ababa Sub-cities */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-4 mb-2 px-1">
              Addis Ababa Neighborhoods
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ADDIS_NEIGHBORHOODS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => handleSelectCity(`${area}, Addis Ababa`)}
                  className="
                    px-2.5 py-1 rounded-lg bg-surface-2 border border-border
                    hover:border-ink/30 hover:bg-surface text-ink-2 hover:text-ink
                    text-[11.5px] font-medium transition-all cursor-pointer
                  "
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
