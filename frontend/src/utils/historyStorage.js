/**
 * historyStorage.js — Persistent device search and viewing history utility.
 * 
 * Stores recent searches and recently viewed profiles in localStorage
 * so users can pick up right where they left off on this device.
 */

const SEARCH_HISTORY_KEY = 'gebetapro_search_history'
const VIEWED_PROFILES_KEY = 'gebetapro_viewed_profiles'
const MAX_SEARCHES = 8
const MAX_PROFILES = 10

function dispatchHistoryChange(type) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gebetapro:history_updated', { detail: { type } }))
  }
}

/* ── Search History ────────────────────────────────────────────────────────── */

export function getSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSearchHistory({ search = '', city = '' } = {}) {
  const cleanSearch = (search || '').trim()
  const cleanCity = (city || '').trim()

  if (!cleanSearch && !cleanCity) return

  try {
    const current = getSearchHistory()
    // Deduplicate against existing search/city combo
    const filtered = current.filter(
      item => !(
        item.search?.toLowerCase() === cleanSearch.toLowerCase() &&
        (item.city || '').toLowerCase() === cleanCity.toLowerCase()
      )
    )

    const newItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      search: cleanSearch,
      city: cleanCity,
      timestamp: Date.now(),
    }

    const updated = [newItem, ...filtered].slice(0, MAX_SEARCHES)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
    dispatchHistoryChange('search')
  } catch {
    // Fail silently if localStorage quota is exceeded or unavailable
  }
}

export function removeSearchHistoryItem(id) {
  try {
    const current = getSearchHistory()
    const updated = current.filter(item => item.id !== id)
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
    dispatchHistoryChange('search')
  } catch {
    // Fail silently
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY)
    dispatchHistoryChange('search')
  } catch {
    // Fail silently
  }
}

/* ── Viewed Profiles History ───────────────────────────────────────────────── */

export function getViewedProfiles() {
  try {
    const raw = localStorage.getItem(VIEWED_PROFILES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveViewedProfile(profile) {
  if (!profile || !profile.slug) return

  try {
    const current = getViewedProfiles()
    // Remove if already in list to bump to top
    const filtered = current.filter(p => p.slug !== profile.slug)

    const entry = {
      slug: profile.slug,
      full_name: profile.full_name || 'Professional',
      title: profile.professional_title || profile.title || '',
      avatar_url: profile.avatar_url || null,
      city: profile.city || '',
      category_name: profile.category_name || '',
      avg_rating: profile.avg_rating ?? null,
      review_count: profile.review_count ?? 0,
      is_verified: !!profile.is_verified,
      timestamp: Date.now(),
    }

    const updated = [entry, ...filtered].slice(0, MAX_PROFILES)
    localStorage.setItem(VIEWED_PROFILES_KEY, JSON.stringify(updated))
    dispatchHistoryChange('profile')
  } catch {
    // Fail silently
  }
}

export function removeViewedProfile(slug) {
  try {
    const current = getViewedProfiles()
    const updated = current.filter(p => p.slug !== slug)
    localStorage.setItem(VIEWED_PROFILES_KEY, JSON.stringify(updated))
    dispatchHistoryChange('profile')
  } catch {
    // Fail silently
  }
}

export function clearViewedProfiles() {
  try {
    localStorage.removeItem(VIEWED_PROFILES_KEY)
    dispatchHistoryChange('profile')
  } catch {
    // Fail silently
  }
}
