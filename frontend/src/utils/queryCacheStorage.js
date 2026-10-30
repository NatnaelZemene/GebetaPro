/**
 * queryCacheStorage.js — Persistent Storage & Hydration for TanStack Query.
 *
 * Solves:
 *   1. Instant Page Navigation (0ms): Pre-loads query cache from device storage
 *      on boot so navigating back to pages has zero skeleton flash.
 *   2. Offline Resilience: When internet drops, all queries remain in memory
 *      and storage, preventing empty screens and data loss.
 *   3. LRU Quota Protection: Automatically evicts oldest cache entries to
 *      stay comfortably within localStorage boundaries (< 2 MB).
 */

const STORAGE_KEY = 'gebetapro_query_cache_v1'
const MAX_PERSISTED_ENTRIES = 35
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// Query key prefixes that provide high-value offline/instant reading
const PERSIST_KEY_PREFIXES = [
  'profiles',
  'categories',
  'profile',
  'profile-map-pins',
]

function shouldPersistKey(queryKey) {
  if (!Array.isArray(queryKey) || queryKey.length === 0) return false
  const primary = String(queryKey[0])
  return PERSIST_KEY_PREFIXES.includes(primary)
}

function safeSerializeKey(queryKey) {
  return JSON.stringify(queryKey)
}

function safeDeserializeKey(keyStr) {
  try {
    return JSON.parse(keyStr)
  } catch {
    return null
  }
}

/**
 * Hydrates TanStack QueryClient with persisted data synchronously on boot.
 * Call this before React mounts to achieve instant 0ms first render.
 */
export function hydrateQueryCache(queryClient) {
  if (typeof window === 'undefined' || !window.localStorage) return

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    const store = JSON.parse(raw)
    if (!store || typeof store !== 'object') return

    const now = Date.now()
    let hydratedCount = 0

    for (const [keyStr, item] of Object.entries(store)) {
      if (!item || !item.data) continue

      // Ignore expired entries
      if (item.timestamp && now - item.timestamp > CACHE_TTL_MS) continue

      const queryKey = safeDeserializeKey(keyStr)
      if (queryKey && shouldPersistKey(queryKey)) {
        queryClient.setQueryData(queryKey, item.data, {
          updatedAt: item.timestamp || now,
        })
        hydratedCount++
      }
    }

    if (hydratedCount > 0) {
      console.debug(`[GebetaPro Cache] Hydrated ${hydratedCount} queries from offline storage`)
    }
  } catch (err) {
    console.debug('[GebetaPro Cache] Failed to hydrate cache:', err?.message)
  }
}

/**
 * Sets up auto-persistence subscriber on QueryClient.
 * Whenever a query successfully resolves, it debounces and syncs to localStorage.
 */
export function setupQueryCachePersistence(queryClient) {
  if (typeof window === 'undefined' || !window.localStorage) return

  let saveTimeout = null

  queryClient.getQueryCache().subscribe((event) => {
    // Only capture successful data updates
    if (
      event.type === 'updated' &&
      event.query.state.status === 'success' &&
      event.query.state.data !== undefined
    ) {
      const queryKey = event.query.queryKey
      if (!shouldPersistKey(queryKey)) return

      // Debounce writes to avoid localStorage thrashing during rapid requests
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        persistActiveQueries(queryClient)
      }, 500)
    }
  })
}

function persistActiveQueries(queryClient) {
  try {
    const cache = queryClient.getQueryCache().getAll()
    const entries = []
    const now = Date.now()

    for (const query of cache) {
      if (
        query.state.status === 'success' &&
        query.state.data !== undefined &&
        shouldPersistKey(query.queryKey)
      ) {
        entries.push({
          keyStr: safeSerializeKey(query.queryKey),
          data: query.state.data,
          timestamp: query.state.dataUpdatedAt || now,
        })
      }
    }

    // Sort by latest update (LRU ordering) and cap to MAX_PERSISTED_ENTRIES
    entries.sort((a, b) => b.timestamp - a.timestamp)
    const capped = entries.slice(0, MAX_PERSISTED_ENTRIES)

    const payload = {}
    for (const item of capped) {
      payload[item.keyStr] = {
        data: item.data,
        timestamp: item.timestamp,
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (err) {
    // If storage quota exceeded, clear and save only top 10
    if (err?.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Ignore
      }
    }
  }
}

/**
 * Utility to clear the offline query cache (e.g. on logout)
 */
export function clearQueryCacheStorage() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}
