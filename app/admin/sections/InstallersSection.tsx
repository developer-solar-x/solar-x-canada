'use client'

import { Building2, CheckCircle, Clock, XCircle, AlertCircle, Search, Download, FileText, Award, Shield, MapPin } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { SkeletonStatsGrid, SkeletonTableRow } from '@/components/admin/SkeletonLoader'

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
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Building2 className="text-blue-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{stats.total}</span>
            </div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="text-sky-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{stats.pending}</span>
            </div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="text-green-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{stats.approved}</span>
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="text-yellow-500" size={32} />
              <span className="text-3xl font-bold text-navy-500">{stats.needMoreInfo}</span>
            </div>
            <div className="text-sm text-gray-600">Need More Info</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by company, contact, email, or province..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
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
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonTableRow key={i} />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No installer applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Province
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
                {filteredApplications.map((app) => {
                  const statusConfig = getStatusConfig(app.status)
                  const StatusIcon = statusConfig.icon

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onApplicationClick(app)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{app.companyName}</div>
                        {app.yearsInBusiness && (
                          <div className="text-sm text-gray-500">{app.yearsInBusiness} in business</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{app.contactPersonName}</div>
                        <div className="text-sm text-gray-500">{app.contactEmail}</div>
                        <div className="text-sm text-gray-500">{app.contactPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <MapPin size={14} className="text-gray-400" />
                          {app.province || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatRelativeTime(app.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onApplicationClick(app)
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

