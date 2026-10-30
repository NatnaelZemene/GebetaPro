/**
 * useMapPins.js — React Query hook for fetching profile map pins.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getProfileMapPins } from '../services/locationsService.js'

export const mapPinsKeys = {
  all: ['profile-map-pins'],
  filtered: (params) => ['profile-map-pins', params],
}

/**
 * Fetch all published profiles with coordinates for the map view.
 * Stale time is 10 minutes, with offline-first persistence.
 */
export function useMapPins(params = {}) {
  return useQuery({
    queryKey: mapPinsKeys.filtered(params),
    queryFn: () => getProfileMapPins(params),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10,
    networkMode: 'offlineFirst',
  })
}
