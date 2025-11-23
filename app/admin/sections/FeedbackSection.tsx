'use client'

import { MessageSquare, Package, Lightbulb, Bug, Search, Calendar, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { SkeletonStatsGrid, SkeletonTableRow } from '@/components/admin/SkeletonLoader'

interface FeedbackEntry {
  id: string
  type: 'product' | 'improvement' | 'bug'
  province?: string
  email?: string
  description: string
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'closed'
  reviewed: boolean
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  created_at: string
  [key: string]: any
}

interface FeedbackSectionProps {
  feedback: FeedbackEntry[]
  loading: boolean
  stats: {
    total: number
    new: number
    reviewed: number
    inProgress: number
    resolved: number
    byType: {
      product: number
      improvement: number
      bug: number
    }
  }
  typeFilter: string
  onTypeFilterChange: (filter: string) => void
  statusFilter: string
  onStatusFilterChange: (filter: string) => void
  provinceFilter: string
  onProvinceFilterChange: (filter: string) => void
  dateRangeFilter: { start: string; end: string }
  onDateRangeFilterChange: (range: { start: string; end: string }) => void
  searchTerm: string
  onSearchTermChange: (term: string) => void
  onFeedbackClick: (feedback: FeedbackEntry) => void
}

export function FeedbackSection({
  feedback,
  loading,
  stats,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  provinceFilter,
  onProvinceFilterChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  searchTerm,
  onSearchTermChange,
  onFeedbackClick,
}: FeedbackSectionProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'product':
        return { icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Product' }
      case 'improvement':
        return { icon: Lightbulb, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'Improvement' }
      case 'bug':
        return { icon: Bug, color: 'text-red-600 bg-red-50 border-red-200', label: 'Bug' }
      default:
        return { icon: MessageSquare, color: 'text-gray-600 bg-gray-50 border-gray-200', label: 'Unknown' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new':
        return { icon: Clock, color: 'text-sky-600 bg-sky-50 border-sky-200', label: 'New' }
      case 'reviewed':
        return { icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Reviewed' }
      case 'in_progress':
        return { icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'In Progress' }
      case 'resolved':
        return { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200', label: 'Resolved' }
      case 'closed':
        return { icon: XCircle, color: 'text-gray-600 bg-gray-50 border-gray-200', label: 'Closed' }
      default:
        return { icon: Clock, color: 'text-gray-600 bg-gray-50 border-gray-200', label: 'Unknown' }
    }
  }

  const filteredFeedback = feedback.filter(entry => {
    const matchesType = typeFilter === 'all' || entry.type === typeFilter
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter
    const matchesProvince = provinceFilter === 'all' || entry.province === provinceFilter
    const matchesSearch = 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.email && entry.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Date range filter
    let matchesDateRange = true
    if (dateRangeFilter.start || dateRangeFilter.end) {
      const entryDate = new Date(entry.created_at)
      if (dateRangeFilter.start) {
        const startDate = new Date(dateRangeFilter.start)
        startDate.setHours(0, 0, 0, 0)
        if (entryDate < startDate) matchesDateRange = false
      }
      if (dateRangeFilter.end) {
        const endDate = new Date(dateRangeFilter.end)
        endDate.setHours(23, 59, 59, 999)
        if (entryDate > endDate) matchesDateRange = false
      }
    }
    
    return matchesType && matchesStatus && matchesProvince && matchesSearch && matchesDateRange
  })

  const provinces = ['ON', 'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'PE', 'QC', 'SK', 'YT']

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Feedback Management</h1>
        <p className="text-gray-600">Review and manage user feedback submissions</p>
      </div>

      {/* Stats cards */}
      {loading ? (
        <SkeletonStatsGrid />
      ) : (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="text-blue-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{stats.total}</span>
            </div>
            <div className="text-sm text-gray-600">Total Feedback</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="text-sky-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{stats.new}</span>
            </div>
            <div className="text-sm text-gray-600">New</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Package className="text-blue-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{stats.byType.product}</span>
            </div>
            <div className="text-sm text-gray-600">Product Suggestions</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Bug className="text-red-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{stats.byType.bug}</span>
            </div>
            <div className="text-sm text-gray-600">Bug Reports</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by description or email..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="product">Product</option>
            <option value="improvement">Improvement</option>
            <option value="bug">Bug</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Province Filter */}
          <select
            value={provinceFilter}
            onChange={(e) => onProvinceFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
          >
            <option value="all">All Provinces</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>

          {/* Date Range - Start */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={dateRangeFilter.start}
              onChange={(e) => onDateRangeFilterChange({ ...dateRangeFilter, start: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              placeholder="Start Date"
            />
          </div>

          {/* Date Range - End */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={dateRangeFilter.end}
              onChange={(e) => onDateRangeFilterChange({ ...dateRangeFilter, end: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              placeholder="End Date"
            />
          </div>

          {/* Clear Filters */}
          {(dateRangeFilter.start || dateRangeFilter.end || typeFilter !== 'all' || statusFilter !== 'all' || provinceFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                onTypeFilterChange('all')
                onStatusFilterChange('all')
                onProvinceFilterChange('all')
                onDateRangeFilterChange({ start: '', end: '' })
                onSearchTermChange('')
              }}
              className="btn-outline text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredFeedback.length} of {feedback.length} feedback entries
        </div>
      </div>

      {/* Feedback Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonTableRow key={i} />
            ))}
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No feedback entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Province
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeedback.map((entry) => {
                  const typeConfig = getTypeConfig(entry.type)
                  const statusConfig = getStatusConfig(entry.status)
                  const TypeIcon = typeConfig.icon
                  const StatusIcon = statusConfig.icon

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onFeedbackClick(entry)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${typeConfig.color}`}>
                          <TypeIcon size={14} />
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {entry.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {entry.province || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {entry.email || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatRelativeTime(entry.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onFeedbackClick(entry)
                          }}
                          className="text-navy-600 hover:text-navy-700 font-semibold text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

