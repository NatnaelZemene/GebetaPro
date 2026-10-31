/**
 * useCategories.js — React Query hook for fetching the category tree.
 * Moved here from the advertisements feature (which is retired).
 */
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../../services/apiClient.js'

async function fetchCategories() {
  const response = await apiClient.get('/categories')
  const data = response.data.data
  if (!Array.isArray(data)) return []
  const flat = []
  for (const cat of data) {
    flat.push({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
      parent_id: cat.parent_id || null,
      isChild: false,
      children: cat.children || [],
    })
    if (Array.isArray(cat.children)) {
      for (const child of cat.children) {
        flat.push({
          id: child.id,
          name: child.name,
          slug: child.slug,
          icon: child.icon,
          description: child.description,
          parent_id: child.parent_id || cat.id,
          isChild: true,
        })
      }
    }
  }
  return flat
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    networkMode: 'offlineFirst',
  })
}
