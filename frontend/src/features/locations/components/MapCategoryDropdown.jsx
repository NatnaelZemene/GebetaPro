/**
 * MapCategoryDropdown.jsx — Advanced, purpose-built category selector for the Map view.
 *
 * Replaces the generic native HTML <select> with a rich, interactive popover:
 *   - Sleek trigger button displaying category icon, active name, clear button, and animated chevron.
 *   - Real-time instant search to filter among 40+ categories.
 *   - Quick-access chips for popular map categories (Hotels, Restaurants, Cafes, Medical, Tours, Tech).
 *   - Hierarchical sector grouping with colorful category icons and indented subcategory badges.
 *   - Clear "All Categories" option with reset indicator.
 *   - Keyboard navigation (Escape to close), outside-click dismissal, and autofocus search.
 *   - Dark mode compatible with elevated backdrop blur and high-contrast typography.
 */
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  Layers, Search, X, Check, ChevronDown, ChevronRight,
  Sparkles, Compass, Utensils, Hotel, HeartPulse, Laptop,
  ShoppingBag, ArrowRight
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CategoryIcon, CategoryIconInline } from '../../profiles/components/CategoryIcon.jsx'

// Popular categories for one-click discovery on the map
const POPULAR_CATEGORY_SHORTCUTS = [
  { slug: 'hotels', label: 'Hotels', icon: Hotel },
  { slug: 'restaurants', label: 'Restaurants', icon: Utensils },
  { slug: 'cafes', label: 'Cafes', icon: Utensils },
  { slug: 'medical', label: 'Healthcare', icon: HeartPulse },
  { slug: 'tour-operators', label: 'Tours & Guides', icon: Compass },
  { slug: 'computer-repair', label: 'Tech & Repair', icon: Laptop },
  { slug: 'retail', label: 'Retail & Shops', icon: ShoppingBag },
]

