'use client'

// Installer dashboard page (mock UI, no backend)

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Award, 
  MapPin, 
  FileText,
  Settings,
  Bell,
  ArrowRight,
  DollarSign,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

export default function InstallerDashboardPage() {
  // Mock data - will be replaced with real data when backend is connected
  const [stats] = useState({
    totalLeads: 24,
    newLeads: 5,
    contacted: 12,
    closed: 7,
    conversionRate: 29.2,
    avgResponseTime: '2.5 hours',
  })

  const [recentLeads] = useState([
    {
      id: 'lead-001',
      name: 'John Smith',
      address: '123 Main St, Toronto, ON',
      systemSize: '7.0 kW',
      status: 'new',
      receivedAt: '2 hours ago',
      priority: 'high',
    },
    {
      id: 'lead-002',
      name: 'Sarah Johnson',
      address: '456 Oak Ave, Mississauga, ON',
      systemSize: '10.5 kW',
      status: 'contacted',
      receivedAt: '1 day ago',
      priority: 'medium',
    },
    {
      id: 'lead-003',
      name: 'Mike Chen',
      address: '789 Pine Rd, Brampton, ON',
      systemSize: '8.5 kW',
      status: 'new',
      receivedAt: '2 days ago',
      priority: 'high',
    },
  ])

  const [applicationStatus] = useState({
    status: 'approved',
    approvedDate: '2024-01-15',
    nextRenewal: '2025-01-15',
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Dashboard Header */}
      <section className="pt-32 pb-8 bg-forest-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold font-display mb-2">Installer Dashboard</h1>
              <p className="text-white/90">Welcome back! Here's your business overview.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/for-installers/dashboard/profile"
                className="btn-outline bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Settings size={18} className="mr-2" />
                Profile
              </Link>
              <button className="btn-outline bg-white/10 border-white/20 text-white hover:bg-white/20 relative">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-maple-500 rounded-full text-xs flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Total Leads */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <Users className="text-sky-500" size={24} />
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalLeads}</div>
              <div className="text-sm text-gray-600">Leads Received</div>
            </div>

            {/* New Leads */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <Clock className="text-maple-500" size={24} />
                <span className="px-2 py-1 bg-maple-100 text-maple-700 text-xs font-semibold rounded">
                  New
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.newLeads}</div>
              <div className="text-sm text-gray-600">Awaiting Response</div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-green-500" size={24} />
                <span className="text-xs text-gray-500">Rate</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
            </div>

            {/* Avg Response Time */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="text-forest-500" size={24} />
                <span className="text-xs text-gray-500">Average</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.avgResponseTime}</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Leads */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Leads</h2>
                  <Link
                    href="/for-installers/dashboard/leads"
                    className="text-forest-600 hover:text-forest-700 font-semibold text-sm inline-flex items-center"
                  >
                    View All
                    <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-forest-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                          <p className="text-sm text-gray-600">{lead.address}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            lead.status === 'new'
                              ? 'bg-maple-100 text-maple-700'
                              : lead.status === 'contacted'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>System: {lead.systemSize}</span>
                        <span>•</span>
                        <span>{lead.receivedAt}</span>
                        {lead.priority === 'high' && (
                          <>
                            <span>•</span>
                            <span className="text-maple-600 font-semibold">High Priority</span>
                          </>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={`/for-installers/dashboard/leads/${lead.id}`}
                          className="btn-primary text-sm py-2 px-4"
                        >
                          View Details
                        </Link>
                        {lead.status === 'new' && (
                          <button className="btn-outline text-sm py-2 px-4">
                            Contact Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link
                    href="/for-installers/dashboard/leads"
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-forest-300 transition-colors"
                  >
                    <Users className="text-forest-500 mb-2" size={24} />
                    <h3 className="font-semibold text-gray-900 mb-1">View All Leads</h3>
                    <p className="text-sm text-gray-600">Browse and manage all your leads</p>
                  </Link>
                  
                  <Link
                    href="/for-installers/dashboard/profile"
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-forest-300 transition-colors"
                  >
                    <Settings className="text-forest-500 mb-2" size={24} />
                    <h3 className="font-semibold text-gray-900 mb-1">Update Profile</h3>
                    <p className="text-sm text-gray-600">Manage company info and settings</p>
                  </Link>
                  
                  <Link
                    href="/for-installers/dashboard/service-areas"
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-forest-300 transition-colors"
                  >
                    <MapPin className="text-forest-500 mb-2" size={24} />
                    <h3 className="font-semibold text-gray-900 mb-1">Service Areas</h3>
                    <p className="text-sm text-gray-600">Manage your service coverage</p>
                  </Link>
                  
                  <Link
                    href="/for-installers/dashboard/gallery"
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-forest-300 transition-colors"
                  >
                    <Award className="text-forest-500 mb-2" size={24} />
                    <h3 className="font-semibold text-gray-900 mb-1">Project Gallery</h3>
                    <p className="text-sm text-gray-600">Showcase your work</p>
                  </Link>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Application Status */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Account Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <div>
                      <p className="font-semibold text-gray-900">Approved</p>
                      <p className="text-xs text-gray-600">Since {new Date(applicationStatus.approvedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Next Renewal</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(applicationStatus.nextRenewal).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Performance</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Contacted</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.contacted}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-sky-500 h-2 rounded-full"
                        style={{ width: `${(stats.contacted / stats.totalLeads) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Closed</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.closed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(stats.closed / stats.totalLeads) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="bg-sky-50 rounded-xl p-6 border border-sky-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Resources</h2>
                <div className="space-y-2">
                  <Link href="/for-installers/help" className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-2">
                    <FileText size={16} />
                    Help & Documentation
                  </Link>
                  <Link href="/contact" className="text-sm text-forest-600 hover:text-forest-700 flex items-center gap-2">
                    <FileText size={16} />
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

