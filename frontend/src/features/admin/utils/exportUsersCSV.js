/**
 * exportUsersCSV.js — RFC 4180 compliant CSV export utility for Admin User Management.
 */

function escapeCSVField(val) {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

export function exportUsersToCSV(users = [], filename) {
  if (!users || users.length === 0) return

  const defaultFilename = `users-export-${new Date().toISOString().slice(0, 10)}.csv`
  const exportFilename = filename || defaultFilename

  const headers = [
    'User ID',
    'Display Name',
    'Email',
    'Phone',
    'Role',
    'Status',
    'Subscription Plan',
    'Sector / Category',
    'City',
    'Verified',
    'Profile Slug',
    'Registration Date',
  ]

  const rows = users.map(u => [
    escapeCSVField(u.id),
    escapeCSVField(u.display_name || ''),
    escapeCSVField(u.email || ''),
    escapeCSVField(u.phone || ''),
    escapeCSVField(u.role || 'USER'),
    escapeCSVField(u.status || 'ACTIVE'),
    escapeCSVField(u.plan_name || 'Free'),
    escapeCSVField(u.category_name || ''),
    escapeCSVField(u.city || ''),
    escapeCSVField(u.email_verified_at || u.profile_verified ? 'Yes' : 'No'),
    escapeCSVField(u.slug || ''),
    escapeCSVField(u.created_at ? new Date(u.created_at).toISOString() : ''),
  ])

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
