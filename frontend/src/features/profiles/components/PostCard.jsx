/**
 * PostCard.jsx — Facebook/social-style rich post entry.
 *
 * Features:
 *   - Clean social card header with post type, pin badge, and timestamp.
 *   - Expandable post description ("See more / See less").
 *   - Multi-image gallery layouts:
 *       * 1 photo: Full-bleed hero with dynamic aspect ratio.
 *       * 2 photos: 50/50 split column.
 *       * 3 photos: 1 large leading photo + 2 stacked photos.
 *       * 4+ photos: 2x2 grid with frosted "+N more" overlay on 4th photo.
 *   - Built-in full-screen Lightbox with keyboard navigation.
 */

import { useState, useEffect } from 'react'
import {
  Pin, ChevronLeft, ChevronRight, X, Maximize2,
} from 'lucide-react'

const TYPE_LABELS = {
  UPDATE:       'Update',
  ANNOUNCEMENT: 'Announcement',
  PROMOTION:    'Promotion',
  ACHIEVEMENT:  'Achievement',
  PROJECT:      'Project',
}

const TYPE_STYLES = {
  UPDATE:       'text-ink-3 bg-surface-2',
  ANNOUNCEMENT: 'text-blue-600 bg-blue-500/10',
  PROMOTION:    'text-brand bg-brand/10',
  ACHIEVEMENT:  'text-amber-700 bg-amber-500/10',
  PROJECT:      'text-violet-600 bg-violet-500/10',
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Recently'
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) {
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  }
  if (days === 1)  return 'Yesterday'
  if (days < 7)   return `${days}d ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function PostCard({ post }) {
  const [expanded, setExpanded] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  // Normalize image list
  const images = (post.images && post.images.length > 0)
    ? post.images
    : (post.primary_image ? [post.primary_image] : [])

  const typeLabel = TYPE_LABELS[post.post_type] || 'Update'
  const typeStyle = TYPE_STYLES[post.post_type] || TYPE_STYLES.UPDATE

  // Text length management
  const content = post.content || ''
  const isLong = content.length > 220
  const displayContent = (!expanded && isLong) ? `${content.slice(0, 220)}...` : content

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null)
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, images.length])

  return (
    <>
      <article
        className="
          bg-surface border border-border rounded-2xl overflow-hidden
          hover:border-brand-border/60 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]
          transition-all duration-200 ease-out flex flex-col
        "
      >
        {/* Header meta */}
        <div className="px-5 pt-4 pb-2.5 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${typeStyle}`}>
              {typeLabel}
            </span>
            {post.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                <Pin size={10} className="fill-brand text-brand" /> Pinned
              </span>
            )}
          </div>
          <span className="text-[12px] text-ink-4 tabular-nums">
            {timeAgo(post.published_at || post.created_at)}
          </span>
        </div>

        {/* Post Text & Title */}
        <div className="px-5 py-3.5 space-y-2">
          {post.title && (
            <h3 className="text-[15px] font-bold text-ink leading-snug tracking-tight">
              {post.title}
            </h3>
          )}
          <p className="text-[13.5px] text-ink-2 leading-relaxed whitespace-pre-line">
            {displayContent}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="ml-1.5 text-brand font-medium hover:underline inline-block focus:outline-none"
              >
                {expanded ? 'See less' : 'See more'}
              </button>
            )}
          </p>
        </div>

        {/* Facebook-style Multi-Image Layout */}
        {images.length > 0 && (
          <div className="mt-1 bg-surface-2 border-t border-border overflow-hidden">
            {/* 1 Photo */}
            {images.length === 1 && (
              <div
                className="relative max-h-[460px] overflow-hidden cursor-pointer group"
                onClick={() => setLightboxIndex(0)}
              >
                <img
                  src={images[0].image_url}
                  alt={images[0].alt_text || post.title || 'Post image'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm">
                    <Maximize2 size={14} />
                  </span>
                </div>
              </div>
            )}

            {/* 2 Photos */}
            {images.length === 2 && (
              <div className="grid grid-cols-2 gap-1 max-h-[360px]">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative aspect-square sm:aspect-[4/3] overflow-hidden cursor-pointer group"
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || 'Post photo'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm">
                        <Maximize2 size={13} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3 Photos */}
            {images.length === 3 && (
              <div className="grid grid-cols-3 gap-1 max-h-[380px]">
                <div
                  className="col-span-2 relative aspect-[4/3] overflow-hidden cursor-pointer group"
                  onClick={() => setLightboxIndex(0)}
                >
                  <img
                    src={images[0].image_url}
                    alt={images[0].alt_text || 'Lead photo'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm">
                      <Maximize2 size={13} />
                    </span>
                  </div>
                </div>

                <div className="col-span-1 grid grid-rows-2 gap-1">
                  {images.slice(1, 3).map((img, i) => (
                    <div
                      key={img.id || i}
                      className="relative h-full overflow-hidden cursor-pointer group"
                      onClick={() => setLightboxIndex(i + 1)}
                    >
                      <img
                        src={img.image_url}
                        alt={img.alt_text || 'Post photo'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4+ Photos */}
            {images.length >= 4 && (
              <div className="grid grid-cols-2 gap-1 max-h-[420px]">
                {images.slice(0, 4).map((img, idx) => {
                  const isFourthWithMore = idx === 3 && images.length > 4
                  const moreCount = images.length - 4

                  return (
                    <div
                      key={img.id || idx}
                      className="relative aspect-square sm:aspect-[4/3] overflow-hidden cursor-pointer group"
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <img
                        src={img.image_url}
                        alt={img.alt_text || 'Post photo'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {isFourthWithMore && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white">
                          <span className="text-[20px] sm:text-[24px] font-bold tracking-tight">
                            +{moreCount}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </article>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white animate-in fade-in duration-200 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[13px] text-white/70 font-medium">
              {lightboxIndex + 1} of {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Photo Navigation */}
          <div className="relative flex-1 flex items-center justify-center my-auto min-h-0">
            {images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                }
                className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            <img
              src={images[lightboxIndex].image_url}
              alt={images[lightboxIndex].alt_text || 'Post image preview'}
              className="max-h-[76vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
            />

            {images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                }
                className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                aria-label="Next"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {/* Caption / Description */}
          <div className="text-center max-w-2xl mx-auto z-10 pt-2">
            {images[lightboxIndex].alt_text ? (
              <p className="text-[13.5px] text-white/95 leading-relaxed font-normal bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl inline-block">
                {images[lightboxIndex].alt_text}
              </p>
            ) : post.title ? (
              <p className="text-[13px] text-white/70 italic">
                {post.title}
              </p>
            ) : (
              <div className="h-4" />
            )}
          </div>
        </div>
      )}
    </>
  )
}
