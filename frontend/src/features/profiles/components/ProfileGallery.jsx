import { useState, useEffect } from 'react'
import { Image as ImageIcon, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react'

export function ProfileGallery({ images = [] }) {
  const [activeModalIndex, setActiveModalIndex] = useState(null)

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeModalIndex === null) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveModalIndex(null)
      } else if (e.key === 'ArrowLeft') {
        setActiveModalIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
      } else if (e.key === 'ArrowRight') {
        setActiveModalIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModalIndex, images.length])

  if (!images.length) {
    return (
      <div className="py-12 text-center bg-surface border border-border rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center mx-auto mb-3">
          <ImageIcon size={18} className="text-ink-4" aria-hidden="true" />
        </div>
        <p className="text-[13.5px] text-ink-3">No photos in the gallery yet.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            onClick={() => setActiveModalIndex(idx)}
            className="group relative aspect-square bg-surface-2 border border-border rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:border-brand-border transition-all duration-200"
          >
            <img
              src={img.image_url}
              alt={img.alt_text || `Gallery photo ${idx + 1}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Subtle Gradient & Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 text-white">
              <div className="flex justify-end">
                <span className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90">
                  <Maximize2 size={12} />
                </span>
              </div>
              {img.alt_text && (
                <p className="text-[12px] font-medium leading-snug line-clamp-2 text-white/95 drop-shadow">
                  {img.alt_text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeModalIndex !== null && images[activeModalIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white animate-in fade-in duration-200 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[13px] text-white/70 font-medium">
              {activeModalIndex + 1} of {images.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveModalIndex(null)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Close photo view"
            >
              <X size={18} />
            </button>
          </div>

          {/* Photo Center Display */}
          <div className="relative flex-1 flex items-center justify-center my-auto min-h-0">
            {images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveModalIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                }
                className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            <img
              src={images[activeModalIndex].image_url}
              alt={images[activeModalIndex].alt_text || 'Photo preview'}
              className="max-h-[76vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
            />

            {images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveModalIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                }
                className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {/* Caption */}
          <div className="text-center max-w-2xl mx-auto z-10 pt-2">
            {images[activeModalIndex].alt_text ? (
              <p className="text-[13.5px] text-white/95 leading-relaxed font-normal bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl inline-block">
                {images[activeModalIndex].alt_text}
              </p>
            ) : (
              <div className="h-4" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
