/**
 * UserDetailDrawer.jsx — Modern Slide-over Inspection Sheet for Admin User Management.
 *
 * Modeled after Stripe & Clerk user inspection drawers:
 *   - Slide-in from right with backdrop blur and escape dismissal.
 *   - Comprehensive profile identity, category badge, business hours/socials.
 *   - Subscription details, active ads, and account audit timestamps.
 *   - Direct administrative control actions (Suspend/Activate, Role toggle, Delete).
 */
import { useEffect, useState } from 'react'
import {
  X, Shield, ShieldOff, UserCheck, UserX, Trash2,
  ExternalLink, Copy, Check, BadgeCheck, Mail, Phone,
  Calendar, Layers, MapPin, Globe, Send, MessageCircle,
  CreditCard, Sparkles, Building2, User
} from 'lucide-react'
import { Badge } from '../../../components/ui/Badge.jsx'
import { CategoryIcon } from '../../profiles/components/CategoryIcon.jsx'
import { useAdminUserDetail } from '../hooks/useAdmin.js'
import { useFocusTrap } from '../../../hooks/useFocusTrap.js'

export function UserDetailDrawer({
  user,
  onClose,
  onSuspend,
  onActivate,
  onPromote,
  onDemote,
  onDelete,
  loading = false,
}) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  // Fetch full details if user ID is available
  const { data: detailData, isLoading: detailLoading } = useAdminUserDetail(user?.id)
  const fullUser = detailData || user

  // Accessible focus trap
  const trapRef = useFocusTrap(Boolean(user), onClose)

  if (!user) return null

  function handleCopy(text, type) {
    if (!text) return
    navigator.clipboard?.writeText(text)
    if (type === 'id') {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 1800)
    } else {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 1800)
    }
  }

  const initial = (fullUser.display_name?.[0] || fullUser.email?.[0] || '?').toUpperCase()
  const isSuspended = fullUser.status === 'SUSPENDED'
  const isAdmin = fullUser.role === 'ADMIN'

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end"
      aria-labelledby="user-drawer-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Slide-over panel */}
      <div
        ref={trapRef}
        className="
          w-full max-w-md sm:max-w-lg bg-surface border-l border-border h-full flex flex-col shadow-2xl
          animate-in slide-in-from-right duration-200
        "
      >
        {/* ── Drawer Header ────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 border-b border-border bg-surface-2/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {fullUser.avatar_url ? (
              <img
                src={fullUser.avatar_url}
                alt=""
                className="w-13 h-13 rounded-2xl object-cover shrink-0 border border-border shadow-xs"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-brand-light dark:bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
                <span className="text-[18px] font-bold text-brand">{initial}</span>
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h2 id="user-drawer-title" className="text-[17px] font-bold text-ink truncate leading-tight">
                  {fullUser.display_name || fullUser.email}
                </h2>
                {(fullUser.email_verified_at || fullUser.profile_verified) && (
                  <BadgeCheck size={16} className="text-brand shrink-0" aria-label="Verified user" />
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isSuspended ? (
                  <Badge variant="danger" dot size="xs">Suspended</Badge>
                ) : (
                  <Badge variant="success" dot size="xs">Active</Badge>
                )}
                {isAdmin ? (
                  <Badge variant="dark" size="xs">Admin</Badge>
                ) : (
                  <Badge variant="default" size="xs">User</Badge>
                )}
                {fullUser.plan_name && (
                  <Badge variant="brand" size="xs">{fullUser.plan_name}</Badge>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Close user details"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Drawer Body ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin">
          {/* Quick ID bar */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2/60 border border-border/80 text-[12px]">
            <span className="text-ink-3 font-mono truncate mr-2">ID: {fullUser.id}</span>
            <button
              type="button"
              onClick={() => handleCopy(fullUser.id, 'id')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-surface text-ink-2 hover:text-ink transition-colors font-medium cursor-pointer shrink-0"
            >
              {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-[11.5px] font-bold text-ink-4 uppercase tracking-wider mb-2.5">
              Contact & Authentication
            </h3>
            <div className="space-y-2 rounded-xl border border-border p-3.5 bg-surface">
              <div className="flex items-center justify-between text-[13px]">
                <span className="flex items-center gap-2 text-ink-3">
                  <Mail size={13} /> Email
                </span>
                <div className="flex items-center gap-1.5 font-medium text-ink">
                  <span>{fullUser.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(fullUser.email, 'email')}
                    className="p-0.5 text-ink-3 hover:text-ink"
                    title="Copy email"
                  >
                    {copiedEmail ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {fullUser.phone && (
                <div className="flex items-center justify-between text-[13px] pt-2 border-t border-border/50">
                  <span className="flex items-center gap-2 text-ink-3">
                    <Phone size={13} /> Phone
                  </span>
                  <span className="font-medium text-ink">{fullUser.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Directory Profile Section (if available) */}
          {fullUser.slug && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[11.5px] font-bold text-ink-4 uppercase tracking-wider">
                  Directory Profile
                </h3>
                <a
                  href={`/p/${fullUser.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
                >
                  <span>View live</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4 bg-surface">
                {fullUser.category_name && (
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon
                      slug={fullUser.category_slug}
                      name={fullUser.category_name}
                      size={14}
                      boxSize="w-7 h-7"
                      rounded="rounded-lg"
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-ink leading-tight">{fullUser.category_name}</p>
                      <p className="text-[11px] text-ink-3">{fullUser.profile_type || 'Profile'}</p>
                    </div>
                  </div>
                )}

                {fullUser.headline && (
                  <p className="text-[12.5px] text-ink-2 italic border-l-2 border-brand/40 pl-2.5 py-0.5">
                    &ldquo;{fullUser.headline}&rdquo;
                  </p>
                )}

                {fullUser.city && (
                  <div className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
                    <MapPin size={13} className="text-brand shrink-0" />
                    <span>{fullUser.city}{fullUser.region ? `, ${fullUser.region}` : ''}</span>
                  </div>
                )}

                {/* Socials / Website */}
                {(fullUser.website_url || fullUser.telegram_username || fullUser.whatsapp) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50 flex-wrap">
                    {fullUser.website_url && (
                      <a
                        href={fullUser.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-2 text-[11px] text-ink-2 hover:text-brand"
                      >
                        <Globe size={11} /> Website
                      </a>
                    )}
                    {fullUser.telegram_username && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-2 text-[11px] text-ink-2">
                        <Send size={11} /> @{fullUser.telegram_username}
                      </span>
                    )}
                    {fullUser.whatsapp && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-2 text-[11px] text-ink-2">
                        <MessageCircle size={11} /> {fullUser.whatsapp}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subscription & Activity */}
          <div>
            <h3 className="text-[11.5px] font-bold text-ink-4 uppercase tracking-wider mb-2.5">
              Subscription & Content
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl border border-border bg-surface">
                <span className="text-[11px] text-ink-3 block mb-1">Plan Tier</span>
                <span className="text-[14px] font-bold text-ink">{fullUser.plan_name || 'Free Tier'}</span>
                {fullUser.price_etb != null && (
                  <span className="text-[11px] text-ink-3 block mt-0.5">{fullUser.price_etb} ETB / mo</span>
                )}
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface">
                <span className="text-[11px] text-ink-3 block mb-1">Published Ads</span>
                <span className="text-[14px] font-bold text-ink">{fullUser.ad_count || 0}</span>
                {fullUser.published_ad_count > 0 && (
                  <span className="text-[11px] text-emerald-600 block mt-0.5">{fullUser.published_ad_count} active live</span>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps / Auditing */}
          <div>
            <h3 className="text-[11.5px] font-bold text-ink-4 uppercase tracking-wider mb-2.5">
              Account Timestamps
            </h3>
            <div className="space-y-1.5 text-[12px] text-ink-3">
              <div className="flex justify-between py-1">
                <span>Joined</span>
                <span className="text-ink font-medium">
                  {fullUser.created_at ? new Date(fullUser.created_at).toLocaleString('en-GB') : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/40">
                <span>Email Verified</span>
                <span className="text-ink font-medium">
                  {fullUser.email_verified_at ? new Date(fullUser.email_verified_at).toLocaleDateString('en-GB') : 'Not verified'}
                </span>
              </div>
              {fullUser.updated_at && (
                <div className="flex justify-between py-1 border-t border-border/40">
                  <span>Last Updated</span>
                  <span className="text-ink font-medium">
                    {new Date(fullUser.updated_at).toLocaleString('en-GB')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Drawer Footer Actions ────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface-2/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isSuspended ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => onActivate?.(fullUser.id)}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <UserCheck size={14} />
                <span>Activate User</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => onSuspend?.(fullUser.id)}
                className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <UserX size={14} />
                <span>Suspend User</span>
              </button>
            )}

            {isAdmin ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => onDemote?.(fullUser.id)}
                className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-2 border border-border text-ink-2 hover:text-ink text-[12.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ShieldOff size={13} />
                <span>Demote</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => onPromote?.(fullUser.id)}
                className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-2 border border-border text-ink-2 hover:text-ink text-[12.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Shield size={13} className="text-brand" />
                <span>Make Admin</span>
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => onDelete?.(fullUser)}
            className="p-2 rounded-lg text-danger hover:bg-danger-bg transition-colors cursor-pointer"
            title="Delete user"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
