/**
 * CategoryModal.jsx — Modal for creating or editing categories & subcategories.
 * Includes live icon preview, smart slug generation, hierarchy selector, and validation.
 */
import { useState, useEffect } from 'react'
import { X, Sparkles, FolderTree, Tag, Info, Check } from 'lucide-react'
import { Button } from '../../../components/ui/Button.jsx'
import { Select } from '../../../components/ui/Select.jsx'
import { Badge } from '../../../components/ui/Badge.jsx'
import { CategoryIcon } from '../../profiles/components/CategoryIcon.jsx'
import { useFocusTrap } from '../../../hooks/useFocusTrap.js'

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export function CategoryModal({
  isOpen,
  category = null, // null for create, category object for edit
  defaultParentId = null,
  parents = [],
  onClose,
  onSubmit,
  loading = false,
  error = null,
}) {
  const isEditing = Boolean(category)
  const dialogRef = useFocusTrap(isOpen, onClose)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    is_active: true,
  })

  const [autoSlug, setAutoSlug] = useState(!isEditing)

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        parent_id: category.parent_id || '',
        is_active: category.is_active ?? true,
      })
      setAutoSlug(false)
    } else {
      setForm({
        name: '',
        slug: '',
        description: '',
        parent_id: defaultParentId || '',
        is_active: true,
      })
      setAutoSlug(true)
    }
  }, [category, defaultParentId, isOpen])

  if (!isOpen) return null

  function handleNameChange(val) {
    setForm(prev => {
      const next = { ...prev, name: val }
      if (autoSlug) {
        next.slug = slugify(val)
      }
      return next
    })
  }

  function handleSlugChange(val) {
    setAutoSlug(false)
    setForm(prev => ({ ...prev, slug: slugify(val) }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) return

    onSubmit({
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      parent_id: form.parent_id ? form.parent_id : null,
      is_active: form.is_active,
    })
  }

  const inputCls = `
    block w-full h-10 px-3.5 text-[13.5px]
    bg-canvas border border-border rounded-xl
    focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand
    text-ink placeholder:text-ink-3 transition-all duration-150
  `
  const labelCls = 'block text-[12.5px] font-semibold text-ink-2 mb-1.5'

  const selectedParent = parents.find(p => p.id === form.parent_id)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border bg-surface-2/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-light dark:bg-brand/15 border border-brand/20 flex items-center justify-center text-brand shrink-0">
              <FolderTree size={18} />
            </div>
            <div>
              <h2 id="category-modal-title" className="text-[16px] font-bold text-ink">
                {isEditing ? 'Edit Category' : form.parent_id ? 'Add Subcategory' : 'New Category'}
              </h2>
              <p className="text-[12px] text-ink-3">
                {isEditing
                  ? `Modifying "${category?.name}"`
                  : form.parent_id
                    ? `Creating child under "${selectedParent?.name || 'parent'}"`
                    : 'Create a top-level taxonomy branch'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-3 hover:text-ink hover:bg-surface-2 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-danger-bg border border-red-200 dark:border-red-900/40 rounded-xl p-3.5 text-[13px] text-danger flex items-start gap-2.5">
              <Info size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to save category</p>
                <p className="text-[12px] opacity-90 mt-0.5">
                  {error?.response?.data?.message || error?.message || 'Please verify form fields and try again.'}
                </p>
              </div>
            </div>
          )}

          {/* Live Preview Card */}
          <div className="bg-canvas border border-border/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <CategoryIcon
                slug={form.slug || 'category'}
                name={form.name || 'Category'}
                size={18}
                boxSize="w-10 h-10"
                rounded="rounded-xl"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-bold text-ink truncate">
                    {form.name || 'Category Name'}
                  </span>
                  {form.is_active ? (
                    <Badge variant="success" size="xs" dot>Active</Badge>
                  ) : (
                    <Badge variant="default" size="xs">Inactive</Badge>
                  )}
                  {form.parent_id && (
                    <span className="text-[11px] text-ink-3 bg-surface-2 px-2 py-0.5 rounded-md border border-border/50">
                      Subcategory of {selectedParent?.name || 'parent'}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-ink-3 font-mono mt-0.5">
                  /{form.slug || 'slug'}
                </p>
              </div>
            </div>
            <div className="text-[11px] text-ink-4 shrink-0 flex items-center gap-1 font-medium bg-surface px-2.5 py-1 rounded-md border border-border">
              <Sparkles size={11} className="text-amber-500" /> Auto-themed icon
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Category Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={inputCls}
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Home Services or Plumbing"
                required
                maxLength={100}
                autoFocus
              />
            </div>

            {/* Slug */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12.5px] font-semibold text-ink-2">
                  URL Slug <span className="text-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAutoSlug(prev => !prev)
                    if (!autoSlug && form.name) {
                      setForm(f => ({ ...f, slug: slugify(f.name) }))
                    }
                  }}
                  className="text-[11.5px] text-brand hover:underline font-medium cursor-pointer"
                >
                  {autoSlug ? 'Lock / Customize Slug' : 'Auto-sync with Name'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 text-[13px] font-mono select-none">
                  /
                </span>
                <input
                  type="text"
                  className={inputCls + ' pl-7 font-mono text-[13px]'}
                  value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  placeholder="home-services"
                  required
                  maxLength={100}
                  pattern="^[a-z0-9-]+$"
                />
              </div>
              <p className="text-[11px] text-ink-3 mt-1">
                Lowercase letters, numbers, and hyphens only. Used in directory URLs and filters.
              </p>
            </div>

            {/* Parent Category */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Parent Taxonomy</label>
              <Select
                className="h-10 text-[13.5px] bg-canvas border-border rounded-xl"
                value={form.parent_id || ''}
                onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
              >
                <option value="">None (Top-level Category)</option>
                {parents
                  .filter(p => !isEditing || p.id !== category?.id)
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      📁 {p.name}
                    </option>
                  ))}
              </Select>
              <p className="text-[11px] text-ink-3 mt-1">
                Leave as "None" for root branches (e.g., Food & Beverage). Select a parent to create a subcategory (e.g., Cafes).
              </p>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Description (Optional)</label>
              <textarea
                className={inputCls + ' h-20 py-2.5 resize-none'}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                maxLength={500}
                placeholder="Brief summary of what this category covers..."
              />
              <div className="flex justify-end mt-1">
                <span className="text-[11px] text-ink-4">
                  {form.description.length} / 500 characters
                </span>
              </div>
            </div>

            {/* Active Switch */}
            <div className="sm:col-span-2 bg-surface-2/60 border border-border/80 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-ink">Publish Status</p>
                <p className="text-[11.5px] text-ink-3">
                  When active, businesses can tag this category and it appears in search & filters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                  form.is_active ? 'bg-success' : 'bg-ink-4/30'
                }`}
                role="switch"
                aria-checked={form.is_active}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                    form.is_active ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-2.5 justify-end pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-[13px] font-medium text-ink-2 bg-surface-2 hover:bg-surface-3 border border-border rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              size="md"
              loading={loading}
              disabled={!form.name.trim() || !form.slug.trim()}
            >
              {isEditing ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
