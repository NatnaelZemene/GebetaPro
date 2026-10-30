/**
 * useGeolocation.js — React hook for one-shot browser GPS location.
 *
 * Design principles:
 *  - NEVER continuously tracks the user (no watchPosition).
 *  - NEVER stores the user's coordinates in the database.
 *  - Only requests permission when the user explicitly triggers it.
 *  - Gracefully handles permission denied, unavailable, and timeout errors.
 */
import { useState, useCallback } from 'react'

/**
 * @typedef {object} GeolocationState
 * @property {number|null}  lat        - Latitude (null until obtained)
 * @property {number|null}  lng        - Longitude (null until obtained)
 * @property {number|null}  accuracy   - Accuracy in metres
 * @property {boolean}      loading    - True while a request is in-flight
 * @property {string|null}  error      - Human-readable error message or null
 * @property {boolean}      supported  - False if the browser lacks Geolocation API
 */

/**
 * One-shot geolocation hook.
 * Call `getLocation()` to trigger the browser permission prompt and fetch coords.
 *
 * @returns {{ lat, lng, accuracy, loading, error, supported, getLocation, clear }}
 */
export function useGeolocation() {
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const [state, setState] = useState({
    lat: null,
    lng: null,
    accuracy: null,
    city: null,
    loading: false,
    error: null,
  })

  /** Helper to attempt IP-based geolocation fallback */
  const tryIpFallback = async (defaultError) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      const res = await fetch('https://ipwho.is/', { signal: controller.signal })
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        if (data && data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          setState({
            lat: data.latitude,
            lng: data.longitude,
            accuracy: 5000,
            city: data.city || null,
            loading: false,
            error: null,
          })
          return true
        }
      }
    } catch {
      // Ignore IP fallback error and show main message
    }
    setState((s) => ({ ...s, loading: false, error: defaultError }))
    return false
  }

  /** Request the user's current position (one-shot). */
  const getLocation = useCallback(() => {
    const isSecure = typeof window === 'undefined' || window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    if (!supported && !isSecure) {
      setState((s) => ({ ...s, loading: true, error: null }))
      tryIpFallback('Geolocation requires HTTPS on deployed websites. Please use https:// or enter your city manually.')
      return
    }

    if (!supported) {
      setState((s) => ({ ...s, loading: true, error: null }))
      tryIpFallback('Your browser does not support geolocation. Please enter your location manually.')
      return
    }

    // If on insecure HTTP deployment, navigator.geolocation is blocked by browsers
    if (!isSecure) {
      setState((s) => ({ ...s, loading: true, error: null }))
      tryIpFallback('Geolocation requires HTTPS on deployed sites. Please access via https:// or enter your city manually.')
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    // Step 1: Attempt High Accuracy GPS
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          city: null,
          loading: false,
          error: null,
        })
      },
      (highAccErr) => {
        // If permission denied, do not retry GPS; attempt IP fallback or show message
        if (highAccErr.code === highAccErr.PERMISSION_DENIED) {
          tryIpFallback('Location permission was denied. Please allow it in your browser settings or enter your city manually.')
          return
        }

        // Step 2: High accuracy failed (common on laptops/desktops without GPS chip).
        // Retry with standard coarse accuracy (network/Wi-Fi triangulation)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setState({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              city: null,
              loading: false,
              error: null,
            })
          },
          (standardErr) => {
            // Step 3: Browser geolocation completely failed, fallback to IP lookup
            let message
            switch (standardErr.code) {
              case standardErr.PERMISSION_DENIED:
                message = 'Location permission was denied. Please allow it in your browser settings or enter it manually.'
                break
              case standardErr.POSITION_UNAVAILABLE:
                message = 'Your location is currently unavailable. Please enter it manually.'
                break
              case standardErr.TIMEOUT:
                message = 'Location request timed out. Please enter your location manually.'
                break
              default:
                message = 'Unable to retrieve your location. Please enter it manually.'
            }
            tryIpFallback(message)
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 120000,
          },
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000,
      },
    )
  }, [supported])

  /** Clear the stored location and any error. */
  const clear = useCallback(() => {
    setState({ lat: null, lng: null, accuracy: null, city: null, loading: false, error: null })
  }, [])

  return { ...state, supported, getLocation, clear }
}
