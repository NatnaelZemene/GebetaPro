/**
 * AdminUsersPage.jsx — User management with search, filters, and actions.
 *
 * Accessibility improvements:
 * - ActionMenu (kebab menu): Escape closes it and returns focus to trigger.
 *   ArrowDown/ArrowUp navigate between menu items (ARIA APG menu pattern).
 *   Focus moves to first menu item on open.
 * - DeleteConfirmDialog: uses useFocusTrap for focus containment; Escape
 *   cancels; role="dialog" aria-modal="true" aria-labelledby wired.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Shield, ShieldOff, UserCheck, UserX, Trash2,
  MoreHorizontal, BadgeCheck, AlertTriangle, Users, UserPlus,
  Copy, Check, ExternalLink,
} from 'lucide-react'
import { AdminLayout }  from '../../components/layout/AdminLayout.jsx'
import { Badge }        from '../../components/ui/Badge.jsx'
import { CategoryIconInline } from '../../features/profiles/components/CategoryIcon.jsx'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import {
  AdminTable, SearchBar, FilterSelect,
  Pagination, PageHeader, StatCard,
} from '../../features/admin/components/AdminTable.jsx'
import {
  useAdminUsers, useAdminStats, useSuspendUser, useActivateUser,
  usePromoteUser, useDemoteUser, useDeleteUser,
} from '../../features/admin/hooks/useAdmin.js'

/* ── Badges ────────────────────────────────────────────────────────────── */
const STATUS_BADGE = {
  ACTIVE:    <Badge variant="success" dot size="xs">Active</Badge>,
  SUSPENDED: <Badge variant="danger"  dot size="xs">Suspended</Badge>,
  DELETED:   <Badge variant="default" dot size="xs">Deleted</Badge>,
}
const ROLE_BADGE = {
  ADMIN: <Badge variant="dark"    size="xs">Admin</Badge>,
  USER:  <Badge variant="default" size="xs">User</Badge>,
}
const PLAN_BADGE = {
  FREE:     <Badge variant="default" size="xs">Free</Badge>,
  BASIC:    <Badge variant="info"    size="xs">Basic</Badge>,
  PRO:      <Badge variant="brand"   size="xs">Pro</Badge>,
  BUSINESS: <Badge variant="dark"    size="xs">Business</Badge>,
}

/* ── Filter options ────────────────────────────────────────────────────── */
const STATUS_OPTS = [
  { value: 'ACTIVE',    label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
]
const ROLE_OPTS = [
  { value: 'USER',  label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
]

/* ── Avatar component ─────────────────────────────────────────────────── */
function UserAvatar({ avatarUrl, email, name }) {
  const [imgError, setImgError] = useState(false)
  const initial = (name?.[0] || email?.[0] || '?').toUpperCase()

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt=""
        onError={() => setImgError(true)}
        className="w-8 h-8 rounded-full object-cover shrink-0 border border-border/80 shadow-2xs"
      />
    )
  }

  return (
    <div className="w-8 h-8 rounded-full bg-brand-light dark:bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
      <span className="text-[12px] font-bold text-brand leading-none">{initial}</span>
    </div>
  )
}

/* ── Inline 1-click copy button ────────────────────────────────────────── */
function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e) {
    e.stopPropagation()
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard!' : label}
      className="p-1 rounded text-ink-4 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
    >
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
    </button>
  )
}

