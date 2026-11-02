/**
 * exportSubscriptionsCSV.js — RFC 4180 compliant CSV export utility for Admin Subscription Management.
 */

function escapeCSVField(val) {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

export function exportSubscriptionsToCSV(subscriptions = [], filename) {
  if (!subscriptions || subscriptions.length === 0) return

  const defaultFilename = `subscriptions-export-${new Date().toISOString().slice(0, 10)}.csv`
  const exportFilename = filename || defaultFilename

  const headers = [
    'Subscription ID',
    'User ID',
    'Business / Display Name',
    'Email',
    'Phone',
    'Plan Name',
    'Price (ETB)',
    'Status',
    'Period Start',
    'Period End',
    'Days Remaining',
    'Sector / Category',
    'City',
    'Verified Profile',
    'Profile Slug',
  ]

  const now = Date.now()

  const rows = subscriptions.map(s => {
    const name = s.business_name || s.display_name || ''
    const msRemaining = s.current_period_end ? new Date(s.current_period_end).getTime() - now : 0
    const daysRemaining = s.status === 'ACTIVE' && s.current_period_end ? Math.ceil(msRemaining / 86400000) : ''

    return [
      escapeCSVField(s.id),
      escapeCSVField(s.user_id),
      escapeCSVField(name),
      escapeCSVField(s.email || ''),
      escapeCSVField(s.phone || ''),
      escapeCSVField(s.plan_name || 'FREE'),
      escapeCSVField(s.price_etb ?? 0),
      escapeCSVField(s.status || 'ACTIVE'),
      escapeCSVField(s.current_period_start ? new Date(s.current_period_start).toISOString().slice(0, 10) : ''),
      escapeCSVField(s.current_period_end ? new Date(s.current_period_end).toISOString().slice(0, 10) : ''),
      escapeCSVField(daysRemaining),
      escapeCSVField(s.category_name || ''),
      escapeCSVField(s.city || ''),
      escapeCSVField(s.profile_verified ? 'Yes' : 'No'),
      escapeCSVField(s.slug || ''),
    ]
  })

  // Include UTF-8 BOM so Excel opens it with proper character encoding
  const csvContent = '\uFEFF' + [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.join(',')),
  ].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', exportFilename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
