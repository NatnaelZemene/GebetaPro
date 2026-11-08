import { useRef } from 'react'
import { Phone, Mail, Globe, MessageCircle, Navigation, Send } from 'lucide-react'
import { Button } from '../../../components/ui/Button.jsx'
import { trackAnalyticsEvent } from '../../../services/analytics.service.js'

const TYPE_LABELS = {
  PERSONAL:      'Get in Touch',
  PROFESSIONAL:  'Contact',
  FREELANCER:    'Hire Me',
  SHOP:          'Contact Shop',
  BUSINESS:      'Contact Us',
  COMPANY:       'Contact Company',
  ORGANIZATION:  'Get in Touch',
}

export function ContactActions({ profile, compact = false }) {
  const lastClickRef = useRef({})
  if (!profile) return null

  const contact = profile.contact || {}
  const rawPhone = contact.phone || profile.phone || ''
  const rawWhatsapp = contact.whatsapp || profile.whatsapp || rawPhone
  const rawTelegram = contact.telegram || profile.telegram_username || ''
  const email = contact.email || profile.email || ''
  const website = contact.website || profile.website || ''
  const displayName = profile.display_name || profile.name || 'Professional'

  const cleanPhone = rawWhatsapp ? rawWhatsapp.replace(/\D/g, '') : ''
  const cleanTelegram = rawTelegram ? rawTelegram.replace(/^@/, '') : ''

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const inquiryText = encodeURIComponent(
    `Hello ${displayName}, I saw your profile on GebetaPro (${currentUrl}). I would like to inquire about your services.`
  )
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${inquiryText}` : null
  const telegramUrl = cleanTelegram ? `https://t.me/${cleanTelegram}` : null

  // Deduplicated event tracker — prevents duplicate tracking from rapid double clicks
  const trackAction = (type) => {
    if (!profile.id) return
    const now = Date.now()
    if (lastClickRef.current[type] && now - lastClickRef.current[type] < 1000) {
      return
    }
    lastClickRef.current[type] = now
    trackAnalyticsEvent({
      profile_id: profile.id,
      event_type: type,
    })
  }

  const handleWhatsApp = (e) => {
    if (e) e.preventDefault()
    if (!whatsappUrl) return
    trackAction('WHATSAPP_CLICK')
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const handleTelegram = (e) => {
    if (e) e.preventDefault()
    if (!telegramUrl) return
    trackAction('TELEGRAM_CLICK')
    window.open(telegramUrl, '_blank', 'noopener,noreferrer')
  }

  const handlePhone = () => {
    trackAction('PHONE_CLICK')
  }

  const handleEmail = () => {
    trackAction('EMAIL_CLICK')
  }

  const handleWebsite = () => {
    trackAction('WEBSITE_CLICK')
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {whatsappUrl && (
          <button
            type="button"
            onClick={handleWhatsApp}
            title="WhatsApp"
            aria-label="Chat on WhatsApp"
            className="h-8 w-8 flex items-center justify-center border border-border rounded text-ink-2 hover:border-brand hover:text-brand transition-colors cursor-pointer"
          >
            <MessageCircle size={14} />
          </button>
        )}
        {telegramUrl && (
          <button
            type="button"
            onClick={handleTelegram}
            title="Telegram"
            aria-label="Chat on Telegram"
            className="h-8 w-8 flex items-center justify-center border border-border rounded text-ink-2 hover:border-brand hover:text-brand transition-colors cursor-pointer"
          >
            <Send size={14} />
          </button>
        )}
        {rawPhone && (
          <a
            href={`tel:${rawPhone}`}
            onClick={handlePhone}
            title={rawPhone}
            aria-label={`Call ${rawPhone}`}
            className="h-8 w-8 flex items-center justify-center border border-border rounded text-ink-2 hover:border-brand hover:text-brand transition-colors hover:no-underline"
          >
            <Phone size={14} />
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            onClick={handleEmail}
            title={email}
            aria-label={`Email ${email}`}
            className="h-8 w-8 flex items-center justify-center border border-border rounded text-ink-2 hover:border-brand hover:text-brand transition-colors hover:no-underline"
          >
            <Mail size={14} />
          </a>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWebsite}
            title={website}
            aria-label="Website"
            className="h-8 w-8 flex items-center justify-center border border-border rounded text-ink-2 hover:border-brand hover:text-brand transition-colors hover:no-underline"
          >
            <Globe size={14} />
          </a>
        )}
      </div>
    )
  }

  const primaryLabel = TYPE_LABELS[profile.profile_type] || 'Contact'

  return (
    <div className="flex flex-wrap gap-2">
      {whatsappUrl ? (
        <Button
          variant="primary"
          size="sm"
          onClick={handleWhatsApp}
          icon={<MessageCircle size={14} />}
        >
          {primaryLabel}
        </Button>
      ) : rawPhone ? (
        <a href={`tel:${rawPhone}`} onClick={handlePhone}>
          <Button variant="primary" size="sm" icon={<Phone size={14} />}>
            {primaryLabel}
          </Button>
        </a>
      ) : email ? (
        <a href={`mailto:${email}`} onClick={handleEmail}>
          <Button variant="primary" size="sm" icon={<Mail size={14} />}>
            {primaryLabel}
          </Button>
        </a>
      ) : null}

      {telegramUrl && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleTelegram}
          icon={<Send size={13} />}
        >
          Telegram
        </Button>
      )}

      {rawPhone && whatsappUrl && (
        <a href={`tel:${rawPhone}`} onClick={handlePhone}>
          <Button variant="secondary" size="sm" icon={<Phone size={13} />}>
            Call
          </Button>
        </a>
      )}

      {website && (
        <a href={website} target="_blank" rel="noopener noreferrer" onClick={handleWebsite}>
          <Button variant="secondary" size="sm" icon={<Globe size={13} />}>
            Website
          </Button>
        </a>
      )}

      {profile.location?.coordinates?.lat != null && profile.location?.coordinates?.lng != null && (
        <a
          href={`https://maps.google.com/?q=${profile.location.coordinates.lat},${profile.location.coordinates.lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost" size="sm" icon={<Navigation size={13} />}>
            Directions
          </Button>
        </a>
      )}
    </div>
  )
}
