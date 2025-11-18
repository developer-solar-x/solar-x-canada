'use client'

import { Users, DollarSign, Zap, TrendingUp, Search, Download } from 'lucide-react'
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
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-blue-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{stats.totalLeads}</span>
            </div>
            <div className="text-sm text-gray-600">Total Leads</div>
            <div className="text-xs text-green-600 mt-1">↑ {stats.newLeads} new</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="text-red-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">
                {stats.avgSystemSize.toFixed(1)} kW
              </span>
            </div>
            <div className="text-sm text-gray-600">Avg System Size</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-green-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">
                {formatCurrency(stats.totalSavings)}
              </span>
            </div>
            <div className="text-sm text-gray-600">Total Annual Savings</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-purple-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">
                {((stats.newLeads / stats.totalLeads) * 100 || 0).toFixed(0)}%
              </span>
            </div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="closed">Closed</option>
          </select>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or address..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
            />
          </div>

          {/* Export button */}
          <button className="btn-outline border-navy-500 text-navy-500 inline-flex items-center gap-2">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Leads table */}
      <div className="card overflow-hidden">
        {loading ? (
          <>
            <div className="bg-navy-500 h-12"></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-navy-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Program</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">System Size</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Savings/Year</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">HubSpot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonTableRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No leads found</div>
        ) : (
          <>
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
              <p className="text-xs text-blue-700">
                💡 <strong>Tip:</strong> Click on any row to view complete lead details including roof visualization, photos, and full estimate breakdown
              </p>
            </div>
            <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
              <table className="w-full min-w-[900px]">
                <thead className="bg-navy-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Program</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">System Size</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Savings/Year</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">HubSpot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => onLeadClick(lead)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-navy-500">{lead.full_name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide ${getProgramBadgeColor(lead.program_type)}`}>
                          {formatProgramType(lead.program_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {lead.city}, {lead.province}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {lead.system_size_kw ? `${lead.system_size_kw.toFixed(1)} kW` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {lead.annual_savings ? formatCurrency(lead.annual_savings) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatRelativeTime(new Date(lead.created_at))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lead.hubspot_synced ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">-</span>
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

      {/* Pagination placeholder */}
      {leads.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {leads.length} of {leads.length} leads
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Previous
            </button>
            <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Next
            </button>
          </div>
        </div>
      )}
    </>
  )
}

