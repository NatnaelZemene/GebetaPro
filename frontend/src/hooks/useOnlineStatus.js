/**
 * useOnlineStatus.js — Real-time internet connectivity hook.
 *
 * Provides:
 *   - isOnline: boolean reflecting current network state
 *   - wasOffline: boolean true if device experienced an offline transition in this session
 *   - justReconnected: boolean true for 3 seconds after coming back online
 */
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const [wasOffline, setWasOffline] = useState(false)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    function handleOnline() {
      setIsOnline(true)
      setJustReconnected(true)
      const timer = setTimeout(() => {
        setJustReconnected(false)
      }, 3500)
      return () => clearTimeout(timer)
    }

    function handleOffline() {
      setIsOnline(false)
      setWasOffline(true)
      setJustReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, wasOffline, justReconnected }
}
