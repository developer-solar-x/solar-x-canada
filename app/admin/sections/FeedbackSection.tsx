'use client'

import { MessageSquare, Package, Lightbulb, Bug, Search, Calendar, CheckCircle, Clock, AlertCircle, XCircle, Mail, MapPin, Eye, X } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { SkeletonStatsGrid, SkeletonFeedbackTableRow } from '@/components/admin/SkeletonLoader'

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
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <MessageSquare className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-blue-700">{stats.total}</span>
            </div>
            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Total Feedback</div>
          </div>

          <div className="bg-gradient-to-br from-sky-50 to-sky-100 border-2 border-sky-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-sky-500 rounded-lg">
                <Clock className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-sky-700">{stats.new}</span>
            </div>
            <div className="text-sm font-semibold text-sky-600 uppercase tracking-wide">New</div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-500 rounded-lg">
                <Package className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-indigo-700">{stats.byType.product}</span>
            </div>
            <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Product Suggestions</div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500 rounded-lg">
                <Bug className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-red-700">{stats.byType.bug}</span>
            </div>
            <div className="text-sm font-semibold text-red-600 uppercase tracking-wide">Bug Reports</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border-2 border-gray-100 rounded-xl p-6 mb-6 shadow-sm">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by description or email..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-gray-50 focus:bg-white font-medium"
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
            className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-gray-50 focus:bg-white font-medium"
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
            className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-gray-50 focus:bg-white font-medium"
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
            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={dateRangeFilter.start}
              onChange={(e) => onDateRangeFilterChange({ ...dateRangeFilter, start: e.target.value })}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-gray-50 focus:bg-white"
              placeholder="Start Date"
            />
          </div>

          {/* Date Range - End */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={dateRangeFilter.end}
              onChange={(e) => onDateRangeFilterChange({ ...dateRangeFilter, end: e.target.value })}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-gray-50 focus:bg-white"
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
              className="inline-flex items-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-all"
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Showing <span className="font-bold text-navy-600">{filteredFeedback.length}</span> of <span className="font-bold text-navy-600">{feedback.length}</span> feedback entries
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white border-2 border-gray-100 rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Province</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonFeedbackTableRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <MessageSquare className="text-gray-400" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback entries found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Province</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredFeedback.map((entry) => {
                  const typeConfig = getTypeConfig(entry.type)
                  const statusConfig = getStatusConfig(entry.status)
                  const TypeIcon = typeConfig.icon
                  const StatusIcon = statusConfig.icon

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-gradient-to-r hover:from-navy-50 hover:to-blue-50 cursor-pointer transition-all group border-l-4 border-transparent hover:border-navy-400"
                      onClick={() => onFeedbackClick(entry)}
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm ${typeConfig.color}`}>
                          <TypeIcon size={14} />
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-lg">
                          <div className="flex items-start gap-2">
                            <MessageSquare size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-900 line-clamp-2 group-hover:text-navy-700 transition-colors">
                              {entry.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {entry.province ? (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-sky-100 rounded-lg">
                              <MapPin size={14} className="text-sky-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{entry.province}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {entry.email ? (
                          <a 
                            href={`mailto:${entry.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 text-sm text-gray-900 hover:text-navy-600 font-medium transition-colors"
                          >
                            <Mail size={14} className="text-gray-400" />
                            <span className="truncate max-w-[200px]">{entry.email}</span>
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm ${statusConfig.color}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600 font-medium">{formatRelativeTime(entry.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onFeedbackClick(entry)
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          <Eye size={16} />
                          <span>View</span>
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

