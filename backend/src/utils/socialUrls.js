/**
 * Turn a username, phone, or partial URL into a clean, valid https link for the platform.
 */
export function normalizeSocialUrl(platform, raw) {
  let value = String(raw || '').trim()
  if (!value) return value

  if (platform === 'WHATSAPP') {
    const digits = value.replace(/\D/g, '')
    return digits ? `https://wa.me/${digits}` : value
  }

  if (platform === 'TELEGRAM') {
    if (/^https?:\/\//i.test(value)) return value
    const username = value.replace(/^@/, '').replace(/^t\.me\//i, '')
    return `https://t.me/${username}`
  }

  if (platform === 'INSTAGRAM') {
    if (/^https?:\/\//i.test(value)) return value
    const handle = value.replace(/^@/, '').replace(/^(www\.)?instagram\.com\//i, '')
    return `https://instagram.com/${handle}`
  }

  if (platform === 'TIKTOK') {
    if (/^https?:\/\//i.test(value)) return value
    const handle = value.replace(/^@/, '').replace(/^(www\.)?tiktok\.com\/@?/i, '')
    return `https://tiktok.com/@${handle}`
  }

  if (platform === 'FACEBOOK') {
    if (/^https?:\/\//i.test(value)) return value
    const page = value.replace(/^(www\.)?facebook\.com\//i, '')
    return `https://facebook.com/${page}`
  }

  if (platform === 'LINKEDIN') {
    if (/^https?:\/\//i.test(value)) return value
    const slug = value.replace(/^(www\.)?linkedin\.com\/(in|company)\//i, '')
    return `https://linkedin.com/in/${slug}`
  }

  if (platform === 'YOUTUBE') {
    if (/^https?:\/\//i.test(value)) return value
    const handle = value.replace(/^(www\.)?youtube\.com\//i, '')
    return `https://youtube.com/${handle.startsWith('@') ? handle : `@${handle}`}`
  }

  if (platform === 'TWITTER') {
    if (/^https?:\/\//i.test(value)) return value
    const handle = value.replace(/^@/, '').replace(/^(www\.)?(x|twitter)\.com\//i, '')
    return `https://x.com/${handle}`
  }

  if (platform === 'SNAPCHAT') {
    if (/^https?:\/\//i.test(value)) return value
    const handle = value.replace(/^(www\.)?snapchat\.com\/add\//i, '')
    return `https://snapchat.com/add/${handle}`
  }

  if (platform === 'GITHUB') {
    if (/^https?:\/\//i.test(value)) return value
    const handle = value.replace(/^(www\.)?github\.com\//i, '')
    return `https://github.com/${handle}`
  }

  if (!/^https?:\/\//i.test(value)) return `https://${value}`
  return value
}