/* ── Delete confirmation dialog ────────────────────────────────────────── */
function DeleteConfirmDialog({ user, onConfirm, onCancel, loading }) {
  // Focus trap — Escape fires onCancel, focus returns to trigger on unmount
  const dialogRef = useFocusTrap(true, onCancel)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        aria-describedby="delete-user-desc"
        className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-danger-bg flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-danger" aria-hidden="true" />
          </div>
          <div>
            <h2 id="delete-user-title" className="text-[15px] font-semibold text-ink mb-1">
              Delete user?
            </h2>
            <p id="delete-user-desc" className="text-[13px] text-ink-2 leading-relaxed">
              This will permanently delete{' '}
              <strong className="text-ink">{user.email}</strong> and all their data.
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          {/* Cancel first so it receives initial focus from useFocusTrap */}
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-[13px] font-medium text-ink-2 bg-surface-2 hover:bg-surface-3 border border-border rounded-lg transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {loading ? 'Deleting…' : <><Trash2 size={13} aria-hidden="true" /> Delete user</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Kebab action menu ─────────────────────────────────────────────────── */
function ActionMenu({ user, onSuspend, onActivate, onPromote, onDemote, onDelete, loading }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef    = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  // Escape closes menu and returns focus to trigger
  // ArrowDown/ArrowUp navigate menu items
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      const items = menuRef.current
        ? Array.from(menuRef.current.querySelectorAll('[role="menuitem"]:not([disabled])'))
        : []
      const idx = items.indexOf(document.activeElement)

      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = idx < items.length - 1 ? idx + 1 : 0
        items[next]?.focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = idx > 0 ? idx - 1 : items.length - 1
        items[prev]?.focus()
      } else if (e.key === 'Home') {
        e.preventDefault()
        items[0]?.focus()
      } else if (e.key === 'End') {
        e.preventDefault()
        items[items.length - 1]?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  // Move focus to first menu item when menu opens
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      const first = menuRef.current?.querySelector('[role="menuitem"]:not([disabled])')
      first?.focus()
    }, 0)
    return () => clearTimeout(timer)
  }, [open])

  function closeAndFocus() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        aria-label={`Actions for ${user.email}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="
          h-8 w-8 flex items-center justify-center rounded-lg
          border border-transparent
          text-ink-3 hover:text-ink hover:border-border hover:bg-surface-2
          disabled:opacity-40 transition-all duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
        "
      >
        <MoreHorizontal size={15} aria-hidden="true" />
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-10" onClick={closeAndFocus} aria-hidden="true" />
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${user.email}`}
            className="
              absolute right-0 mt-1 z-20
              bg-surface border border-border rounded-xl
              shadow-[0_8px_32px_rgba(0,0,0,0.12)]
              py-1 min-w-[160px]
              animate-fade-in
            "
          >
            {user.status === 'SUSPENDED' ? (
              <button
                role="menuitem"
                tabIndex={0}
                onClick={() => { onActivate(user.id); closeAndFocus() }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-ink hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:bg-surface-2"
              >
                <UserCheck size={13} className="text-success" aria-hidden="true" />
                {/* ✓ prefix so Activate is not communicated by green icon color alone */}
                ✓ Activate user
              </button>
            ) : (
              <button
                role="menuitem"
                tabIndex={0}
                onClick={() => { onSuspend(user.id); closeAndFocus() }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-danger hover:bg-danger-bg transition-colors focus-visible:outline-none focus-visible:bg-danger-bg"
              >
                <UserX size={13} aria-hidden="true" />
                Suspend user
              </button>
            )}

            <div className="h-px bg-border mx-2 my-1" role="separator" aria-hidden="true" />

            {user.role === 'USER' ? (
              <button
                role="menuitem"
                tabIndex={0}
                onClick={() => { onPromote(user.id); closeAndFocus() }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-ink hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:bg-surface-2"
              >
                <Shield size={13} className="text-brand" aria-hidden="true" /> Make admin
              </button>
            ) : (
              <button
                role="menuitem"
                tabIndex={0}
                onClick={() => { onDemote(user.id); closeAndFocus() }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-ink-2 hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:bg-surface-2"
              >
                <ShieldOff size={13} className="text-ink-3" aria-hidden="true" /> Remove admin
              </button>
            )}

            <div className="h-px bg-border mx-2 my-1" role="separator" aria-hidden="true" />

            <button
              role="menuitem"
              tabIndex={0}
              onClick={() => { onDelete(user); closeAndFocus() }}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-danger hover:bg-danger-bg transition-colors focus-visible:outline-none focus-visible:bg-danger-bg"
            >
              <Trash2 size={13} aria-hidden="true" /> Delete user
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function AdminUsersPage() {
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [role,   setRole]   = useState(searchParams.get('role')   || '')
  const [page,   setPage]   = useState(1)
  const [debSearch, setDebSearch] = useState(search)

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debSearch, status, role])

  const params = {
    page, page_size: 20,
    ...(debSearch && { search: debSearch }),
    ...(status    && { status }),
    ...(role      && { role }),
  }

  const { data, isLoading, error } = useAdminUsers(params)
  const { data: statsData, isLoading: statsLoading } = useAdminStats()
  const suspend  = useSuspendUser()
  const activate = useActivateUser()
  const promote  = usePromoteUser()
  const demote   = useDemoteUser()
  const deleteUser = useDeleteUser()

  const [confirmDelete, setConfirmDelete] = useState(null) // holds the user object to delete

  const anyMutating = suspend.isPending || activate.isPending || promote.isPending || demote.isPending || deleteUser.isPending
  const mutationError = suspend.error || activate.error || promote.error || demote.error || deleteUser.error

  const users      = data?.users      || []
  const pagination = data?.pagination || null

  const totalMembers = Number(statsData?.total_users ?? pagination?.total ?? users.length)
  const activeMembers = Number(statsData?.active_users ?? 0)
  const suspendedMembers = Number(statsData?.suspended_users ?? 0)
  const newMembers30d = Number(statsData?.new_users_30d ?? 0)
  const activeRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 100

  // Quick segment tab selection
  const activeSegment = role === 'ADMIN' ? 'admins' : status === 'ACTIVE' ? 'active' : status === 'SUSPENDED' ? 'suspended' : 'all'

  function handleSelectSegment(seg) {
    setPage(1)
    if (seg === 'all') {
      setStatus('')
      setRole('')
    } else if (seg === 'active') {
      setStatus('ACTIVE')
      setRole('')
    } else if (seg === 'suspended') {
      setStatus('SUSPENDED')
      setRole('')
    } else if (seg === 'admins') {
      setStatus('')
      setRole('ADMIN')
    }
  }

  const SEGMENTS = [
    { id: 'all', label: 'All Users', count: totalMembers },
    { id: 'active', label: 'Active', count: activeMembers },
    { id: 'suspended', label: 'Suspended', count: suspendedMembers },
    { id: 'admins', label: 'Admins' },
  ]

  const columns = [
    {
      key: 'user',
      label: 'User & Profile',
      render: u => (
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar avatarUrl={u.avatar_url} email={u.email} name={u.display_name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[13.5px] font-semibold text-ink leading-snug truncate">
                {u.display_name || u.email || '—'}
              </span>
              {(u.email_verified_at || u.profile_verified) && (
                <BadgeCheck size={13} className="text-brand shrink-0" aria-label="Verified" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
              <span className="truncate max-w-[150px]">{u.email}</span>
              <CopyButton text={u.email} label="Copy email" />
              {u.phone && <span className="text-ink-4">· {u.phone}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Sector',
      render: u => (
        u.category_name ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-2 dark:bg-surface-2/60 text-[12px] font-medium text-ink max-w-[150px] truncate border border-border/60">
            <CategoryIconInline slug={u.category_slug} name={u.category_name} size={11} />
            <span className="truncate">{u.category_name}</span>
          </span>
        ) : (
          <span className="text-[12px] text-ink-4">—</span>
        )
      ),
      className: 'hidden md:table-cell',
      cellClass:  'hidden md:table-cell',
    },
    {
      key: 'city',
      label: 'City',
      render: u => (
        u.city ? (
          <span className="text-[12.5px] text-ink font-medium">{u.city}</span>
        ) : (
          <span className="text-[12px] text-ink-4">—</span>
        )
      ),
      className: 'hidden lg:table-cell',
      cellClass:  'hidden lg:table-cell',
    },
    {
      key: 'plan_name',
      label: 'Plan',
      render: u => PLAN_BADGE[u.plan_name] || <Badge variant="default" size="xs">{u.plan_name || 'Free'}</Badge>,
      className: 'hidden sm:table-cell',
      cellClass:  'hidden sm:table-cell',
    },
    {
      key: 'status',
      label: 'Status',
      render: u => STATUS_BADGE[u.status] || <Badge variant="default" size="xs">{u.status}</Badge>,
    },
    {
      key: 'role',
      label: 'Role',
      render: u => ROLE_BADGE[u.role] || <Badge variant="default" size="xs">{u.role}</Badge>,
      className: 'hidden xl:table-cell',
      cellClass:  'hidden xl:table-cell',
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: u => (
        <span className="text-[12px] text-ink-3 tabular-nums">
          {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
      className: 'hidden 2xl:table-cell',
      cellClass:  'hidden 2xl:table-cell',
    },
    {
      key: 'actions',
      label: '',
      render: u => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          {u.slug && (
            <a
              href={`/p/${u.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View live public profile"
              className="p-1.5 rounded-lg text-ink-3 hover:text-brand hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <ActionMenu
            user={u}
            onSuspend={id => suspend.mutate(id)}
            onActivate={id => activate.mutate(id)}
            onPromote={id => promote.mutate(id)}
            onDemote={id => demote.mutate(id)}
            onDelete={user => setConfirmDelete(user)}
            loading={anyMutating}
          />
        </div>
      ),
      cellClass: 'text-right',
      className: 'text-right',
    },
  ]

  return (
    <AdminLayout title="Users">
      <PageHeader
        title="Users"
        subtitle="Manage and monitor platform members, advertisers, and account activity."
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statsLoading && isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4">
              <Skeleton className="h-3 w-20 rounded mb-3" />
              <Skeleton className="h-7 w-14 rounded" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Total Members"
              value={totalMembers.toLocaleString()}
              sub="Platform accounts"
              icon={<Users size={16} />}
              iconBg="bg-brand-light dark:bg-brand/10"
              iconColor="text-brand"
            />
            <StatCard
              label="Active Accounts"
              value={activeMembers.toLocaleString()}
              sub={`${activeRate}% active rate`}
              icon={<UserCheck size={16} />}
              iconBg="bg-emerald-50 dark:bg-emerald-950/40"
              iconColor="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Suspended Accounts"
              value={suspendedMembers.toLocaleString()}
              sub="Moderation watch"
              icon={<UserX size={16} />}
              iconBg={suspendedMembers > 0 ? "bg-amber-50 dark:bg-amber-950/40" : "bg-surface-2"}
              iconColor={suspendedMembers > 0 ? "text-amber-600 dark:text-amber-400" : "text-ink-3"}
            />
            <StatCard
              label="New Sign-ups (30d)"
              value={newMembers30d.toLocaleString()}
              sub="Recent platform growth"
              icon={<UserPlus size={16} />}
              iconBg="bg-blue-50 dark:bg-blue-950/40"
              iconColor="text-blue-600 dark:text-blue-400"
            />
          </>
        )}
      </div>

      {/* Segment filter pills */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-2/60 dark:bg-surface-2/30 border border-border/70 rounded-xl w-fit mb-4 overflow-x-auto max-w-full">
        {SEGMENTS.map(tab => {
          const isCurrent = activeSegment === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectSegment(tab.id)}
              className={`
                px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap
                flex items-center gap-2
                ${isCurrent
                  ? 'bg-surface dark:bg-canvas text-ink shadow-xs font-semibold'
                  : 'text-ink-3 hover:text-ink hover:bg-surface/50'
                }
              `}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`
                    px-1.5 py-0.2 rounded-md text-[11px] font-semibold tabular-nums
                    ${isCurrent ? 'bg-brand/10 text-brand' : 'bg-surface-2 text-ink-3'}
                  `}
                >
                  {tab.count.toLocaleString()}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by email or phone…"
            className="w-full sm:flex-1 sm:max-w-xs"
          />
          <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTS} placeholder="All statuses" />
          <FilterSelect value={role}   onChange={setRole}   options={ROLE_OPTS}   placeholder="All roles" />
          {(search || status || role) && (
            <button
              onClick={() => { setSearch(''); setStatus(''); setRole('') }}
              className="text-[12.5px] text-ink-3 hover:text-danger transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Mutation error */}
        {mutationError && (
          <div className="bg-danger-bg border border-red-200 rounded-lg px-4 py-2.5 text-[13px] text-danger">
            {mutationError?.response?.data?.message || 'Action failed. Please try again.'}
          </div>
        )}

        {/* Table */}
        <AdminTable
          columns={columns}
          rows={users}
          loading={isLoading}
          error={error}
          emptyMessage="No users match your current filters."
        />

        <Pagination pagination={pagination} onPage={setPage} />
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <DeleteConfirmDialog
          user={confirmDelete}
          loading={deleteUser.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteUser.mutate(confirmDelete.id, {
              onSuccess: () => setConfirmDelete(null),
            })
          }}
        />
      )}
    </AdminLayout>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}
