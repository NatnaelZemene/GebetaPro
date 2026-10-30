import { useState, useRef } from 'react'
import {
  Image as ImageIcon, UploadCloud, Trash2, Check, X,
  Star, ChevronLeft, ChevronRight, Eye, AlertCircle, Sparkles, Plus,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { NoProfileGuard } from '../../features/profiles/components/NoProfileGuard.jsx'
import {
  useMyGallery,
  useUploadGalleryImages,
  useUpdateGalleryImage,
  useDeleteGalleryImage,
} from '../../features/profiles/hooks/useProfile.js'

export default function GalleryPage() {
  const { data, isLoading, error } = useMyGallery()
  const uploadMutation = useUploadGalleryImages()
  const updateMutation = useUpdateGalleryImage()
  const deleteMutation = useDeleteGalleryImage()

  // Upload stage state
  const [selectedFiles, setSelectedFiles] = useState([])
  const [captions, setCaptions] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // Edit caption state
  const [editingImageId, setEditingImageId] = useState(null)
  const [editCaptionValue, setEditCaptionValue] = useState('')

  // Lightbox modal state
  const [lightboxIndex, setLightboxIndex] = useState(null)

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const images = data?.images || []
  const usage = data?.usage || {
    count: images.length,
    max_allowed: 10,
    is_limit_reached: false,
    plan_name: 'Standard',
  }

  // Handle file selection
  const handleFiles = (incomingFiles) => {
    const valid = Array.from(incomingFiles).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(f.type.toLowerCase()),
    )
    if (!valid.length) return

    const remainingSlots = Math.max(0, usage.max_allowed - (images.length + selectedFiles.length))
    const toAdd = valid.slice(0, remainingSlots)

    if (toAdd.length < valid.length) {
      alert(`Plan limit: You can only add ${remainingSlots} more photo(s).`)
    }

    const newFiles = [...selectedFiles, ...toAdd]
    setSelectedFiles(newFiles)
    setCaptions((prev) => [...prev, ...toAdd.map(() => '')])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removePendingFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
    setCaptions((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleCaptionChange = (idx, value) => {
    setCaptions((prev) => {
      const copy = [...prev]
      copy[idx] = value
      return copy
    })
  }

  const handleUploadSubmit = async () => {
    if (!selectedFiles.length) return
    try {
      await uploadMutation.mutateAsync({
        files: selectedFiles,
        captions: captions.map((c) => c.trim()),
      })
      setSelectedFiles([])
      setCaptions([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to upload images')
    }
  }

  const handleSaveCaption = async (id) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { alt_text: editCaptionValue.trim() },
      })
      setEditingImageId(null)
      setEditCaptionValue('')
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update description')
    }
  }

  const handleSetPrimary = async (img) => {
    try {
      await updateMutation.mutateAsync({
        id: img.id,
        data: { is_primary: true },
      })
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to set cover photo')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirmId(null)
      if (lightboxIndex !== null) setLightboxIndex(null)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete photo')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Gallery">
        <div className="space-y-4 max-w-4xl">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Gallery">
        <NoProfileGuard><></></NoProfileGuard>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gallery">
      <NoProfileGuard>
        <div className="space-y-6 max-w-4xl">
          {/* Header & Quota */}
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-[18px] sm:text-[20px] font-bold text-ink tracking-tight">
                    Photo Gallery
                  </h1>
                  <Badge variant={usage.is_limit_reached ? 'warning' : 'default'} size="sm">
                    {usage.plan_name}
                  </Badge>
                </div>
                <p className="text-[13px] text-ink-3">
                  Upload photos with descriptions to showcase your work, storefront, or products.
                </p>
              </div>

              {/* Quota counter */}
              <div className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 min-w-[180px]">
                <div className="flex items-center justify-between text-[12px] mb-1.5">
                  <span className="text-ink-3 font-medium">Storage Quota</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {usage.count} / {usage.max_allowed}
                  </span>
                </div>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      usage.is_limit_reached ? 'bg-amber-500' : 'bg-brand'
                    }`}
                    style={{
                      width: `${Math.min(100, (usage.count / Math.max(1, usage.max_allowed)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {usage.is_limit_reached && (
              <div className="mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[12.5px]">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  You have reached your gallery limit of {usage.max_allowed} photos. Upgrade your plan to unlock more uploads.
                </span>
              </div>
            )}
          </div>

          {/* Upload Area */}
          {!usage.is_limit_reached && (
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  ${
                    isDragging
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:border-brand-border hover:bg-surface-2/50'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-3 text-ink-3">
                  <UploadCloud size={22} className="text-brand" />
                </div>
                <p className="text-[14px] font-semibold text-ink mb-1">
                  Click or drag photos here to upload
                </p>
                <p className="text-[12px] text-ink-4">
                  Supports JPG, PNG, WEBP up to 5 MB each
                </p>
              </div>

              {/* Pending Upload Previews with Caption Inputs */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-ink">
                      Selected Photos ({selectedFiles.length})
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleUploadSubmit}
                      loading={uploadMutation.isPending}
                    >
                      <Check size={14} className="mr-1.5" /> Upload all
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-2 relative group"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-16 h-16 rounded-lg object-cover shrink-0 border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-ink truncate mb-1">
                            {file.name}
                          </p>
                          <input
                            type="text"
                            value={captions[idx] || ''}
                            onChange={(e) => handleCaptionChange(idx, e.target.value)}
                            placeholder="Add a description or caption..."
                            className="w-full text-[12px] bg-surface border border-border rounded-lg px-2.5 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePendingFile(idx)}
                          className="text-ink-4 hover:text-red-500 p-1 rounded transition-colors"
                          title="Remove"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gallery Photos Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-ink">
                Uploaded Photos ({images.length})
              </h2>
            </div>

            {images.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto mb-3 text-ink-4">
                  <ImageIcon size={22} />
                </div>
                <h3 className="text-[15px] font-semibold text-ink mb-1">No photos in gallery yet</h3>
                <p className="text-[13px] text-ink-3 max-w-sm mx-auto mb-4">
                  Add photos of your business, services, work, or products to build trust with customers.
                </p>
                {!usage.is_limit_reached && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus size={14} className="mr-1.5" /> Upload first photo
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="group bg-surface border border-border hover:border-brand-border rounded-xl overflow-hidden transition-all duration-200 shadow-sm flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/3] bg-surface-2 overflow-hidden">
                      <img
                        src={img.image_url}
                        alt={img.alt_text || 'Gallery photo'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                        onClick={() => setLightboxIndex(idx)}
                      />

                      {/* Primary badge */}
                      {img.is_primary && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white text-[10.5px] font-semibold flex items-center gap-1 shadow-sm">
                          <Star size={11} className="fill-amber-400 text-amber-400" /> Cover Photo
                        </div>
                      )}

                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className="w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center hover:scale-110 transition-transform shadow"
                          title="Preview full size"
                        >
                          <Eye size={14} />
                        </button>
                        {!img.is_primary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(img)}
                            className="w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center hover:scale-110 transition-transform shadow"
                            title="Set as Cover Photo"
                          >
                            <Star size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(img.id)}
                          className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow"
                          title="Delete photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Caption area */}
                    <div className="p-3 flex-1 flex flex-col justify-between border-t border-border bg-surface">
                      {editingImageId === img.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editCaptionValue}
                            onChange={(e) => setEditCaptionValue(e.target.value)}
                            rows={2}
                            placeholder="Write a description for this photo..."
                            className="w-full text-[12px] bg-surface-2 border border-border rounded-lg p-2 text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                            autoFocus
                          />
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => {
                                setEditingImageId(null)
                                setEditCaptionValue('')
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleSaveCaption(img.id)}
                              loading={updateMutation.isPending}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer group/desc"
                          onClick={() => {
                            setEditingImageId(img.id)
                            setEditCaptionValue(img.alt_text || '')
                          }}
                        >
                          <p className="text-[12.5px] text-ink leading-relaxed line-clamp-2">
                            {img.alt_text ? (
                              img.alt_text
                            ) : (
                              <span className="text-ink-4 italic group-hover/desc:text-brand transition-colors">
                                + Add description / caption
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-2xl max-w-sm w-full p-5 shadow-2xl">
              <h3 className="text-[16px] font-bold text-ink mb-1.5">Delete photo?</h3>
              <p className="text-[13px] text-ink-3 mb-5">
                This photo will be removed from your profile gallery and cannot be recovered.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(deleteConfirmId)}
                  loading={deleteMutation.isPending}
                >
                  Delete photo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Full-screen Lightbox Modal */}
        {lightboxIndex !== null && images[lightboxIndex] && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="flex items-center justify-between z-10">
              <span className="text-[13px] text-white/70 font-medium">
                {lightboxIndex + 1} of {images.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Image with Arrows */}
            <div className="relative flex-1 flex items-center justify-center my-auto min-h-0">
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                  }
                  className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              <img
                src={images[lightboxIndex].image_url}
                alt={images[lightboxIndex].alt_text || 'Full preview'}
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              />

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>

            {/* Bottom Caption */}
            <div className="text-center max-w-xl mx-auto z-10 pt-2">
              {images[lightboxIndex].alt_text && (
                <p className="text-[14px] text-white/90 leading-relaxed font-normal bg-black/40 backdrop-blur-sm px-4 py-2 rounded-xl inline-block">
                  {images[lightboxIndex].alt_text}
                </p>
              )}
            </div>
          </div>
        )}
      </NoProfileGuard>
    </DashboardLayout>
  )
}
