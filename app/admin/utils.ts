export const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-red-100 text-red-700'
    case 'contacted': return 'bg-yellow-100 text-yellow-700'
    case 'qualified': return 'bg-green-100 text-green-700'
    case 'closed': return 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export const formatProgramType = (type?: string | null) => {
  if (!type) return '—'
  const normalized = type.toLowerCase()
  const map: Record<string, string> = {
    quick: 'Quick Estimate',
    'quick_estimate': 'Quick Estimate',
    'hrs_residential': 'HRS Program',
    'net_metering': 'Net Metering',
    detailed: 'Detailed Estimate'
  }
  return map[normalized] || type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

export const getProgramBadgeColor = (type?: string | null) => {
  if (!type) return 'bg-gray-100 text-gray-500'
  const normalized = type.toLowerCase()
  switch (normalized) {
    case 'hrs_residential':
      return 'bg-blue-100 text-blue-700'
    case 'net_metering':
      return 'bg-emerald-100 text-emerald-700'
    case 'quick':
    case 'quick_estimate':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-500'
  }
}

