/**
 * lazyWithRetry.js — Resilient lazy loading with automatic refresh on chunk hash mismatch.
 *
 * When an application is deployed with new build hashes, clients with an open tab
 * might request deleted chunks, resulting in "Failed to fetch dynamically imported module".
 * This helper catches that error, triggers a single clean reload to pick up the new index,
 * and prevents the user from seeing a blank/black screen.
 */
import { lazy } from 'react'

export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('app_chunk_force_refreshed') || 'false'
    )

    try {
      const component = await componentImport()
      window.sessionStorage.setItem('app_chunk_force_refreshed', 'false')
      return component
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        window.sessionStorage.setItem('app_chunk_force_refreshed', 'true')
        window.location.reload()
        return new Promise(() => {}) // Return pending promise while window reloads
      }
      throw error
    }
  })
}
