/**
 * AdminCategoriesPage.jsx — Modern, Advanced Categories & Taxonomy Management.
 * Features:
 * - Real-time Search & Status Filtering
 * - KPI Metric Cards (Total, Active, Inactive, Subcategories)
 * - Modal-based Creation & Editing with live icon previews
 * - Safe Delete Confirmation with active dependency checks
 * - Optimistic, reliable on/off switches with per-row loading
 * - Quick "+ Subcategory" action directly on parent cards
 * - Toast feedback and keyboard accessibility
 */
import { useState, useMemo } from 'react'
import {
  Plus, Pencil, Trash2, FolderPlus,
  Loader2, ChevronDown, ChevronRight, Tag,
  FolderTree, CheckCircle2, XCircle, Layers,
  Sparkles, Check, AlertCircle, ChevronsUpDown,
} from 'lucide-react'
import { AdminLayout } from '../../components/layout/AdminLayout.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { CategoryIcon, CategoryIconInline } from '../../features/profiles/components/CategoryIcon.jsx'
import { PageHeader, StatCard, SearchBar, FilterSelect, EmptyState } from '../../features/admin/components/AdminTable.jsx'
import { CategoryModal } from '../../features/admin/components/CategoryModal.jsx'
import { DeleteCategoryDialog } from '../../features/admin/components/DeleteCategoryDialog.jsx'
import {
  useAdminCategories, useCreateCategory,
  useUpdateCategory, useToggleCategory,
  useDeleteCategory,
} from '../../features/admin/hooks/useAdmin.js'

