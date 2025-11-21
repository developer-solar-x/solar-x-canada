'use client'

// Individual lead detail page (mock UI, no backend)

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Zap, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  MessageSquare,
  FileText,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  // Mock lead data - will be replaced with real data when backend is connected
  const [lead] = useState({
    id: leadId,
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(416) 555-0101',
    address: '123 Main Street',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5H 2N2',
    systemSize: '7.0 kW',
    numPanels: 14,
    status: 'new' as const,
    priority: 'high' as const,
    receivedAt: '2024-01-20T10:30:00',
    monthlyBill: 200,
    annualUsage: 11200,
    estimatedSavings: 1315,
    paybackYears: 13.5,
    notes: '',
  })

  const [status, setStatus] = useState(lead.status)
  const [notes, setNotes] = useState(lead.notes)
  const [isEditingNotes, setIsEditingNotes] = useState(false)

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <section className="pt-32 pb-8 bg-forest-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/for-installers/dashboard/leads" 
            className="text-white/80 hover:text-white text-sm mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to Leads
          </Link>
          <h1 className="text-4xl font-bold font-display">Lead Details</h1>
        </div>
      </section>

      {/* Lead Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                    <p className="text-gray-900">{lead.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <a href={`mailto:${lead.email}`} className="text-forest-600 hover:text-forest-700">
                        {lead.email}
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <a href={`tel:${lead.phone}`} className="text-forest-600 hover:text-forest-700">
                        {lead.phone}
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-900">{lead.address}</p>
                        <p className="text-gray-600">{lead.city}, {lead.province} {lead.postalCode}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <a
                    href={`mailto:${lead.email}`}
                    className="btn-primary inline-flex items-center"
                  >
                    <Mail size={18} className="mr-2" />
                    Send Email
                  </a>
                  <a
                    href={`tel:${lead.phone}`}
                    className="btn-outline inline-flex items-center"
                  >
                    <Phone size={18} className="mr-2" />
                    Call Now
                  </a>
                </div>
              </div>

              {/* System Details */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">System Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-forest-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="text-forest-500" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">System Size</p>
                        <p className="text-2xl font-bold text-gray-900">{lead.systemSize}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{lead.numPanels} solar panels</p>
                  </div>
                  
                  <div className="bg-sky-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="text-sky-500" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Monthly Bill</p>
                        <p className="text-2xl font-bold text-gray-900">${lead.monthlyBill}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Annual usage: {lead.annualUsage.toLocaleString()} kWh</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="text-green-500" size={24} />
                      <div>
                        <p className="text-sm text-gray-600">Estimated Savings</p>
                        <p className="text-2xl font-bold text-gray-900">${lead.estimatedSavings}/year</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Payback: {lead.paybackYears} years</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="text-forest-500" size={24} />
                    Notes
                  </h2>
                  {!isEditingNotes && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="btn-outline text-sm"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit Notes
                    </button>
                  )}
                </div>
                
                {isEditingNotes ? (
                  <div className="space-y-3">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      placeholder="Add notes about this lead..."
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setIsEditingNotes(false)
                          // TODO: Save notes to backend
                        }}
                        className="btn-primary"
                      >
                        Save Notes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingNotes(false)
                          setNotes(lead.notes)
                        }}
                        className="btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                    {notes ? (
                      <p className="text-gray-700 whitespace-pre-line">{notes}</p>
                    ) : (
                      <p className="text-gray-400 italic">No notes yet. Click "Edit Notes" to add notes about this lead.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-gray-900 mb-4">Status</h3>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as any)
                    // TODO: Update status in backend
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent mb-4"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="closed">Closed</option>
                  <option value="lost">Lost</option>
                </select>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} />
                    Received: {new Date(lead.receivedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={14} />
                    {new Date(lead.receivedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-gray-900 mb-2">Priority</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  lead.priority === 'high' ? 'bg-maple-100 text-maple-700' :
                  lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full btn-primary text-left">
                    <MessageSquare size={18} className="mr-2" />
                    Mark as Contacted
                  </button>
                  <button className="w-full btn-outline text-left">
                    <CheckCircle size={18} className="mr-2" />
                    Mark as Qualified
                  </button>
                  <button className="w-full btn-outline text-left">
                    <XCircle size={18} className="mr-2" />
                    Mark as Lost
                  </button>
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