export function MapCategoryDropdown({
  categories = [],
  value = '',
  onChange,
  className = '',
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)

  // Find currently selected category item
  const selectedCategory = useMemo(() => {
    if (!value) return null
    return categories.find(c => String(c.id) === String(value) || c.slug === value) || null
  }, [categories, value])

  // Build parent-child hierarchy tree
  const categoryTree = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) return []

    const parentList = []
    const subMap = new Map()

    for (const cat of categories) {
      if (!cat.isChild && (!cat.parent_id || cat.parent_id === null)) {
        parentList.push({
          ...cat,
          subcategories: Array.isArray(cat.children) ? [...cat.children] : [],
        })
      } else {
        const pId = cat.parent_id
        if (!subMap.has(pId)) subMap.set(pId, [])
        subMap.get(pId).push(cat)
      }
    }

    // Merge any loose children into parents
    for (const parent of parentList) {
      const extra = subMap.get(parent.id) || []
      for (const item of extra) {
        if (!parent.subcategories.some(existing => existing.id === item.id)) {
          parent.subcategories.push(item)
        }
      }
    }

    return parentList
  }, [categories])

  // Filter categories when user types in search input
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null

    const matches = []
    for (const cat of categories) {
      const nameMatch = cat.name.toLowerCase().includes(q)
      const slugMatch = cat.slug.toLowerCase().includes(q)
      const descMatch = (cat.description || '').toLowerCase().includes(q)

      if (nameMatch || slugMatch || descMatch) {
        // Find parent name if it's a child
        let parentName = null
        if (cat.parent_id) {
          const parent = categories.find(p => p.id === cat.parent_id)
          if (parent) parentName = parent.name
        }
        matches.push({ ...cat, parentName })
      }
    }
    return matches
  }, [categories, searchQuery])

  // Dismiss on outside click or Escape
  const close = useCallback(() => {
    setOpen(false)
    setSearchQuery('')
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (!containerRef.current?.contains(e.target)) close()
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

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [open])

  function handleSelect(id) {
    onChange?.(id)
    close()
  }

  function handleClear(e) {
    e?.stopPropagation()
    onChange?.('')
    setSearchQuery('')
  }

  // Quick select helper by slug
  function handleSelectSlug(slug) {
    const found = categories.find(c => c.slug === slug)
    if (found) {
      handleSelect(found.id)
    }
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* ── Main Trigger Button ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          group h-8 pl-2.5 pr-2 rounded-lg
          flex items-center gap-2
          border text-[13px] font-medium transition-all duration-150 cursor-pointer select-none
          ${selectedCategory
            ? 'bg-brand-light/60 dark:bg-brand/10 border-brand text-brand shadow-xs'
            : 'bg-canvas border-border hover:border-brand-border text-ink-2 hover:text-ink hover:bg-surface-2'
          }
          ${open ? 'ring-2 ring-brand/20 border-brand' : ''}
        `}
      >
        {/* Leading icon */}
        <span className="shrink-0 flex items-center justify-center">
          {selectedCategory ? (
            <CategoryIconInline
              slug={selectedCategory.slug}
              name={selectedCategory.name}
              size={14}
              className="text-brand"
            />
          ) : (
            <Layers size={14} className="text-brand" />
          )}
        </span>

        {/* Selected Label */}
        <span className="truncate max-w-[140px] sm:max-w-[170px] text-left">
          {selectedCategory
            ? t(`categories.${selectedCategory.name}`, { defaultValue: selectedCategory.name })
            : t('directory.allCategories', 'All categories')}
        </span>

        {/* Active Category Clear Button or Badge */}
        {selectedCategory ? (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={e => e.key === 'Enter' && handleClear(e)}
            title="Clear category filter"
            className="p-0.5 rounded-full hover:bg-brand/20 text-brand/80 hover:text-brand transition-colors shrink-0"
          >
            <X size={12} />
          </span>
        ) : (
          <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-surface-2 text-ink-3">
            All
          </span>
        )}

        {/* Animated Chevron */}
        <ChevronDown
          size={13}
          className={`shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180 text-brand' : 'group-hover:text-ink'}`}
        />
      </button>

      {/* ── Advanced Dropdown Menu Popover ─────────────────────────────── */}
      {open && (
        <div
          role="listbox"
          className="
            absolute left-0 mt-2 w-[330px] sm:w-[380px] max-w-[94vw]
            bg-surface/98 dark:bg-[#111720]/98 backdrop-blur-xl
            border border-border/90 dark:border-white/10
            rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.65)]
            overflow-hidden z-[2000]
            animate-in fade-in-50 zoom-in-95 duration-150 origin-top-left
          "
        >
          {/* ── Search Input Header ────────────────────────────────────── */}
          <div className="p-3 border-b border-border bg-surface-2/40">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-ink-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search categories (e.g. hotel, cafe, doctor)…"
                className="
                  w-full h-8.5 pl-8 pr-7
                  bg-surface dark:bg-canvas/80
                  border border-border rounded-xl
                  text-[12.5px] text-ink placeholder:text-ink-4
                  outline-none focus:border-brand focus:ring-2 focus:ring-brand/10
                  transition-all
                "
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-ink-3 hover:text-ink p-0.5 rounded-full"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Quick shortcuts pills (visible when not searching) */}
            {!searchQuery && (
              <div className="mt-2.5 pt-2 border-t border-border/60">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-4 mb-1.5 px-0.5">
                  Popular map sectors
                </p>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_CATEGORY_SHORTCUTS.map(sc => {
                    const isCurrent = selectedCategory?.slug === sc.slug
                    const IconComponent = sc.icon
                    return (
                      <button
                        key={sc.slug}
                        type="button"
                        onClick={() => handleSelectSlug(sc.slug)}
                        className={`
                          inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium
                          border transition-all cursor-pointer select-none
                          ${isCurrent
                            ? 'bg-brand text-white border-brand shadow-2xs'
                            : 'bg-surface hover:bg-surface-2 border-border text-ink-2 hover:text-ink'
                          }
                        `}
                      >
                        <IconComponent size={11} className={isCurrent ? 'text-white' : 'text-brand'} />
                        <span>{sc.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Category List / Results Body ───────────────────────────── */}
          <div className="max-h-[340px] overflow-y-auto overscroll-contain p-2 divide-y divide-border/40 scrollbar-thin">

            {/* 1. "All Categories" option (always at top) */}
            {!searchQuery && (
              <div className="pb-1.5">
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer
                    ${!value
                      ? 'bg-brand-light/70 dark:bg-brand/15 text-brand font-semibold'
                      : 'hover:bg-surface-2 text-ink font-medium'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                      <Layers size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] leading-tight font-semibold">
                        {t('directory.allCategories', 'All categories')}
                      </p>
                      <p className="text-[11px] text-ink-3 leading-tight mt-0.5">
                        Show all published profiles across Ethiopia
                      </p>
                    </div>
                  </div>
                  {!value && <Check size={14} className="text-brand shrink-0 ml-2" />}
                </button>
              </div>
            )}

            {/* 2. Filtered Search Results (if user typed a query) */}
            {filteredResults ? (
              <div className="pt-1.5 space-y-0.5">
                {filteredResults.length === 0 ? (
                  <div className="py-8 text-center px-4">
                    <Search size={22} className="mx-auto text-ink-4 mb-2 opacity-50" />
                    <p className="text-[13px] font-semibold text-ink">No categories found</p>
                    <p className="text-[11.5px] text-ink-3 mt-0.5">
                      No category matching &ldquo;{searchQuery}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-[11.5px] text-brand font-semibold hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-4 px-2 py-1">
                      {filteredResults.length} matching {filteredResults.length === 1 ? 'category' : 'categories'}
                    </p>
                    {filteredResults.map(cat => {
                      const isSelected = String(value) === String(cat.id)
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelect(cat.id)}
                          className={`
                            w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer
                            ${isSelected
                              ? 'bg-brand-light/70 dark:bg-brand/15 text-brand font-semibold'
                              : 'hover:bg-surface-2 text-ink'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CategoryIcon
                              slug={cat.slug}
                              name={cat.name}
                              size={14}
                              boxSize="w-7 h-7"
                              rounded="rounded-lg"
                            />
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-medium leading-tight truncate">
                                {t(`categories.${cat.name}`, { defaultValue: cat.name })}
                              </p>
                              {cat.parentName && (
                                <p className="text-[10.5px] text-ink-4 leading-tight mt-0.5 truncate">
                                  {cat.parentName}
                                </p>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="text-brand shrink-0 ml-2" />}
                        </button>
                      )
                    })}
                  </>
                )}
              </div>
            ) : (
              /* 3. Grouped Hierarchical View (Default Tree) */
              <div className="pt-2 space-y-3">
                {categoryTree.map(parent => {
                  const isParentSelected = String(value) === String(parent.id)
                  const hasSubcategories = parent.subcategories && parent.subcategories.length > 0

                  return (
                    <div key={parent.id} className="rounded-xl p-1 bg-surface-2/20">
                      {/* Parent Category Row */}
                      <button
                        type="button"
                        onClick={() => handleSelect(parent.id)}
                        className={`
                          w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-all cursor-pointer
                          ${isParentSelected
                            ? 'bg-brand text-white font-semibold shadow-xs'
                            : 'hover:bg-surface-2 text-ink font-semibold'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CategoryIcon
                            slug={parent.slug}
                            name={parent.name}
                            size={14}
                            boxSize="w-6 h-6"
                            rounded="rounded-md"
                          />
                          <span className="text-[12.5px] truncate">
                            {t(`categories.${parent.name}`, { defaultValue: parent.name })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isParentSelected ? (
                            <Check size={13} className="text-white" />
                          ) : (
                            hasSubcategories && (
                              <span className="text-[10px] text-ink-4 font-normal px-1 py-0.5 rounded bg-surface-2">
                                {parent.subcategories.length}
                              </span>
                            )
                          )}
                        </div>
                      </button>

                      {/* Subcategories (Indented Pills Grid) */}
                      {hasSubcategories && (
                        <div className="pl-4 pr-1 pt-1 pb-1 flex flex-wrap gap-1">
                          {parent.subcategories.map(sub => {
                            const isSubSelected = String(value) === String(sub.id)
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => handleSelect(sub.id)}
                                className={`
                                  inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11.5px]
                                  transition-all cursor-pointer select-none border
                                  ${isSubSelected
                                    ? 'bg-brand text-white border-brand font-medium shadow-2xs'
                                    : 'bg-surface hover:bg-surface-2 border-border/80 text-ink-2 hover:text-ink'
                                  }
                                `}
                              >
                                <CategoryIconInline
                                  slug={sub.slug}
                                  name={sub.name}
                                  size={11}
                                  className={isSubSelected ? 'text-white' : 'text-ink-3'}
                                />
                                <span>{t(`categories.${sub.name}`, { defaultValue: sub.name })}</span>
                                {isSubSelected && <Check size={10} className="text-white shrink-0 ml-0.5" />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Popover Footer ─────────────────────────────────────────── */}
          <div className="p-2.5 px-3 border-t border-border bg-surface-2/40 flex items-center justify-between text-[11px] text-ink-3">
            <span className="truncate">Filter map markers by business type</span>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-brand font-medium hover:underline shrink-0 ml-2 cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
