'use client'

import { useState, useEffect } from 'react'
import { Users, DollarSign, Zap, TrendingUp, Search, Download, Mail, MapPin, Battery, Calendar, CheckCircle, Eye } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { getStatusColor, getProgramBadgeColor, formatProgramType } from '../utils'
import { SkeletonStatsGrid, SkeletonTableRow } from '@/components/admin/SkeletonLoader'

interface Lead {
  id: string
  full_name: string
  email: string
  city?: string
  province: string
  status: string
  system_size_kw?: number
  annual_savings?: number
  program_type?: string
  created_at: string
  hubspot_synced?: boolean
  has_battery?: boolean
  selected_battery_ids?: string[]
  tou_annual_savings?: number
  ulo_annual_savings?: number
  tou_total_bill_savings_percent?: number
  ulo_total_bill_savings_percent?: number
  [key: string]: any
}

interface LeadsSectionProps {
  leads: Lead[]
  loading: boolean
  stats: {
    totalLeads: number
    avgSystemSize: number
    totalSavings: number
    newLeads: number
  }
  statusFilter: string
  onStatusFilterChange: (filter: string) => void
  searchTerm: string
  onSearchTermChange: (term: string) => void
  onLeadClick: (lead: Lead) => void
}

export function LeadsSection({
  leads,
  loading,
  stats,
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchTermChange,
  onLeadClick,
}: LeadsSectionProps) {
  const ITEMS_PER_PAGE = 10
  const [page, setPage] = useState(1)

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, searchTerm])

  const totalLeads = leads.length
  const totalPages = Math.max(1, Math.ceil(totalLeads / ITEMS_PER_PAGE))
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const currentLeads = leads.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Leads Dashboard</h1>
        <p className="text-gray-600">Manage and track all solar estimate submissions</p>
      </div>

      {/* Stats cards */}
      {loading ? (
        <SkeletonStatsGrid />
      ) : (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Users className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-blue-700">{stats.totalLeads}</span>
            </div>
            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Total Leads</div>
            <div className="text-xs text-green-600 mt-2 font-semibold flex items-center gap-1">
              <TrendingUp size={12} />
              {stats.newLeads} new
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500 rounded-lg">
                <Zap className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-orange-700">
                {stats.avgSystemSize.toFixed(1)} kW
              </span>
            </div>
            <div className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Avg System Size</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <DollarSign className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-green-700">
                {formatCurrency(stats.totalSavings)}
              </span>
            </div>
            <div className="text-sm font-semibold text-green-600 uppercase tracking-wide">Total Annual Savings</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <TrendingUp className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-purple-700">
                {((stats.newLeads / stats.totalLeads) * 100 || 0).toFixed(0)}%
              </span>
            </div>
            <div className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Conversion Rate</div>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-white border-2 border-gray-100 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-gray-50 focus:bg-white font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="closed">Closed</option>
          </select>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or address..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Export button */}
          <button className="inline-flex items-center gap-2 px-6 py-3 border-2 border-navy-500 text-navy-600 hover:bg-navy-50 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Leads table */}
      <div className="bg-white border-2 border-gray-100 rounded-xl shadow-lg overflow-hidden">
        {loading ? (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                  <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Program</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">System</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">HubSpot</th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonTableRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
        ) : totalLeads === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <Users className="text-gray-400" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-200 px-6 py-3">
              <p className="text-xs text-blue-700 flex items-center gap-2">
                <Eye size={14} />
                <strong>Tip:</strong> Click on any row to view complete lead details including roof visualization, photos, and full estimate breakdown
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Program</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">System</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">HubSpot</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => onLeadClick(lead)}
                      className="hover:bg-gradient-to-r hover:from-navy-50 hover:to-blue-50 cursor-pointer transition-all group border-l-4 border-transparent hover:border-navy-400"
                    >
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-navy-100 to-blue-100 rounded-lg flex items-center justify-center group-hover:from-navy-200 group-hover:to-blue-200 transition-all">
                            <Users size={20} className="text-navy-600" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 group-hover:text-navy-700 transition-colors">{lead.full_name}</div>
                            <div className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                              <Mail size={12} className="text-gray-400" />
                              <span className="truncate max-w-[200px]">{lead.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm ${getProgramBadgeColor(lead.program_type)}`}>
                          {formatProgramType(lead.program_type)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-sky-100 rounded-lg">
                            <MapPin size={14} className="text-sky-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {lead.city ? `${lead.city}, ` : ''}{lead.province}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          {lead.system_size_kw ? (
                            <div className="flex items-center gap-2">
                              <Zap size={14} className="text-orange-500" />
                              <span className="text-sm font-bold text-gray-900">{lead.system_size_kw.toFixed(1)} kW</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                          {lead.has_battery && lead.selected_battery_ids && lead.selected_battery_ids.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                              <Battery size={12} />
                              {lead.selected_battery_ids.length} battery{lead.selected_battery_ids.length > 1 ? 'ies' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600 font-medium">{formatRelativeTime(new Date(lead.created_at))}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {lead.hubspot_synced ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle size={14} className="text-green-600" />
                            <span className="text-xs font-semibold text-green-700">Synced</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalLeads > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700">
            Showing{' '}
            <span className="font-bold text-navy-600">
              {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalLeads)}
            </span>{' '}
            of <span className="font-bold text-navy-600">{totalLeads}</span> leads
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-semibold text-navy-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  )
}

