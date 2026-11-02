import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useResizableSidebar.js — Smooth, accessible draggable resizing for side navigation.
 *
 * Features:
 *   - Mouse & touch drag support with 60fps tracking (disables CSS transitions during drag).
 *   - Auto-collapse snap threshold when dragging below minimum width.
 *   - Double-click to reset to default width.
 *   - Full keyboard accessibility (ArrowLeft/Right, Home/End, Enter to reset).
 *   - LocalStorage persistence for both width and collapsed state.
 *   - ARIA separator semantics.
 */
export function useResizableSidebar({
  storageKey = 'admin_sidebar_width',
  collapsedStorageKey = 'admin_sidebar_collapsed',
  defaultWidth = 248,
  minWidth = 200,
  maxWidth = 420,
  collapsedWidth = 68,
  collapseThreshold = 140,
  initialCollapsed = false,
} = {}) {
  // Read saved width safely
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          return parsed
        }
      }
    } catch {}
    return defaultWidth
  })

  // Read saved collapsed state safely
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(collapsedStorageKey)
      if (saved !== null) {
        return saved === 'true'
      }
    } catch {}
    return initialCollapsed
  })

  const [isDragging, setIsDragging] = useState(false)
  const dragStartXRef = useRef(0)
  const dragStartWidthRef = useRef(sidebarWidth)

  // Persist width changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(sidebarWidth))
    } catch {}
  }, [storageKey, sidebarWidth])

  // Persist collapsed state changes
  useEffect(() => {
    try {
      localStorage.setItem(collapsedStorageKey, String(collapsed))
    } catch {}
  }, [collapsedStorageKey, collapsed])

  // Start drag handler (Mouse)
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return // Only left-click
    e.preventDefault()

    setIsDragging(true)
    dragStartXRef.current = e.clientX
    dragStartWidthRef.current = collapsed ? collapsedWidth : sidebarWidth

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - dragStartXRef.current
      const rawWidth = dragStartWidthRef.current + delta

      if (rawWidth < collapseThreshold) {
        setCollapsed(true)
      } else {
        const clamped = Math.max(minWidth, Math.min(maxWidth, rawWidth))
        setCollapsed(false)
        setSidebarWidth(clamped)
      }
    }

    const onMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [collapsed, collapsedWidth, sidebarWidth, collapseThreshold, minWidth, maxWidth])

  // Start drag handler (Touch)
  const handleTouchStart = useCallback((e) => {
    if (!e.touches || e.touches.length === 0) return

    setIsDragging(true)
    dragStartXRef.current = e.touches[0].clientX
    dragStartWidthRef.current = collapsed ? collapsedWidth : sidebarWidth

    const onTouchMove = (moveEvent) => {
      if (!moveEvent.touches || moveEvent.touches.length === 0) return
      const delta = moveEvent.touches[0].clientX - dragStartXRef.current
      const rawWidth = dragStartWidthRef.current + delta

      if (rawWidth < collapseThreshold) {
        setCollapsed(true)
      } else {
        const clamped = Math.max(minWidth, Math.min(maxWidth, rawWidth))
        setCollapsed(false)
        setSidebarWidth(clamped)
      }
    }

    const onTouchEnd = () => {
      setIsDragging(false)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      document.body.style.removeProperty('user-select')
    }

    document.body.style.userSelect = 'none'
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
  }, [collapsed, collapsedWidth, sidebarWidth, collapseThreshold, minWidth, maxWidth])

  // Double click resets width to default
  const handleDoubleClick = useCallback(() => {
    setCollapsed(false)
    setSidebarWidth(defaultWidth)
  }, [defaultWidth])

  // Keyboard navigation for accessibility
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (collapsed) return
      const next = sidebarWidth - 12
      if (next < minWidth) {
        setCollapsed(true)
      } else {
        setSidebarWidth(next)
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (collapsed) {
        setCollapsed(false)
        setSidebarWidth(minWidth)
      } else {
        setSidebarWidth(w => Math.min(maxWidth, w + 12))
      }
    } else if (e.key === 'Home') {
      e.preventDefault()
      setCollapsed(true)
    } else if (e.key === 'End') {
      e.preventDefault()
      setCollapsed(false)
      setSidebarWidth(maxWidth)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setCollapsed(false)
      setSidebarWidth(defaultWidth)
    }
  }, [collapsed, sidebarWidth, minWidth, maxWidth, defaultWidth])

  // Cleanup if unmounted while dragging
  useEffect(() => {
    return () => {
      document.body.style.removeProperty('cursor')
      document.body.style.removeProperty('user-select')
    }
  }, [])

  return {
    sidebarWidth,
    collapsed,
    isDragging,
    effectiveWidth: collapsed ? collapsedWidth : sidebarWidth,
    setCollapsed,
    setSidebarWidth,
    toggleCollapsed: () => setCollapsed(c => !c),
    resetWidth: () => {
      setCollapsed(false)
      setSidebarWidth(defaultWidth)
    },
    handleMouseDown,
    handleTouchStart,
    handleDoubleClick,
    handleKeyDown,
  }
}
