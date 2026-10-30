import { useState, useRef } from 'react'
import {
  Plus, Pencil, Trash2, FileText, Pin, Image as ImageIcon,
  X, UploadCloud, ChevronRight,
} from 'lucide-react'
import { DashboardLayout } from '../../components/layout/DashboardLayout.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Skeleton } from '../../components/ui/Skeleton.jsx'
import { FormField, Input, Textarea, Select } from '../../components/ui/FormField.jsx'
import { NoProfileGuard } from '../../features/profiles/components/NoProfileGuard.jsx'
import {
  useMyPosts, useCreatePost, useUpdatePost, useDeletePost, useUploadPostImages,
} from '../../features/profiles/hooks/useProfile.js'

const POST_TYPE_OPTIONS = [
  { value: 'UPDATE', label: 'Update' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'PROJECT', label: 'Project' },
]

const POST_TYPE_BADGE = {
  UPDATE: 'default',
  ANNOUNCEMENT: 'info',
  PROMOTION: 'success',
  ACHIEVEMENT: 'warning',
  PROJECT: 'default',
}

const emptyForm = {
  title: '',
  content: '',
  post_type: 'UPDATE',
  visibility: 'PUBLIC',
  is_published: true,
  is_pinned: false,
}

function PostForm({ initial = emptyForm, existingImages = [], onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial)
  const [selectedFiles, setSelectedFiles] = useState([])
  const fileInputRef = useRef(null)

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [k]: val }))
  }

  const handleFiles = (incomingFiles) => {
    const valid = Array.from(incomingFiles).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(f.type.toLowerCase()),
    )
    if (!valid.length) return
    const currentTotal = (existingImages?.length || 0) + selectedFiles.length
    const remaining = Math.max(0, 5 - currentTotal)
    const toAdd = valid.slice(0, remaining)
    if (toAdd.length < valid.length) {
      alert(`Limit: You can attach up to 5 photos per post.`)
    }
    setSelectedFiles((prev) => [...prev, ...toAdd])
  }

  const removePendingFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.content.trim()) return
    const payload = {
      ...form,
      title: form.title || null,
    }
    onSave(payload, selectedFiles)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Title" hint="Optional — leave blank for a quick social update">
        <Input
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. Weekend special offer or exciting update!"
        />
      </FormField>

      <FormField label="Description / Content" required>
        <Textarea
          value={form.content}
          onChange={set('content')}
          rows={4}
          required
          placeholder="What's happening? Share news, offers, or stories with your customers..."
        />
      </FormField>

      {/* Photo Attachment Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[12.5px] font-semibold text-ink flex items-center gap-1.5">
            <ImageIcon size={14} className="text-brand" /> Attached Photos (Max 5)
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[12px] font-medium text-brand hover:underline inline-flex items-center gap-1"
          >
            <Plus size={13} /> Add photos
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Existing Images Display */}
        {existingImages && existingImages.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {existingImages.map((img, i) => (
              <div key={img.id || i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-surface-2 group">
                <img src={img.image_url} alt="attached" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center font-medium py-0.5">
                  Saved
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pending Images Display */}
        {selectedFiles.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand bg-surface-2 group">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePendingFile(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          !existingImages?.length && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-border hover:border-brand-border rounded-xl p-3.5 text-center cursor-pointer bg-surface-2/40 hover:bg-surface-2 transition-colors"
            >
              <p className="text-[12px] text-ink-3">
                Click to attach photos to this post (Facebook style)
              </p>
            </div>
          )
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Post Type">
          <Select value={form.post_type} onChange={set('post_type')}>
            {POST_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Visibility">
          <Select value={form.visibility} onChange={set('visibility')}>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private (only you)</option>
          </Select>
        </FormField>
      </div>

      <div className="flex items-center gap-6 pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-[13px] font-medium text-ink">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={set('is_published')}
            className="w-4 h-4 rounded accent-brand"
          />
          Publish immediately
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-[13px] font-medium text-ink">
          <input
            type="checkbox"
            checked={form.is_pinned}
            onChange={set('is_pinned')}
            className="w-4 h-4 rounded accent-brand"
          />
          Pin to top
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" loading={loading}>
          Save & Publish
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default function PostsPage() {
  const { data, isLoading, error } = useMyPosts()
  const createMutation = useCreatePost()
  const updateMutation = useUpdatePost()
  const deleteMutation = useDeletePost()
  const uploadImagesMutation = useUploadPostImages()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const posts = data?.posts || []

  const handleCreate = async (payload, attachedFiles = []) => {
    setIsSubmitting(true)
    try {
      const created = await createMutation.mutateAsync(payload)
      if (attachedFiles.length > 0 && created?.id) {
        await uploadImagesMutation.mutateAsync({
          id: created.id,
          files: attachedFiles,
        })
      }
      setShowForm(false)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (id, payload, attachedFiles = []) => {
    setIsSubmitting(true)
    try {
      await updateMutation.mutateAsync({ id, data: payload })
      if (attachedFiles.length > 0) {
        await uploadImagesMutation.mutateAsync({
          id,
          files: attachedFiles,
        })
      }
      setEditingId(null)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirm(null)
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete post')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Posts">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Posts">
        <NoProfileGuard><></></NoProfileGuard>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Posts">
      <NoProfileGuard>
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold text-ink tracking-tight">Posts & Updates</h1>
              <p className="text-[12.5px] text-ink-3">
                {posts.length} post{posts.length !== 1 ? 's' : ''} published on your profile
              </p>
            </div>
            {!showForm && (
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                <Plus size={14} className="mr-1" />
                New post
              </Button>
            )}
          </div>

          {showForm && (
            <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-[15px] font-bold text-ink mb-4">Create New Post</h3>
              <PostForm
                onSave={handleCreate}
                onCancel={() => setShowForm(false)}
                loading={isSubmitting || createMutation.isPending}
              />
            </div>
          )}

          {posts.length === 0 && !showForm ? (
            <div className="bg-surface border border-border rounded-2xl p-10 text-center">
              <FileText size={32} className="mx-auto text-ink-3 mb-3" />
              <p className="text-[14px] font-semibold text-ink mb-1">No posts yet</p>
              <p className="text-[13px] text-ink-3 mb-4">
                Share updates, photos, announcements, and promotions with your visitors.
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
                <Plus size={14} className="mr-1" />
                Create your first post
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const postImages = post.images || (post.primary_image ? [post.primary_image] : [])

                return (
                  <div key={post.id}>
                    {editingId === post.id ? (
                      <div className="bg-surface border border-brand rounded-2xl p-5 shadow-md">
                        <h3 className="text-[15px] font-bold text-ink mb-4">Edit Post</h3>
                        <PostForm
                          initial={{
                            title: post.title || '',
                            content: post.content || '',
                            post_type: post.post_type || 'UPDATE',
                            visibility: post.visibility || 'PUBLIC',
                            is_published: post.is_published || false,
                            is_pinned: post.is_pinned || false,
                          }}
                          existingImages={postImages}
                          onSave={(payload, files) => handleUpdate(post.id, payload, files)}
                          onCancel={() => setEditingId(null)}
                          loading={isSubmitting || updateMutation.isPending}
                        />
                      </div>
                    ) : (
                      <div className="bg-surface border border-border hover:border-brand-border/60 rounded-xl p-4 transition-all duration-200">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              {post.is_pinned && <Pin size={11} className="text-brand shrink-0" />}
                              <Badge
                                variant={POST_TYPE_BADGE[post.post_type] || 'default'}
                                size="xs"
                              >
                                {post.post_type}
                              </Badge>
                              {!post.is_published && (
                                <Badge variant="default" size="xs">
                                  Draft
                                </Badge>
                              )}
                              {post.published_at && (
                                <span className="text-[11.5px] text-ink-3">
                                  {new Date(post.published_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {post.title && (
                              <p className="text-[14px] font-semibold text-ink mb-1">
                                {post.title}
                              </p>
                            )}
                            <p className="text-[13px] text-ink-2 line-clamp-3 mb-2.5 leading-relaxed">
                              {post.content}
                            </p>

                            {/* Attached photos strip */}
                            {postImages.length > 0 && (
                              <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                                {postImages.map((img, idx) => (
                                  <img
                                    key={img.id || idx}
                                    src={img.image_url}
                                    alt="thumbnail"
                                    className="w-14 h-14 rounded-lg object-cover border border-border shrink-0 bg-surface-2"
                                  />
                                ))}
                                <span className="text-[11.5px] text-ink-4 pl-1">
                                  {postImages.length} photo{postImages.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setEditingId(post.id)}
                              aria-label={`Edit post${post.title ? ': ' + post.title : ''}`}
                              className="p-1.5 text-ink-3 hover:text-ink hover:bg-surface-2 rounded-lg transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(post.id)}
                              aria-label={`Delete post${post.title ? ': ' + post.title : ''}`}
                              className="p-1.5 text-ink-3 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {deleteConfirm === post.id && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between gap-3 mt-1 text-red-600">
                        <p className="text-[13px] font-medium">Delete this post?</p>
                        <div className="flex gap-2">
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => handleDelete(post.id)}
                            loading={deleteMutation.isPending}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </NoProfileGuard>
    </DashboardLayout>
  )
}
