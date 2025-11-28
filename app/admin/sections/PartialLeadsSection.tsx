'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertCircle, TrendingUp, Zap, Search, Mail } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { MockPartialLead } from '@/lib/mock-partial-leads'
import { getPartialLeadTotalSteps } from '../partial-lead-steps'
import { SkeletonStatsGrid, SkeletonTableRow } from '@/components/admin/SkeletonLoader'

interface PartialLeadsSectionProps {
  partialLeads: MockPartialLead[]
  partialStats: {
    total: number
    recentCount: number
    highCompletionCount: number
    avgCompletion: number
  }
  loading?: boolean
  searchTerm: string
  onSearchTermChange: (term: string) => void
  onPartialLeadClick: (partialLead: MockPartialLead) => void
}

export function PartialLeadsSection({
  partialLeads,
  partialStats,
  loading = false,
  searchTerm,
  onSearchTermChange,
  onPartialLeadClick,
}: PartialLeadsSectionProps) {
  const ITEMS_PER_PAGE = 10
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  const totalPartialLeads = partialLeads.length
  const totalPages = Math.max(1, Math.ceil(totalPartialLeads / ITEMS_PER_PAGE))
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const currentPartialLeads = partialLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <>
      {/* Partial Leads Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Partial Leads Dashboard</h1>
        <p className="text-gray-600">Users who started but haven't completed their solar estimate</p>
      </div>

      {/* Partial Leads Stats */}
      {loading ? (
        <SkeletonStatsGrid />
      ) : (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="text-yellow-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{partialStats.total}</span>
            </div>
            <div className="text-sm text-gray-600">Total Partial Leads</div>
            <div className="text-xs text-yellow-600 mt-1">In-progress estimates</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="text-red-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{partialStats.recentCount}</span>
            </div>
            <div className="text-sm text-gray-600">Recent (24h)</div>
            <div className="text-xs text-red-600 mt-1">Hot leads to follow up</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-green-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{partialStats.highCompletionCount}</span>
            </div>
            <div className="text-sm text-gray-600">High Completion</div>
            <div className="text-xs text-green-600 mt-1">70%+ complete</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Zap className="text-blue-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{partialStats.avgCompletion.toFixed(0)}%</span>
            </div>
            <div className="text-sm text-gray-600">Avg Completion</div>
            <div className="text-xs text-blue-600 mt-1">Average progress</div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="card p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by email or address..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
          />
        </div>
      </div>

      {/* Partial Leads Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <>
            <div className="bg-navy-500 h-12"></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-navy-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Best Plan</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Progress</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Data Captured</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Last Updated</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
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
        ) : totalPartialLeads === 0 ? (
          <div className="p-8 text-center text-gray-500">No partial leads found</div>
        ) : (
          <>
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
              <p className="text-xs text-yellow-700">
                💡 <strong>Tip:</strong> Click any row to view complete details and send follow-up emails. 
                Focus on HOT and High Priority leads first - they have the highest conversion potential.
              </p>
            </div>
            <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
              <table className="w-full min-w-[800px]">
                <thead className="bg-navy-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Best Plan</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Progress</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Data Captured</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Last Updated</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentPartialLeads.map((partialLead) => {
                    const totalSteps = getPartialLeadTotalSteps({
                      estimatorMode: partialLead.estimator_data?.estimatorMode,
                      programType: (partialLead as any).program_type ?? (partialLead as any).estimator_data?.programType ?? null,
                      systemType: (partialLead as any).estimator_data?.systemType,
                    })
                    const clampedIndex = Math.max(0, Math.min(partialLead.current_step, totalSteps - 1))
                    const completion = Math.round(((clampedIndex + 1) / totalSteps) * 100)
                    const isRecent = (Date.now() - new Date(partialLead.created_at).getTime()) / (1000 * 60 * 60) <= 24
                    const isHot = completion >= 70
                    
                    return (
                      <tr 
                        key={partialLead.id} 
                        onClick={() => onPartialLeadClick(partialLead)}
                        className="hover:bg-yellow-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-sm font-medium text-navy-500">{partialLead.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {partialLead.estimator_data?.address || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {partialLead.estimator_data?.peakShaving?.ratePlan ? (
                            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                              {partialLead.estimator_data.peakShaving.ratePlan.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                              <div 
                                className={`h-2 rounded-full ${
                                  completion >= 70 ? 'bg-green-500' : 
                                  completion >= 40 ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`}
                                style={{ width: `${completion}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-600">{completion}%</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Step {clampedIndex + 1} of {totalSteps}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {partialLead.estimator_data?.roofAreaSqft && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">Roof</span>
                            )}
                            {partialLead.estimator_data?.annualUsageKwh && (
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Usage</span>
                            )}
                            {partialLead.estimator_data?.selectedAddOns && partialLead.estimator_data.selectedAddOns.length > 0 && (
                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">Add-ons</span>
                            )}
                            {partialLead.estimator_data?.photoCount && partialLead.estimator_data.photoCount > 0 && (
                              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">Photos</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatRelativeTime(new Date(partialLead.updated_at))}
                          {partialLead.resumed_at && (
                            <div className="text-xs text-green-600 mt-1">Resumed</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isRecent && isHot ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                              HOT
                            </span>
                          ) : isHot ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              High Priority
                            </span>
                          ) : isRecent ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                              Recent
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              Cold
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {/* Pagination */}
      {totalPartialLeads > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700">
            Showing{' '}
            <span className="font-bold text-navy-600">
              {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalPartialLeads)}
            </span>{' '}
            of <span className="font-bold text-navy-600">{totalPartialLeads}</span> partial leads
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

