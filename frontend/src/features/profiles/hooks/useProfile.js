/**
 * useProfile.js — React Query hooks for the profiles module.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import * as api from '../../../services/profiles.service.js'

const KEYS = {
  myProfile:    ['profile', 'mine'],
  completion:   ['profile', 'completion'],
  publicProfile: (slug) => ['profiles', 'public', slug],
  publicServices: (slug, p) => ['profiles', 'public', slug, 'services', p],
  publicPortfolio: (slug, p) => ['profiles', 'public', slug, 'portfolio', p],
  publicPosts: (slug, p) => ['profiles', 'public', slug, 'posts', p],
  publicAchievements: (slug) => ['profiles', 'public', slug, 'achievements'],
  publicReviews: (slug, p) => ['profiles', 'public', slug, 'reviews', p],
  search: (params) => ['profiles', 'search', params],
  slugCheck: (slug) => ['profiles', 'slug-check', slug],
  myServices:  (p) => ['profile', 'services', p],
  myPortfolio: (p) => ['profile', 'portfolio', p],
  myPosts:     (p) => ['profile', 'posts', p],
  myAchievements: ['profile', 'achievements'],
  myGallery:   ['profile', 'gallery'],
  publicGallery: (slug) => ['profiles', 'public', slug, 'gallery'],
  businessDetails: ['profile', 'business'],
  analytics:   ['profile', 'analytics'],
}

const isAuthed = () => !!localStorage.getItem('accessToken')

// ── Own profile ────────────────────────────────────────────────────────────────

export function useMyProfile() {
  return useQuery({
    queryKey: KEYS.myProfile,
    queryFn:  api.getMyProfile,
    enabled:  isAuthed(),
    retry: false,
    staleTime: 0,
  })
}

export function useProfileAnalytics() {
  return useQuery({
    queryKey: KEYS.analytics,
    queryFn:  api.getMyProfileAnalytics,
    enabled:  isAuthed(),
    staleTime: 60 * 1000,
  })
}

export function useProfileCompletion() {
  return useQuery({
    queryKey: KEYS.completion,
    queryFn:  api.getProfileCompletion,
    enabled:  isAuthed(),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.updateMyProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myProfile })
      qc.invalidateQueries({ queryKey: KEYS.completion })
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

export function useCreateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.createProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myProfile })
    },
  })
}

// ── Profile images ─────────────────────────────────────────────────────────────

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file) => api.uploadAvatar(file),
    onSuccess: (data) => {
      if (data?.avatar_url) {
        qc.setQueryData(KEYS.myProfile, (old) => old ? { ...old, avatar_url: data.avatar_url } : old)
      }
      qc.invalidateQueries({ queryKey: KEYS.myProfile, refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['profiles'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: KEYS.completion })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gebetapro:profile_updated', { detail: { type: 'avatar', url: data?.avatar_url } }))
      }
    },
  })
}

export function useDeleteAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.deleteAvatar(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: KEYS.myProfile })
      const prev = qc.getQueryData(KEYS.myProfile)
      qc.setQueryData(KEYS.myProfile, (old) => old ? { ...old, avatar_url: null } : old)
      return { prev }
    },
    onError: (err, variables, context) => {
      if (context?.prev) qc.setQueryData(KEYS.myProfile, context.prev)
    },
    onSuccess: () => {
      qc.setQueryData(KEYS.myProfile, (old) => old ? { ...old, avatar_url: null } : old)
      qc.invalidateQueries({ queryKey: KEYS.myProfile, refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['profiles'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: KEYS.completion })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gebetapro:profile_updated', { detail: { type: 'avatar', url: null } }))
      }
    },
  })
}

export function useUploadCover() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file) => api.uploadCover(file),
    onSuccess: (data) => {
      if (data?.cover_url) {
        qc.setQueryData(KEYS.myProfile, (old) => old ? { ...old, cover_url: data.cover_url } : old)
      }
      qc.invalidateQueries({ queryKey: KEYS.myProfile, refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['profiles'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: KEYS.completion })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gebetapro:profile_updated', { detail: { type: 'cover', url: data?.cover_url } }))
      }
    },
  })
}

export function useDeleteCover() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.deleteCover(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: KEYS.myProfile })
      const prev = qc.getQueryData(KEYS.myProfile)
      qc.setQueryData(KEYS.myProfile, (old) => old ? { ...old, cover_url: null } : old)
      return { prev }
    },
    onError: (err, variables, context) => {
      if (context?.prev) qc.setQueryData(KEYS.myProfile, context.prev)
    },
    onSuccess: () => {
      qc.setQueryData(KEYS.myProfile, (old) => old ? { ...old, cover_url: null } : old)
      qc.invalidateQueries({ queryKey: KEYS.myProfile, refetchType: 'all' })
      qc.invalidateQueries({ queryKey: ['profiles'], refetchType: 'all' })
      qc.invalidateQueries({ queryKey: KEYS.completion })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gebetapro:profile_updated', { detail: { type: 'cover', url: null } }))
      }
    },
  })
}

// ── Business details ───────────────────────────────────────────────────────────

export function useBusinessDetails() {
  return useQuery({
    queryKey: KEYS.businessDetails,
    queryFn:  api.getBusinessDetails,
    enabled:  isAuthed(),
  })
}

export function useUpsertBusinessDetails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.upsertBusinessDetails(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.businessDetails })
      qc.invalidateQueries({ queryKey: KEYS.myProfile })
    },
  })
}

// ── Public profile ─────────────────────────────────────────────────────────────

export function usePublicProfile(slug) {
  return useQuery({
    queryKey: KEYS.publicProfile(slug),
    queryFn:  () => api.getPublicProfile(slug),
    enabled:  !!slug,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
    networkMode: 'offlineFirst',
  })
}

export function usePublicServices(slug, page = 1) {
  return useQuery({
    queryKey: KEYS.publicServices(slug, page),
    queryFn:  () => api.getPublicServices(slug, { page }),
    enabled:  !!slug,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
    networkMode: 'offlineFirst',
  })
}

export function usePublicPortfolio(slug, page = 1) {
  return useQuery({
    queryKey: KEYS.publicPortfolio(slug, page),
    queryFn:  () => api.getPublicPortfolio(slug, { page }),
    enabled:  !!slug,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
    networkMode: 'offlineFirst',
  })
}

export function usePublicPosts(slug, page = 1) {
  return useQuery({
    queryKey: KEYS.publicPosts(slug, page),
    queryFn:  () => api.getPublicPosts(slug, { page }),
    enabled:  !!slug,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
    networkMode: 'offlineFirst',
  })
}

export function usePublicAchievements(slug) {
  return useQuery({
    queryKey: KEYS.publicAchievements(slug),
    queryFn:  () => api.getPublicAchievements(slug),
    enabled:  !!slug,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
    networkMode: 'offlineFirst',
  })
}

export function useProfileSearch(params) {
  return useQuery({
    queryKey: KEYS.search(params),
    queryFn:  () => api.searchProfiles(params),
    enabled:  true,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    networkMode: 'offlineFirst',
  })
}

export function useSlugCheck(slug) {
  return useQuery({
    queryKey: KEYS.slugCheck(slug),
    queryFn:  () => api.checkSlugAvailability(slug),
    enabled:  slug?.length >= 2,
    staleTime: 5000,
  })
}

// ── Services ───────────────────────────────────────────────────────────────────

export function useMyServices(page = 1) {
  return useQuery({
    queryKey: KEYS.myServices(page),
    queryFn:  () => api.getMyServices({ page }),
    enabled:  isAuthed(),
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.createService(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'services'] }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateService(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'services'] }),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.deleteService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'services'] }),
  })
}

// ── Portfolio ──────────────────────────────────────────────────────────────────

export function useMyPortfolio(page = 1) {
  return useQuery({
    queryKey: KEYS.myPortfolio(page),
    queryFn:  () => api.getMyPortfolio({ page }),
    enabled:  isAuthed(),
  })
}

export function useCreatePortfolioItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.createPortfolioItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'portfolio'] })
      qc.invalidateQueries({ queryKey: KEYS.completion })
    },
  })
}

export function useUpdatePortfolioItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updatePortfolioItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'portfolio'] }),
  })
}

export function useDeletePortfolioItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.deletePortfolioItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'portfolio'] }),
  })
}

// ── Posts ──────────────────────────────────────────────────────────────────────

export function useMyPosts(page = 1) {
  return useQuery({
    queryKey: KEYS.myPosts(page),
    queryFn:  () => api.getMyPosts({ page }),
    enabled:  isAuthed(),
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.createPost(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'posts'] }),
  })
}

export function useUpdatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updatePost(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'posts'] }),
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'posts'] }),
  })
}

export function useUploadPostImages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, files }) => api.uploadPostImages(id, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'posts'] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

// ── Achievements ───────────────────────────────────────────────────────────────

export function useMyAchievements() {
  return useQuery({
    queryKey: KEYS.myAchievements,
    queryFn:  api.getMyAchievements,
    enabled:  isAuthed(),
  })
}

export function useCreateAchievement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.createAchievement(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.myAchievements }),
  })
}

export function useUpdateAchievement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateAchievement(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.myAchievements }),
  })
}

export function useDeleteAchievement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.deleteAchievement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.myAchievements }),
  })
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export function usePublicReviews(slug, page = 1) {
  return useQuery({
    queryKey: KEYS.publicReviews(slug, page),
    queryFn: () => api.getPublicReviews(slug, { page }),
    enabled: !!slug,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    networkMode: 'offlineFirst',
  })
}

export function useSubmitReview(slug) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.submitReview(slug, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles', 'public', slug, 'reviews'] })
      qc.invalidateQueries({ queryKey: KEYS.publicProfile(slug) })
    },
  })
}

export function useUpdateReview(slug) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, data }) => api.updateReview(slug, reviewId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles', 'public', slug, 'reviews'] })
    },
  })
}

export function useDeleteReview(slug) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId) => api.deleteReview(slug, reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles', 'public', slug, 'reviews'] })
      qc.invalidateQueries({ queryKey: KEYS.publicProfile(slug) })
    },
  })
}

// ── Review replies + notifications ─────────────────────────────────────────────

export function useAddReviewReply(slug) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, body }) => api.addReviewReply(slug, reviewId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles', 'public', slug, 'reviews'] })
    },
  })
}

export function useDeleteReviewReply(slug) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reviewId) => api.deleteReviewReply(slug, reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles', 'public', slug, 'reviews'] })
    },
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: api.getNotifications,
    enabled: isAuthed(),
    refetchInterval: 30000, // poll every 30s
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

// ── Verification workflow hooks ────────────────────────────────────────────────

export function useMyVerificationDocument() {
  return useQuery({
    queryKey: ['profile', 'verification-document'],
    queryFn:  api.getMyVerificationDocument,
    enabled:  isAuthed(),
    retry: false,
  })
}

export function useUploadVerificationDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, onProgress }) =>
      api.uploadVerificationDocument(file, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'verification-document'] })
    },
  })
}

export function useSubmitForReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.submitProfileForReview(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myProfile })
      qc.invalidateQueries({ queryKey: KEYS.completion })
    },
  })
}

export function useResubmitForReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.resubmitProfileForReview(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myProfile })
    },
  })
}

export function usePublishProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.publishProfile(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myProfile })
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

export function useUnpublishProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.unpublishProfile(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myProfile })
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

// ── Gallery Hooks ─────────────────────────────────────────────────────────────

export function useMyGallery() {
  return useQuery({
    queryKey: KEYS.myGallery,
    queryFn:  api.getMyGallery,
    enabled:  isAuthed(),
  })
}

export function useUploadGalleryImages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ files, captions }) => api.uploadGalleryImages(files, captions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myGallery })
      qc.invalidateQueries({ queryKey: KEYS.myProfile })
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

export function useUpdateGalleryImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateGalleryImage(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myGallery })
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

export function useDeleteGalleryImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      try {
        return await api.deleteGalleryImage(id)
      } catch (err) {
        // If image was already deleted on server (404), treat as successful purge
        if (err?.response?.status === 404) {
          return { deleted: true, id }
        }
        throw err
      }
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.myGallery })
      const prev = qc.getQueryData(KEYS.myGallery)

      if (prev && Array.isArray(prev.images)) {
        const nextImages = prev.images.filter((img) => img.id !== id)
        qc.setQueryData(KEYS.myGallery, {
          ...prev,
          images: nextImages,
          usage: prev.usage
            ? {
                ...prev.usage,
                count: nextImages.length,
                is_limit_reached: false,
              }
            : undefined,
        })
      }

      return { prev }
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        qc.setQueryData(KEYS.myGallery, context.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.myGallery })
      qc.invalidateQueries({ queryKey: KEYS.myProfile })
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

export function usePublicGallery(slug) {
  return useQuery({
    queryKey: KEYS.publicGallery(slug),
    queryFn:  () => api.getPublicGallery(slug),
    enabled:  !!slug,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
    networkMode: 'offlineFirst',
  })
}