/* ── Modern Apple/Stripe-style Toggle Switch ─────────────────────────────── */
function ToggleSwitch({ active, onToggle, loading, label = 'Toggle category status' }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      disabled={loading}
      aria-label={label}
      title={active ? 'Click to deactivate' : 'Click to activate'}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
        active ? 'bg-success' : 'bg-ink-4/30 dark:bg-ink-4/40'
      } ${loading ? 'opacity-60 cursor-wait' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          active ? 'translate-x-4' : 'translate-x-0'
        } ${loading ? 'flex items-center justify-center' : ''}`}
      >
        {loading && <Loader2 size={10} className="animate-spin text-ink-3" />}
      </span>
    </button>
  )
}

/* ── Status filter options ───────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: 'ALL',      label: 'All Statuses' },
  { value: 'ACTIVE',   label: 'Active only' },
  { value: 'INACTIVE', label: 'Inactive only' },
]

export default function AdminCategoriesPage() {
  const { data: cats, isLoading, error } = useAdminCategories()
  const createMut = useCreateCategory()
  const updateMut = useUpdateCategory()
  const toggleMut = useToggleCategory()
  const deleteMut = useDeleteCategory()

  // UI state
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [expandedIds, setExpandedIds]   = useState(new Set())
  const [togglingId, setTogglingId]     = useState(null)

  // Modals state
  const [modalOpen, setModalOpen]               = useState(false)
  const [modalCategory, setModalCategory]       = useState(null)
  const [defaultParentId, setDefaultParentId]   = useState(null)
  const [deleteCategory, setDeleteCategory]     = useState(null)

  // Toast feedback state
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Categories hierarchy breakdown
  const rawList  = useMemo(() => cats || [], [cats])
  const topLevel = useMemo(() => rawList.filter(c => !c.parent_id), [rawList])
  const children = useMemo(() => rawList.filter(c =>  c.parent_id), [rawList])

  // Filtered categories according to search and status
  const filteredTopLevel = useMemo(() => {
    return topLevel.filter(cat => {
      const kids = children.filter(c => c.parent_id === cat.id)
      const q = search.trim().toLowerCase()

      // Search match in parent or any of its children
      const matchesSearch = !q ||
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q)) ||
        kids.some(k => k.name.toLowerCase().includes(q) || k.slug.toLowerCase().includes(q))

      // Status match
      let matchesStatus = true
      if (statusFilter === 'ACTIVE') {
        matchesStatus = cat.is_active === true
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = cat.is_active === false
      }

      return matchesSearch && matchesStatus
    })
  }, [topLevel, children, search, statusFilter])

  // Subcategory helper
  const getChildren = (parentId) => {
    const kids = children.filter(c => c.parent_id === parentId)
    if (!search.trim()) return kids
    const q = search.trim().toLowerCase()
    return kids.filter(k =>
      k.name.toLowerCase().includes(q) ||
      k.slug.toLowerCase().includes(q) ||
      (k.description && k.description.toLowerCase().includes(q))
    )
  }

  const isExpanded   = (id) => expandedIds.has(id)
  const toggleExpand = (id) => setExpandedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const expandAll = () => {
    setExpandedIds(new Set(topLevel.map(c => c.id)))
  }
  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  // Stats calculation
  const totalCategories = rawList.length
  const activeCount     = rawList.filter(c => c.is_active).length
  const inactiveCount   = rawList.filter(c => !c.is_active).length
  const subCount        = children.length

  // Handlers
  function handleOpenCreate(parentId = null) {
    setModalCategory(null)
    setDefaultParentId(parentId)
    setModalOpen(true)
  }

  function handleOpenEdit(cat) {
    setModalCategory(cat)
    setDefaultParentId(cat.parent_id || null)
    setModalOpen(true)
  }

  function handleModalSubmit(payload) {
    if (modalCategory) {
      updateMut.mutate(
        { catId: modalCategory.id, data: payload },
        {
          onSuccess: () => {
            setModalOpen(false)
            showToast(`Category "${payload.name}" updated successfully.`)
          },
        }
      )
    } else {
      createMut.mutate(payload, {
        onSuccess: (newCat) => {
          setModalOpen(false)
          // If child was created, automatically expand parent
          if (payload.parent_id) {
            setExpandedIds(prev => new Set(prev).add(payload.parent_id))
          }
          showToast(`Category "${payload.name}" created successfully.`)
        },
      })
    }
  }

  function handleToggle(cat) {
    setTogglingId(cat.id)
    toggleMut.mutate(cat.id, {
      onSettled: () => setTogglingId(null),
      onSuccess: () => {
        const nextState = !cat.is_active
        showToast(`"${cat.name}" is now ${nextState ? 'Active' : 'Inactive'}.`)
      },
      onError: (err) => {
        showToast(err?.response?.data?.message || 'Failed to update category status.', 'error')
      },
    })
  }

  function handleDeleteConfirm() {
    if (!deleteCategory) return
    deleteMut.mutate(deleteCategory.id, {
      onSuccess: () => {
        showToast(`Category "${deleteCategory.name}" permanently deleted.`)
        setDeleteCategory(null)
      },
      onError: (err) => {
        showToast(err?.response?.data?.message || 'Delete failed.', 'error')
      },
    })
  }

  if (error) {
    return (
      <AdminLayout title="Categories">
        <div className="bg-danger-bg border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12">
          <AlertCircle size={32} className="text-danger mx-auto mb-3" />
          <h3 className="text-[15px] font-bold text-ink mb-1">Failed to load categories</h3>
          <p className="text-danger text-[13px] mb-4">{error?.response?.data?.message || error?.message || 'An error occurred.'}</p>
          <Button size="sm" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Categories">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-[13px] font-medium border animate-in slide-in-from-bottom-3 duration-200 ${
          toast.type === 'error'
            ? 'bg-red-900/90 text-white border-red-700'
            : 'bg-ink text-white border-ink/40'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={16} className="text-red-300" /> : <Check size={16} className="text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Categories"
        subtitle="Manage the taxonomy tree, active discovery filters, and subcategories used across the platform."
        action={
          <Button
            size="md"
            icon={<Plus size={15} />}
            onClick={() => handleOpenCreate()}
          >
            New category
          </Button>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Categories"
          value={isLoading ? '—' : totalCategories}
          sub={`${topLevel.length} root branches`}
          icon={<FolderTree size={16} />}
          iconBg="bg-brand-light dark:bg-brand/15"
          iconColor="text-brand"
          loading={isLoading}
        />
        <StatCard
          label="Active Categories"
          value={isLoading ? '—' : activeCount}
          sub="Visible on map & directory"
          icon={<CheckCircle2 size={16} />}
          iconBg="bg-success-bg dark:bg-emerald-950/40"
          iconColor="text-success"
          loading={isLoading}
        />
        <StatCard
          label="Inactive Categories"
          value={isLoading ? '—' : inactiveCount}
          sub="Hidden from directory"
          icon={<XCircle size={16} />}
          iconBg="bg-surface-2 dark:bg-surface-3"
          iconColor="text-ink-3"
          loading={isLoading}
        />
        <StatCard
          label="Subcategories"
          value={isLoading ? '—' : subCount}
          sub="Nested specializations"
          icon={<Layers size={16} />}
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          iconColor="text-blue-600 dark:text-blue-400"
          loading={isLoading}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-surface border border-border rounded-2xl p-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="w-full sm:max-w-xs">
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder="Search by name, slug..."
            />
          </div>
          <div className="w-full sm:w-44">
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              ariaLabel="Filter by category status"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={expandedIds.size > 0 ? collapseAll : expandAll}
            className="h-9 px-3 text-[12.5px] font-medium text-ink-2 hover:text-ink bg-surface-2 hover:bg-surface-3 border border-border rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronsUpDown size={14} />
            <span>{expandedIds.size > 0 ? 'Collapse all' : 'Expand all'}</span>
          </button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl h-18 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State when no categories at all */}
      {!isLoading && topLevel.length === 0 && (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          message='Get started by clicking "New category" to build your platform taxonomy.'
          action={
            <Button size="sm" icon={<Plus size={13} />} onClick={() => handleOpenCreate()}>
              Create first category
            </Button>
          }
        />
      )}

      {/* Empty State when search has no matches */}
      {!isLoading && topLevel.length > 0 && filteredTopLevel.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-10 text-center">
          <Tag size={32} className="text-ink-4 mx-auto mb-2.5 opacity-60" />
          <h4 className="text-[15px] font-bold text-ink mb-1">No categories match your search</h4>
          <p className="text-[13px] text-ink-3 max-w-sm mx-auto mb-4">
            Try adjusting your search terms or status filter to find what you are looking for.
          </p>
          <button
            type="button"
            onClick={() => { setSearch(''); setStatusFilter('ALL') }}
            className="text-[13px] font-medium text-brand hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Category Hierarchy List */}
      {!isLoading && filteredTopLevel.length > 0 && (
        <div className="flex flex-col gap-3">
          {filteredTopLevel.map(cat => {
            const kids = getChildren(cat.id)
            const hasChildren = kids.length > 0
            const expanded = isExpanded(cat.id)
            const isToggling = togglingId === cat.id

            return (
              <div
                key={cat.id}
                className="bg-surface border border-border rounded-2xl shadow-2xs overflow-hidden transition-all duration-150 hover:border-border/80"
              >
                {/* Parent Row */}
                <div className="flex items-center gap-3.5 px-4.5 py-3.5 select-none">
                  {/* Expand button */}
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(cat.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors shrink-0 cursor-pointer"
                      aria-label={expanded ? `Collapse ${cat.name}` : `Expand ${cat.name}`}
                    >
                      {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  ) : (
                    <span className="w-7 shrink-0 flex items-center justify-center text-ink-4">
                      •
                    </span>
                  )}

                  {/* Icon */}
                  <CategoryIcon
                    slug={cat.slug}
                    name={cat.name}
                    size={17}
                    boxSize="w-9 h-9"
                    rounded="rounded-xl"
                  />

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14.5px] font-bold text-ink">
                        {cat.name}
                      </span>
                      <span className="text-[12px] font-mono text-ink-3">
                        /{cat.slug}
                      </span>
                      {cat.is_active ? (
                        <Badge variant="success" size="xs" dot>Active</Badge>
                      ) : (
                        <Badge variant="default" size="xs">Inactive</Badge>
                      )}

                      {hasChildren && (
                        <span className="text-[11.5px] font-medium text-ink-3 bg-surface-2 px-2 py-0.5 rounded-md border border-border/60">
                          {kids.length} subcategor{kids.length === 1 ? 'y' : 'ies'}
                        </span>
                      )}

                      {Number(cat.ad_count) > 0 && (
                        <span className="text-[11.5px] font-medium text-brand bg-brand-light dark:bg-brand/15 px-2 py-0.5 rounded-md border border-brand/20">
                          {Number(cat.ad_count).toLocaleString()} ad{Number(cat.ad_count) === 1 ? '' : 's'}
                        </span>
                      )}

                      {Number(cat.profile_count) > 0 && (
                        <span className="text-[11.5px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-800/40">
                          {Number(cat.profile_count).toLocaleString()} profile{Number(cat.profile_count) === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>

                    {cat.description && (
                      <p className="text-[12px] text-ink-3 truncate max-w-xl mt-0.5">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Add Subcategory CTA */}
                    <button
                      type="button"
                      onClick={() => handleOpenCreate(cat.id)}
                      className="hidden sm:inline-flex items-center gap-1 h-8 px-2.5 text-[12px] font-medium text-ink-2 hover:text-brand hover:bg-brand-light dark:hover:bg-brand/15 border border-border rounded-xl transition-colors cursor-pointer"
                      title="Add subcategory under this category"
                    >
                      <FolderPlus size={13} />
                      <span>Subcategory</span>
                    </button>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl text-ink-3 hover:text-brand hover:bg-brand-light dark:hover:bg-brand/15 border border-transparent hover:border-brand/20 transition-all cursor-pointer"
                      aria-label={`Edit ${cat.name}`}
                      title="Edit category"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* On / Off Toggle Switch */}
                    <div className="px-1 flex items-center">
                      <ToggleSwitch
                        active={cat.is_active}
                        onToggle={() => handleToggle(cat)}
                        loading={isToggling}
                        label={`Toggle ${cat.name} active status`}
                      />
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => setDeleteCategory(cat)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl text-ink-3 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/40 transition-all cursor-pointer"
                      aria-label={`Delete ${cat.name}`}
                      title="Delete category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Subcategory Accordion */}
                {hasChildren && expanded && (
                  <div className="border-t border-border bg-canvas/60 px-4 py-2 space-y-1">
                    {kids.map((child, idx) => {
                      const isChildToggling = togglingId === child.id

                      return (
                        <div
                          key={child.id}
                          className="flex items-center gap-3 py-2 px-3 pl-8 rounded-xl hover:bg-surface transition-colors"
                        >
                          {/* Tree Guide Icon */}
                          <CategoryIconInline
                            slug={child.slug}
                            name={child.name}
                            size={14}
                            className="shrink-0 text-ink-3"
                          />

                          {/* Subcategory metadata */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13.5px] font-semibold text-ink">
                                {child.name}
                              </span>
                              <span className="text-[11.5px] font-mono text-ink-3">
                                /{child.slug}
                              </span>
                              {!child.is_active ? (
                                <Badge variant="default" size="xs">Inactive</Badge>
                              ) : (
                                <Badge variant="success" size="xs" dot>Active</Badge>
                              )}

                              {Number(child.ad_count) > 0 && (
                                <span className="text-[11px] font-medium text-ink-3 bg-surface-2 px-2 py-0.5 rounded-md border border-border/50">
                                  {Number(child.ad_count).toLocaleString()} ads
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Subcategory Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(child)}
                              className="h-7 w-7 flex items-center justify-center rounded-lg text-ink-3 hover:text-brand hover:bg-brand-light dark:hover:bg-brand/15 transition-all cursor-pointer"
                              title="Edit subcategory"
                              aria-label={`Edit ${child.name}`}
                            >
                              <Pencil size={13} />
                            </button>

                            <div className="px-1 flex items-center">
                              <ToggleSwitch
                                active={child.is_active}
                                onToggle={() => handleToggle(child)}
                                loading={isChildToggling}
                                label={`Toggle ${child.name} active status`}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => setDeleteCategory(child)}
                              className="h-7 w-7 flex items-center justify-center rounded-lg text-ink-3 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                              title="Delete subcategory"
                              aria-label={`Delete ${child.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Category Create / Edit Modal */}
      <CategoryModal
        isOpen={modalOpen}
        category={modalCategory}
        defaultParentId={defaultParentId}
        parents={topLevel}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        loading={createMut.isPending || updateMut.isPending}
        error={createMut.error || updateMut.error}
      />

      {/* Category Safe Delete Confirmation Dialog */}
      <DeleteCategoryDialog
        isOpen={Boolean(deleteCategory)}
        category={deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteMut.isPending}
      />
    </AdminLayout>
  )
}
