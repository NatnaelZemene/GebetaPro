/**
 * MapProfilePopup.jsx — Leaflet Popup content for a profile marker.
 * Shows: avatar, name, headline, category, rating, link to profile.
 * Theme-aware: adapts perfectly to both light and dark mode.
 */
import { Link } from 'react-router-dom'
import { MapPin, Star, BadgeCheck, ExternalLink } from 'lucide-react'
import { CategoryIconInline } from '../../profiles/components/CategoryIcon.jsx'

export function MapProfilePopup({ profile }) {
  return (
    <div className="w-52 text-left font-sans text-ink">
      {/* Avatar / cover */}
      <div className="h-24 -mx-[12px] -mt-[12px] mb-2.5 overflow-hidden rounded-t-xl bg-surface-2">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900">
            <span className="text-3xl font-bold text-brand">
              {profile.display_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Name + verified */}
      <div className="flex items-center gap-1.5 mb-1">
        <h4 className="text-[13.5px] font-bold text-ink leading-snug line-clamp-1 flex-1 min-w-0">
          {profile.display_name}
        </h4>
        {profile.is_verified && (
          <BadgeCheck size={14} className="text-brand shrink-0" aria-label="Verified" />
        )}
      </div>

      {/* Headline */}
      {profile.headline && (
        <p className="text-[11.5px] text-ink-2 line-clamp-1 mb-1.5 leading-tight">{profile.headline}</p>
      )}

      {/* Category */}
      {profile.category_name && (
        <p className="text-[11px] text-ink-3 mb-1 flex items-center gap-1 truncate">
          <CategoryIconInline slug={profile.category_slug} name={profile.category_name} size={12} className="shrink-0" />
          <span className="truncate">{profile.category_name}</span>
        </p>
      )}

      {/* Rating */}
      {profile.review_count > 0 && (
        <div className="flex items-center gap-1 mb-1.5">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-[11px] text-ink-2">
            {Number(profile.avg_rating).toFixed(1)} ({profile.review_count})
          </span>
        </div>
      )}

      {/* Location */}
      {(profile.city || profile.country) && (
        <div className="flex items-center gap-1 mb-2.5">
          <MapPin size={10} className="text-ink-3 shrink-0" />
          <p className="text-[11px] text-ink-3 line-clamp-1">
            {[profile.city, profile.country].filter(Boolean).join(', ')}
          </p>
        </div>
      )}

      {/* Link */}
      <Link
        to={`/p/${profile.slug}`}
        className="inline-flex items-center gap-1 text-[12px] text-brand font-semibold hover:underline mt-1"
      >
        View profile <ExternalLink size={11} />
      </Link>
    </div>
  )
}
