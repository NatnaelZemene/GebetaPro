/**
 * ProfileAbout.jsx — About, Availability, Location, and Contact sections.
 * i18n: English / አማርኛ via react-i18next
 */
import { MapPin, Navigation, Phone, Mail, Globe, MessageCircle, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ProfileLocationMap } from './ProfileLocationMap.jsx'

import {
  evaluateBusinessStatus,
  format24to12,
  getCurrentTimeInZone,
  isDay24Hours,
  isDayOvernight,
} from '../../../utils/businessHours.js'
import { trackProfileEvent } from '../../../services/profiles.service.js'

/* ── AvailabilitySection ────────────────────────────────────────────────────── */
function AvailabilitySection({ businessHours }) {
  const { t } = useTranslation()
  if (!businessHours?.length) return null

  const todayIndex = getCurrentTimeInZone().day
  const status     = evaluateBusinessStatus(businessHours, t)

  // Sort hours Mon→Sun for display
  const sorted = [...businessHours].sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0]
    return order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week)
  })

  return (
    <div>
      {/* Live status */}
      {status && (
        <div className="mb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              {status.open && (
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"
                  style={{ animationDuration: '2s' }}
                />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  status.open ? 'bg-emerald-500' : 'bg-ink-4'
                }`}
              />
            </span>
            <span className={`text-[14px] font-bold ${status.open ? 'text-emerald-700' : 'text-ink-2'}`}>
              {status.label}
            </span>
          </div>
          {(status.detail || status.nextMsg) && (
            <p className="text-[13px] text-ink-3 pl-[22px]">
              {status.detail || status.nextMsg}
            </p>
          )}
        </div>
      )}

      {/* Weekly schedule */}
      <div className="space-y-0.5">
        {sorted.map(h => {
          const isToday      = h.day_of_week === todayIndex
          const isClosed     = h.is_closed || (!h.opens_at && !h.closes_at)
          const is24h        = isDay24Hours(h)
          const isOvernight  = isDayOvernight(h)

          let timeRange = null
          if (!isClosed) {
            if (is24h) {
              timeRange = t('profile.hours.open24h', 'Open 24 hours')
            } else if (isOvernight) {
              timeRange = `${format24to12(h.opens_at)} – ${format24to12(h.closes_at)} (+1)`
            } else {
              timeRange = `${format24to12(h.opens_at)} – ${format24to12(h.closes_at)}`
            }
          }

          return (
            <div
              key={h.day_of_week}
              className={`
                flex items-center justify-between
                py-1.5 px-2.5 rounded-lg -mx-2.5
                ${isToday
                  ? 'bg-brand-light/50'
                  : 'hover:bg-surface-2 transition-colors duration-100'
                }
              `}
            >
              <span
                className={`
                  text-[13px] w-8 shrink-0
                  ${isToday ? 'font-bold text-brand' : isClosed ? 'text-ink-3' : 'text-ink-2'}
                `}
              >
                {t(`profile.hours.daysShort.${h.day_of_week}`)}
              </span>

              {isToday && (
                <span className="text-[10px] font-semibold text-brand uppercase tracking-wide mx-2 shrink-0">
                  {t('profile.hours.today')}
                </span>
              )}
              {!isToday && <span className="flex-1" />}

              <span
                className={`
                  text-[13px] tabular-nums text-right
                  ${isToday ? 'font-semibold text-ink' : isClosed ? 'text-ink-4' : 'text-ink-2'}
                `}
              >
                {isClosed ? t('profile.hours.closed') : timeRange}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── ContactSection ─────────────────────────────────────────────────────────── */
function ContactSection({ contact, slug }) {
  const { t } = useTranslation()
  if (!contact) return null
  const hasAny = Object.values(contact).some(Boolean)
  if (!hasAny) return null

  const items = [
    contact.phone    && { href: `tel:${contact.phone}`,                                Icon: Phone,         label: contact.phone,                     external: false, type: 'PHONE_CLICK' },
    contact.whatsapp && { href: `https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`, Icon: MessageCircle, label: t('profile.public.whatsapp'),      external: true,  type: 'WHATSAPP_CLICK' },
    contact.telegram && { href: `https://t.me/${contact.telegram.replace('@','')}`,    Icon: Send,          label: contact.telegram.startsWith('@') ? contact.telegram : `@${contact.telegram}`, external: true, type: 'TELEGRAM_CLICK' },
    contact.email    && { href: `mailto:${contact.email}`,                             Icon: Mail,          label: contact.email,                     external: false, type: 'EMAIL_CLICK' },
    contact.website  && { href: contact.website,                                       Icon: Globe,         label: contact.website.replace(/^https?:\/\//, ''), external: true, type: 'WEBSITE_CLICK' },
  ].filter(Boolean)

  return (
    <div className="space-y-2">
      {items.map(({ href, Icon, label, external, type }) => (
        <a
          key={href}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          onClick={() => {
            if (slug) trackProfileEvent(slug, type)
          }}
          className="
            flex items-center gap-3
            text-[13px] text-ink-2 hover:text-brand
            hover:no-underline transition-colors duration-150 group
          "
        >
          <span className="w-7 h-7 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 group-hover:bg-brand-light transition-colors duration-150">
            <Icon size={13} className="text-ink-3 group-hover:text-brand transition-colors duration-150" aria-hidden="true" />
          </span>
          <span className="truncate">{label}</span>
        </a>
      ))}
    </div>
  )
}

/* ── ProfileAbout (main export) ─────────────────────────────────────────────── */
export function ProfileAbout({ profile, compact = false }) {
  const { t } = useTranslation()
  const { description, location, business_hours, contact } = profile

  const locationStr  = [location?.area, location?.city, location?.region, location?.country]
    .filter(Boolean).join(', ')
  const hasCoords    = location?.coordinates?.lat != null && location?.coordinates?.lng != null
  const hasLocation  = !!(locationStr || hasCoords)
  const hasHours     = business_hours?.length > 0
  const hasContact   = contact && Object.values(contact).some(Boolean)

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}`
    : locationStr
    ? `https://www.google.com/maps/search/${encodeURIComponent(locationStr)}`
    : null

  const Section = ({ title, children }) => (
    <div className="py-5 border-b border-border last:border-b-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3 mb-3">
        {title}
      </h3>
      {children}
    </div>
  )

  return (
    <div>

      {/* About */}
      {description && (
        <Section title={t('profile.hours.about')}>
          <p className="text-[14px] text-ink-2 leading-relaxed whitespace-pre-wrap max-w-prose">
            {description}
          </p>
        </Section>
      )}

      {/* Availability */}
      {hasHours && (
        <Section title={t('profile.hours.sectionTitle')}>
          <AvailabilitySection businessHours={business_hours} />
        </Section>
      )}

      {/* Location */}
      {hasLocation && (
        <Section title={t('profile.hours.location')}>
          {hasCoords && (
            <div className="mb-3 rounded-xl overflow-hidden">
              <ProfileLocationMap
                lat={location.coordinates.lat}
                lng={location.coordinates.lng}
              />
            </div>
          )}
          {locationStr && (
            <div className="flex items-center gap-2 text-[13px] text-ink-2 mb-3">
              <MapPin size={13} className="text-ink-3 shrink-0" aria-hidden="true" />
              {locationStr}
            </div>
          )}
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-2
                text-[13px] font-medium text-brand
                hover:text-brand-hover hover:no-underline
                transition-colors duration-150
              "
            >
              <Navigation size={13} aria-hidden="true" />
              {t('profile.hours.getDirections')}
            </a>
          )}
        </Section>
      )}

      {/* Contact */}
      {hasContact && (
        <Section title={t('profile.hours.contact')}>
          <ContactSection contact={contact} slug={profile.slug} />
        </Section>
      )}
    </div>
  )
}
