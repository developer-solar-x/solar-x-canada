'use client'

// Installer leads view page (mock UI, no backend)

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { 
  Search, 
  Filter, 
  MapPin, 
  Zap, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Eye
} from 'lucide-react'
import Link from 'next/link'

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed' | 'lost'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  systemSize: string
  numPanels: number
  status: LeadStatus
  priority: 'high' | 'medium' | 'low'
  receivedAt: string
  lastContacted?: string
  notes?: string
}

export default function InstallerLeadsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  // Mock leads data - will be replaced with real data when backend is connected
  const [leads] = useState<Lead[]>([
    {
      id: 'lead-001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(416) 555-0101',
      address: '123 Main Street',
      city: 'Toronto',
      province: 'ON',
      systemSize: '7.0 kW',
      numPanels: 14,
      status: 'new',
      priority: 'high',
      receivedAt: '2024-01-20T10:30:00',
    },
    {
      id: 'lead-002',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(905) 555-0102',
      address: '456 Oak Avenue',
      city: 'Mississauga',
      province: 'ON',
      systemSize: '10.5 kW',
      numPanels: 21,
      status: 'contacted',
      priority: 'medium',
      receivedAt: '2024-01-19T14:20:00',
      lastContacted: '2024-01-19T16:45:00',
    },
    {
      id: 'lead-003',
      name: 'Mike Chen',
      email: 'mike.chen@email.com',
      phone: '(905) 555-0103',
      address: '789 Pine Road',
      city: 'Brampton',
      province: 'ON',
      systemSize: '8.5 kW',
      numPanels: 17,
      status: 'new',
      priority: 'high',
      receivedAt: '2024-01-18T09:15:00',
    },
    {
      id: 'lead-004',
      name: 'Emily Davis',
      email: 'emily.d@email.com',
      phone: '(416) 555-0104',
      address: '321 Elm Street',
      city: 'Toronto',
      province: 'ON',
      systemSize: '12.0 kW',
      numPanels: 24,
      status: 'qualified',
      priority: 'high',
      receivedAt: '2024-01-17T11:00:00',
      lastContacted: '2024-01-18T10:30:00',
    },
    {
      id: 'lead-005',
      name: 'Robert Wilson',
      email: 'r.wilson@email.com',
      phone: '(905) 555-0105',
      address: '654 Maple Drive',
      city: 'Oakville',
      province: 'ON',
      systemSize: '9.5 kW',
      numPanels: 19,
      status: 'closed',
      priority: 'medium',
      receivedAt: '2024-01-15T13:20:00',
      lastContacted: '2024-01-16T15:00:00',
    },
  ])

  const getStatusConfig = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return { color: 'bg-maple-100 text-maple-700', icon: Clock, label: 'New' }
      case 'contacted':
        return { color: 'bg-sky-100 text-sky-700', icon: Mail, label: 'Contacted' }
      case 'qualified':
        return { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Qualified' }
      case 'closed':
        return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Closed' }
      case 'lost':
        return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Lost' }
    }
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { color: 'text-maple-600', label: 'High' }
      case 'medium':
        return { color: 'text-yellow-600', label: 'Medium' }
      case 'low':
        return { color: 'text-gray-600', label: 'Low' }
      default:
        return { color: 'text-gray-600', label: 'Medium' }
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-8 bg-forest-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/for-installers/dashboard" className="text-white/80 hover:text-white text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold font-display">Leads</h1>
          <p className="text-white/90 mt-2">Manage and track your qualified leads</p>
        </div>
      </section>

      {/* Leads Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-md mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="closed">Closed</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent appearance-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredLeads.length} of {leads.length} leads
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      System
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => {
                    const statusConfig = getStatusConfig(lead.status)
                    const priorityConfig = getPriorityConfig(lead.priority)
                    const StatusIcon = statusConfig.icon

                    return (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-semibold text-gray-900">{lead.name}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Mail size={14} />
                              {lead.email}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Phone size={14} />
                              {lead.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <MapPin size={14} className="text-gray-400" />
                            <div>
                              <div>{lead.address}</div>
                              <div className="text-gray-600">{lead.city}, {lead.province}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Zap size={16} className="text-forest-500" />
                            <div>
                              <div className="font-semibold text-gray-900">{lead.systemSize}</div>
                              <div className="text-xs text-gray-600">{lead.numPanels} panels</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.color} inline-flex items-center gap-1`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${priorityConfig.color}`}>
                            {priorityConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatTimeAgo(lead.receivedAt)}
                          </div>
                          {lead.lastContacted && (
                            <div className="text-xs text-gray-500 mt-1">
                              Last: {formatTimeAgo(lead.lastContacted)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            href={`/for-installers/dashboard/leads/${lead.id}`}
                            className="text-forest-600 hover:text-forest-700 font-semibold inline-flex items-center gap-1"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredLeads.length === 0 && (
            <div className="bg-white rounded-xl p-12 shadow-md text-center">
              <p className="text-gray-600">No leads found matching your filters.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

