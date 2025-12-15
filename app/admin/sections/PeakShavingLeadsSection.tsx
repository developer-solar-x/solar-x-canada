'use client'

import { useState } from 'react'
import { Mail, CheckCircle, XCircle, Search, Calendar, Zap, ExternalLink, Loader2 } from 'lucide-react'

interface PeakShavingLead {
  id: string
  email: string
  emailVerified: boolean
  usageCount: number
  isSolarXEmail: boolean
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
  accessLogs: Array<{
    id: string
    accessed_at: string
    ip_address: string | null
    user_agent: string | null
  }>
  totalAccesses: number
}

interface PeakShavingLeadsSectionProps {
  leads: PeakShavingLead[]
  loading: boolean
  searchTerm: string
  onSearchTermChange: (term: string) => void
}

function SkeletonTableRow() {
  return (
    <tr>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
      </td>
    </tr>
  )
}

export function PeakShavingLeadsSection({
  leads,
  loading,
  searchTerm,
  onSearchTermChange,
}: PeakShavingLeadsSectionProps) {
  const ITEMS_PER_PAGE = 20
  const [page, setPage] = useState(1)

  // Filter leads based on search term
  const filteredLeads = leads.filter((lead) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return lead.email.toLowerCase().includes(search)
  })

  const totalLeads = filteredLeads.length
  const totalPages = Math.max(1, Math.ceil(totalLeads / ITEMS_PER_PAGE))
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const currentLeads = filteredLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Calculate stats
  const stats = {
    total: leads.length,
    verified: leads.filter((l) => l.emailVerified).length,
    unverified: leads.filter((l) => !l.emailVerified).length,
    solarX: leads.filter((l) => l.isSolarXEmail).length,
    withAccess: leads.filter((l) => l.usageCount > 0).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy-500 mb-2">Peak Shaving Leads</h1>
          <p className="text-gray-600">Manage email verifications and access logs</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-100 rounded-lg">
              <Mail size={20} className="text-navy-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-navy-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.verified}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unverified</p>
              <p className="text-2xl font-bold text-red-600">{stats.unverified}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Solar-X</p>
              <p className="text-2xl font-bold text-purple-600">{stats.solarX}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ExternalLink size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">With Access</p>
              <p className="text-2xl font-bold text-blue-600">{stats.withAccess}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => {
              onSearchTermChange(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border-2 border-gray-100 rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Last Used</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Created</th>
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
              <Mail size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No peak shaving leads yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Usage</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Last Used</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-900">{lead.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.emailVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                            <CheckCircle size={12} />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm">
                            <XCircle size={12} />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{lead.usageCount}</span>
                          {lead.isSolarXEmail ? (
                            <span className="text-xs text-purple-600 font-medium">(Unlimited)</span>
                          ) : (
                            <span className="text-xs text-gray-500">/ 2</span>
                          )}
                          {lead.totalAccesses > 0 && (
                            <span className="text-xs text-gray-400">({lead.totalAccesses} accesses)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.isSolarXEmail ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                            <Zap size={12} />
                            Solar-X
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                            Regular
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          {formatDate(lead.lastUsedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          {formatDate(lead.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalLeads > 0 && (
              <div className="mt-6 flex items-center justify-between bg-white border-t-2 border-gray-100 px-6 py-4">
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
        )}
      </div>
    </div>
  )
}

