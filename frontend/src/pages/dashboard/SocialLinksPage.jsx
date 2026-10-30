/**
 * SocialLinksPage.jsx — Dashboard page to manage social media and web links.
 *
 * Upgraded to ultra-modern SaaS design aesthetics:
 *   - Custom floating popover dropdown with brand icons, subtitles, and search
 *   - Contextual URL prefixes (e.g. instagram.com/, t.me/, wa.me/)
 *   - Quick-add dock for instant one-click platform insertion
 *   - Live preview link verification
 *   - High-contrast enterprise design system
 */
import { useState } from 'react'
import { Plus, Trash2, ExternalLink, Check, Share2, AlertCircle, Link as LinkIcon, Sparkles } from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { NoProfileGuard } from '../../features/profiles/components/NoProfileGuard.jsx'
import { useBusinessDetails, useUpsertBusinessDetails } from '../../features/profiles/hooks/useProfile.js'
import {
  PlatformDropdown,
  PLATFORMS,
  PLATFORM_MAP,
  PlatformIconBadge,
} from '../../features/profiles/components/PlatformDropdown.jsx'

export default function SocialLinksPage() {
  const { data, isLoading } = useBusinessDetails()
  const upsertMutation = useUpsertBusinessDetails()

  const [links, setLinks] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  if (data && links === null) {
    setLinks(data.social_links?.length > 0
      ? data.social_links.map(l => ({ platform: l.platform, url: l.url }))
      : []
    )
  }

  const currentLinks = links ?? []
  const usedPlatforms = currentLinks.map(l => l.platform)

  function addLink(platformValue) {
    if (currentLinks.length >= 10) return
    const used = new Set(usedPlatforms)
    const next = platformValue || PLATFORMS.find(p => !used.has(p.value))?.value || 'OTHER'
    setLinks([...currentLinks, { platform: next, url: '' }])
    setError('')
  }

  function updateLink(i, field, value) {
    setLinks(currentLinks.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
    setError('')
  }

  function removeLink(i) {
    setLinks(currentLinks.filter((_, idx) => idx !== i))
    setError('')
  }

  // Build live preview URL for a link
  function getPreviewUrl(link) {
    if (!link.url || !link.url.trim()) return null
    const platformInfo = PLATFORM_MAP[link.platform] || PLATFORM_MAP.OTHER
    return platformInfo.toUrl(link.url)
  }

  async function handleSave(e) {
    e.preventDefault()
    const validLinks = currentLinks
      .filter(l => l.url && l.url.trim())
      .map(l => {
        const platformInfo = PLATFORM_MAP[l.platform] || PLATFORM_MAP.OTHER
        return {
          platform: l.platform,
          url: platformInfo.toUrl(l.url),
        }
      })

    if (validLinks.length === 0 && currentLinks.length > 0) {
      setError('Please enter at least one URL or username for your links.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await upsertMutation.mutateAsync({ social_links: validLinks })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save social links. Please check the URLs and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Social Links">
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-10 w-48 rounded-xl" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </DashboardLayout>
    )
  }

  // Popular platforms not yet added for Quick Add Dock
  const availableQuickPicks = PLATFORMS.filter(p => !usedPlatforms.includes(p.value) && p.value !== 'OTHER').slice(0, 6)

  return (
    <DashboardLayout title="Social Links">
      <NoProfileGuard>
        <div className="max-w-2xl space-y-6">

          {/* Page Introduction Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-surface border border-border rounded-2xl shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-surface-2 border border-border/60 text-ink">
                  <Share2 size={16} />
                </span>
                <h2 className="text-[16px] font-bold text-ink tracking-tight">Social & Web Links</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-2 text-ink-3 border border-border/50">
                  {currentLinks.length} / 10
                </span>
              </div>
              <p className="text-[12.5px] text-ink-2 mt-1.5 leading-relaxed">
                Connect your social media, messaging apps, and website. They appear as branded contact buttons on your public profile.
              </p>
            </div>

            {currentLinks.length < 10 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => addLink()}
                className="shrink-0 self-start sm:self-center"
              >
                Add Link
              </Button>
            )}
          </div>

          {/* Quick-Add Dock for unused platforms */}
          {availableQuickPicks.length > 0 && currentLinks.length < 10 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" /> Quick Add Channels
              </span>
              <div className="flex flex-wrap gap-2">
                {availableQuickPicks.map(p => {
                  const Icon = p.icon
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => addLink(p.value)}
                      className="
                        inline-flex items-center gap-2 px-3 py-1.5
                        bg-surface hover:bg-surface-2
                        border border-border hover:border-border-strong
                        rounded-xl text-[12.5px] font-medium text-ink
                        transition-all duration-150 cursor-pointer shadow-2xs active:scale-95
                      "
                    >
                      <Icon size={14} style={{ color: p.color }} />
                      <span>{p.label}</span>
                      <Plus size={12} className="text-ink-3 ml-0.5" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Empty State */}
            {currentLinks.length === 0 && (
              <div className="bg-surface border-2 border-dashed border-border rounded-2xl p-10 text-center space-y-4">
                <div className="flex flex-wrap justify-center gap-2.5 max-w-sm mx-auto">
                  {PLATFORMS.slice(0, 8).map(p => (
                    <PlatformIconBadge key={p.value} platform={p.value} size={20} className="shadow-2xs" />
                  ))}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-ink">No social links configured</h3>
                  <p className="text-[13px] text-ink-3 mt-1 max-w-md mx-auto">
                    Add Instagram, Telegram, WhatsApp, TikTok, LinkedIn, or your website to help clients connect with you seamlessly.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={() => addLink('INSTAGRAM')}
                  className="mx-auto"
                >
                  Add Your First Link
                </Button>
              </div>
            )}

            {/* List of configured link cards */}
            <div className="space-y-3.5">
              {currentLinks.map((link, i) => {
                const platformInfo = PLATFORM_MAP[link.platform] || PLATFORM_MAP.OTHER
                const previewUrl = getPreviewUrl(link)

                return (
                  <div
                    key={i}
                    className="
                      bg-surface border border-border
                      hover:border-border-strong hover:shadow-xs
                      rounded-2xl p-4 sm:p-5
                      transition-all duration-200 space-y-3 group
                    "
                  >
                    {/* Top Row: Platform dropdown + Actions */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <PlatformDropdown
                          value={link.platform}
                          onChange={(newPlatform) => updateLink(i, 'platform', newPlatform)}
                          usedPlatforms={usedPlatforms}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {previewUrl && (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              inline-flex items-center gap-1.5 px-2.5 py-1.5
                              text-[11.5px] font-semibold text-ink-2 hover:text-ink
                              bg-surface-2 hover:bg-border/60 rounded-xl
                              border border-border/60 transition-colors
                            "
                            title="Open link in a new tab"
                          >
                            <span>Test link</span>
                            <ExternalLink size={12} className="shrink-0" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => removeLink(i)}
                          className="
                            p-2 text-ink-3 hover:text-danger hover:bg-danger/10
                            rounded-xl transition-all duration-150 shrink-0
                          "
                          title="Remove platform"
                          aria-label={`Remove ${platformInfo.label} link`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Handle or URL Input with Prefix */}
                    <div className="space-y-1.5">
                      <div className="
                        flex items-center
                        bg-canvas border border-border rounded-xl
                        focus-within:border-ink dark:focus-within:border-white
                        focus-within:ring-2 focus-within:ring-ink/10 dark:focus-within:ring-white/10
                        transition-all overflow-hidden
                      ">
                        <span className="px-3 py-2 bg-surface-2/60 border-r border-border text-[12px] font-mono text-ink-3 select-none shrink-0">
                          {platformInfo.prefix}
                        </span>
                        <input
                          type="text"
                          value={link.url}
                          onChange={e => {
                            // Strip prefix if user pastes full URL containing it
                            let val = e.target.value
                            if (val.startsWith(platformInfo.prefix)) {
                              val = val.slice(platformInfo.prefix.length)
                            } else if (val.startsWith(`https://${platformInfo.prefix}`)) {
                              val = val.slice(`https://${platformInfo.prefix}`.length)
                            } else if (val.startsWith(`http://${platformInfo.prefix}`)) {
                              val = val.slice(`http://${platformInfo.prefix}`.length)
                            }
                            updateLink(i, 'url', val)
                          }}
                          placeholder={platformInfo.placeholder}
                          className="
                            w-full h-10 px-3 bg-transparent
                            text-[13.5px] font-medium text-ink
                            placeholder:text-ink-3 outline-none
                          "
                        />
                      </div>

                      <p className="text-[11px] text-ink-3 leading-snug px-1">
                        {platformInfo.hint}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3.5 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-2 text-[13px] text-danger">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Bottom Actions Bar */}
            {currentLinks.length > 0 && (
              <div className="pt-2 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="
                      inline-flex items-center justify-center gap-2
                      h-10 px-6 rounded-xl
                      bg-ink text-canvas hover:opacity-90 active:scale-[0.98]
                      font-semibold text-[13.5px] tracking-tight
                      shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50
                    "
                  >
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-canvas border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save links'
                    )}
                  </button>

                  {saved && (
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                      <Check size={16} className="stroke-[3]" /> Saved successfully
                    </span>
                  )}
                </div>

                {currentLinks.length < 10 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Plus size={13} />}
                    onClick={() => addLink()}
                  >
                    Add another
                  </Button>
                )}
              </div>
            )}
          </form>
        </div>
      </NoProfileGuard>
    </DashboardLayout>
  )
}
