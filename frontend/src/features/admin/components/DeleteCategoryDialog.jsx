/**
 * DeleteCategoryDialog.jsx — Confirmation dialog for deleting categories.
 * Features dependency checks (ads, profiles, subcategories) to prevent accidental data loss.
 */
import { useEffect, useState } from 'react'
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '../../../components/ui/Button.jsx'
import { CategoryIcon } from '../../profiles/components/CategoryIcon.jsx'
import { useFocusTrap } from '../../../hooks/useFocusTrap.js'
import * as api from '../../../services/admin.service.js'

export function DeleteCategoryDialog({
  isOpen,
  category,
  onClose,
  onConfirm,
  loading = false,
}) {
  const dialogRef = useFocusTrap(isOpen, onClose)
  const [checking, setChecking] = useState(false)
  const [depData, setDepData] = useState(null)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!isOpen || !category) {
      setDepData(null)
      setFetchError(null)
      return
    }

    let isMounted = true
    setChecking(true)
    setFetchError(null)

    api.getCategoryDependencies(category.id)
      .then(res => {
        if (isMounted) {
          setDepData(res)
          setChecking(false)
        }
      })
      .catch(err => {
        if (isMounted) {
          setFetchError(err?.response?.data?.message || 'Could not verify category dependencies.')
          setChecking(false)
        }
      })

    return () => { isMounted = false }
  }, [isOpen, category])

  if (!isOpen || !category) return null

  const counts = depData?.counts || {
    subcategories_count: Number(category.subcategory_count || 0),
    ads_count: Number(category.ad_count || 0),
    profiles_count: Number(category.profile_count || 0),
    services_count: 0,
  }

  const adsCount = Number(counts.ads_count) || 0
  const profilesCount = Number(counts.profiles_count) || 0
  const subcategoriesCount = Number(counts.subcategories_count) || 0
  const servicesCount = Number(counts.services_count) || 0

  const hasBlockingDependencies = adsCount > 0 || profilesCount > 0 || servicesCount > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden"
      >
        {/* Header with Icon */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            hasBlockingDependencies ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
          }`}>
            {hasBlockingDependencies ? (
              <ShieldAlert size={24} />
            ) : (
              <Trash2 size={24} />
            )}
          </div>
          <div>
            <h2 id="delete-category-title" className="text-[17px] font-bold text-ink">
              {hasBlockingDependencies ? 'Category Cannot Be Deleted' : 'Delete Category?'}
            </h2>
            <p className="text-[12.5px] text-ink-3 mt-0.5">
              Permanently remove taxonomy item from the database.
            </p>
          </div>
        </div>

        {/* Category info chip */}
        <div className="bg-canvas border border-border/80 rounded-xl p-3 flex items-center gap-3 mb-4">
          <CategoryIcon
            slug={category.slug}
            name={category.name}
            size={18}
            boxSize="w-9 h-9"
            rounded="rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] font-bold text-ink truncate">{category.name}</h4>
            <p className="text-[12px] text-ink-3 font-mono">/{category.slug}</p>
          </div>
        </div>

        {/* Loading state for dependencies */}
        {checking && (
          <div className="py-4 text-center text-[12.5px] text-ink-3">
            Checking associated advertisements and profiles...
          </div>
        )}

        {/* Error fetching dependencies */}
        {fetchError && (
          <div className="bg-danger-bg border border-red-200 rounded-xl p-3 text-[12px] text-danger mb-4">
            {fetchError}
          </div>
        )}

        {/* Dependency Breakdown */}
        {!checking && (
          <div className="space-y-3 mb-5">
            {hasBlockingDependencies ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 space-y-2">
                <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-400">
                  This category is currently in use across the platform:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[12px] text-ink">
                  {adsCount > 0 && (
                    <div className="bg-surface px-2.5 py-1.5 rounded-lg border border-border">
                      📢 <strong>{adsCount}</strong> active ad(s)
                    </div>
                  )}
                  {profilesCount > 0 && (
                    <div className="bg-surface px-2.5 py-1.5 rounded-lg border border-border">
                      🏢 <strong>{profilesCount}</strong> business profile(s)
                    </div>
                  )}
                  {servicesCount > 0 && (
                    <div className="bg-surface px-2.5 py-1.5 rounded-lg border border-border">
                      🛠️ <strong>{servicesCount}</strong> offered service(s)
                    </div>
                  )}
                  {subcategoriesCount > 0 && (
                    <div className="bg-surface px-2.5 py-1.5 rounded-lg border border-border">
                      📁 <strong>{subcategoriesCount}</strong> subcategory(s)
                    </div>
                  )}
                </div>
                <p className="text-[11.5px] text-ink-3 pt-1">
                  Deleting this category would break linked live advertisements and business listings. To disable it without deleting, <strong>turn the category switch OFF</strong> instead.
                </p>
              </div>
            ) : (
              <div className="bg-canvas border border-border rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-[12.5px] text-success font-semibold">
                  <CheckCircle2 size={15} /> Safe to delete
                </div>
                <p className="text-[12.5px] text-ink-2 leading-relaxed">
                  No active advertisements or business profiles are linked to <strong>{category.name}</strong>.
                  {subcategoriesCount > 0 && (
                    <span> Any empty subcategories ({subcategoriesCount}) will also be cleaned up.</span>
                  )}
                </p>
                <p className="text-[11.5px] text-red-500 font-medium">
                  This action is irreversible.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-2.5 justify-end pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-[13px] font-medium text-ink-2 bg-surface-2 hover:bg-surface-3 border border-border rounded-xl transition-colors cursor-pointer"
          >
            {hasBlockingDependencies ? 'Close' : 'Cancel'}
          </button>
          {!hasBlockingDependencies && (
            <Button
              type="button"
              variant="danger"
              size="md"
              loading={loading}
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 size={14} className="mr-1.5" /> Permanently Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
