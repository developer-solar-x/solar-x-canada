'use client'

import { useState, useEffect } from 'react'
import { Building2, CheckCircle, Clock, XCircle, AlertCircle, Search, Download, FileText, Award, Shield, MapPin, Mail, Phone, Eye, TrendingUp } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { SkeletonStatsGrid, SkeletonInstallerTableRow } from '@/components/admin/SkeletonLoader'

interface InstallerApplication {
  id: string
  companyName: string
  contactPersonName: string
  contactEmail: string
  contactPhone: string
  province: string
  status: 'pending_review' | 'approved' | 'rejected' | 'need_more_info'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
  yearsInBusiness?: string
  numberOfInstalls?: string
  [key: string]: any
}

interface InstallersSectionProps {
  applications: InstallerApplication[]
  loading: boolean
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
    needMoreInfo: number
  }
  statusFilter: string
  onStatusFilterChange: (filter: string) => void
  searchTerm: string
  onSearchTermChange: (term: string) => void
  onApplicationClick: (application: InstallerApplication) => void
}

export function InstallersSection({
  applications,
  loading,
  stats,
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchTermChange,
  onApplicationClick,
}: InstallersSectionProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { 
          icon: CheckCircle, 
          color: 'text-green-600 bg-green-50 border-green-200',
          label: 'Approved'
        }
      case 'rejected':
        return { 
          icon: XCircle, 
          color: 'text-red-600 bg-red-50 border-red-200',
          label: 'Rejected'
        }
      case 'need_more_info':
        return { 
          icon: AlertCircle, 
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          label: 'Need More Info'
        }
      default:
        return { 
          icon: Clock, 
          color: 'text-sky-600 bg-sky-50 border-sky-200',
          label: 'Pending Review'
        }
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesSearch = 
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.province.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const ITEMS_PER_PAGE = 10
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [statusFilter, searchTerm])

  const totalFiltered = filteredApplications.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE))
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const currentApplications = filteredApplications.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 mb-2">Installer Applications</h1>
        <p className="text-gray-600">Review and manage solar installer applications</p>
      </div>

      {/* Stats cards */}
      {loading ? (
        <SkeletonStatsGrid />
      ) : (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Building2 className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-blue-700">{stats.total}</span>
            </div>
            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Total Applications</div>
          </div>

          <div className="bg-gradient-to-br from-sky-50 to-sky-100 border-2 border-sky-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-sky-500 rounded-lg">
                <Clock className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-sky-700">{stats.pending}</span>
            </div>
            <div className="text-sm font-semibold text-sky-600 uppercase tracking-wide">Pending Review</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <CheckCircle className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-green-700">{stats.approved}</span>
            </div>
            <div className="text-sm font-semibold text-green-600 uppercase tracking-wide">Approved</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500 rounded-lg">
                <AlertCircle className="text-white" size={28} />
              </div>
              <span className="text-4xl font-bold text-yellow-700">{stats.needMoreInfo}</span>
            </div>
            <div className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">Need More Info</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border-2 border-gray-100 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by company, contact, email, or province..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-gray-50 focus:bg-white font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="need_more_info">Need More Info</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white border-2 border-gray-100 rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Province
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonInstallerTableRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : totalFiltered === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <Building2 className="text-gray-400" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-navy-500 to-navy-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Province
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentApplications.map((app, index) => {
                  const statusConfig = getStatusConfig(app.status)
                  const StatusIcon = statusConfig.icon

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-gradient-to-r hover:from-navy-50 hover:to-blue-50 cursor-pointer transition-all group border-l-4 border-transparent hover:border-navy-400"
                      onClick={() => onApplicationClick(app)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-navy-100 to-blue-100 rounded-lg flex items-center justify-center group-hover:from-navy-200 group-hover:to-blue-200 transition-all">
                            <Building2 size={20} className="text-navy-600" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 group-hover:text-navy-700 transition-colors">{app.companyName}</div>
                            {app.yearsInBusiness && (
                              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <TrendingUp size={12} />
                                {app.yearsInBusiness} in business
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900 text-sm">{app.contactPersonName}</div>
                          <div className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Mail size={12} className="text-gray-400" />
                            <span className="truncate max-w-[200px]">{app.contactEmail}</span>
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400" />
                            {app.contactPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-sky-100 rounded-lg">
                            <MapPin size={14} className="text-sky-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{app.province || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 shadow-sm ${statusConfig.color}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600 font-medium">{formatRelativeTime(app.submittedAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onApplicationClick(app)
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all group/btn"
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

      {/* Pagination */}
      {totalFiltered > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700">
            Showing{' '}
            <span className="font-bold text-navy-600">
              {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalFiltered)}
            </span>{' '}
            of <span className="font-bold text-navy-600">{totalFiltered}</span> applications
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

