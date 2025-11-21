'use client'

import { useState } from 'react'
import { X, Building2, User, Mail, Phone, Globe, MapPin, Award, Shield, FileText, CheckCircle, XCircle, AlertCircle, Clock, Save, Calendar } from 'lucide-react'

interface InstallerApplication {
  id: string
  companyName: string
  contactPersonName: string
  contactEmail: string
  contactPhone: string
  websiteUrl?: string
  yearsInBusiness?: string
  primaryServiceProvinces?: string[]
  serviceAreaDescription?: string
  certifications?: any
  generalLiabilityCoverage?: string
  numberOfInstalls?: string
  typicalSystemSizeRange?: string
  workmanshipWarrantyYears?: string
  productWarrantySupport?: string
  status: 'pending_review' | 'approved' | 'rejected' | 'need_more_info'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
  [key: string]: any
}

interface InstallerDetailViewProps {
  application: InstallerApplication
  onClose: () => void
  onStatusUpdate: (id: string, status: string, notes?: string) => Promise<void>
}

export function InstallerDetailView({ application, onClose, onStatusUpdate }: InstallerDetailViewProps) {
  const [status, setStatus] = useState(application.status)
  const [reviewNotes, setReviewNotes] = useState(application.reviewNotes || '')
  const [isSaving, setIsSaving] = useState(false)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', label: 'Approved' }
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', label: 'Rejected' }
      case 'need_more_info':
        return { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', label: 'Need More Info' }
      default:
        return { icon: Clock, color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', label: 'Pending Review' }
    }
  }

  const handleSaveStatus = async () => {
    setIsSaving(true)
    try {
      await onStatusUpdate(application.id, status, reviewNotes)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const statusConfig = getStatusConfig(status)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-navy-500">{application.companyName}</h2>
            <p className="text-sm text-gray-600">Application ID: {application.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className={`border-2 ${statusConfig.borderColor} rounded-lg p-6 ${statusConfig.bgColor}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <statusConfig.icon className={statusConfig.color} size={24} />
                <h3 className="text-xl font-bold text-gray-900">Application Status</h3>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                >
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="need_more_info">Need More Info</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Add review notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              onClick={handleSaveStatus}
              disabled={isSaving}
              className="btn-primary inline-flex items-center"
            >
              {isSaving ? (
                <>
                  <Clock className="animate-spin mr-2" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Status
                </>
              )}
            </button>
          </div>

          {/* Company Information */}
          <div className="card p-6">
            <h3 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
              <Building2 size={24} />
              Company Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
                <p className="text-gray-900">{application.companyName}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person</label>
                <p className="text-gray-900">{application.contactPersonName}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  {application.contactEmail}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  {application.contactPhone}
                </p>
              </div>
              {application.websiteUrl && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Globe size={14} className="text-gray-400" />
                    <a href={application.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-navy-600 hover:text-navy-700">
                      {application.websiteUrl}
                    </a>
                  </p>
                </div>
              )}
              {application.yearsInBusiness && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Years in Business</label>
                  <p className="text-gray-900">{application.yearsInBusiness}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Areas */}
          {application.primaryServiceProvinces && application.primaryServiceProvinces.length > 0 && (
            <div className="card p-6">
              <h3 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
                <MapPin size={24} />
                Service Areas
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {application.primaryServiceProvinces.map((province, idx) => (
                  <span key={idx} className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-semibold">
                    {province}
                  </span>
                ))}
              </div>
              {application.serviceAreaDescription && (
                <p className="text-gray-700">{application.serviceAreaDescription}</p>
              )}
            </div>
          )}

          {/* Certifications */}
          {application.certifications && (
            <div className="card p-6">
              <h3 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
                <Award size={24} />
                Certifications
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                {application.certifications.esa && (
                  <p>✓ ESA / Provincial Electrical Certification</p>
                )}
                {application.certifications.provincial && (
                  <p>✓ Other Provincial Certifications</p>
                )}
                {application.certifications.manufacturer && application.certifications.manufacturer.length > 0 && (
                  <div>
                    <p className="font-semibold mb-1">Manufacturer Certifications:</p>
                    <ul className="list-disc list-inside ml-2">
                      {application.certifications.manufacturer.map((m: string, idx: number) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {application.certifications.other && (
                  <p>Other: {application.certifications.other}</p>
                )}
              </div>
            </div>
          )}

          {/* Insurance */}
          {application.generalLiabilityCoverage && (
            <div className="card p-6">
              <h3 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
                <Shield size={24} />
                Insurance
              </h3>
              <p className="text-gray-900">
                <span className="font-semibold">General Liability Coverage:</span> {application.generalLiabilityCoverage}
              </p>
            </div>
          )}

          {/* Experience */}
          {(application.numberOfInstalls || application.typicalSystemSizeRange) && (
            <div className="card p-6">
              <h3 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
                <FileText size={24} />
                Experience
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {application.numberOfInstalls && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Installs</label>
                    <p className="text-gray-900">{application.numberOfInstalls}</p>
                  </div>
                )}
                {application.typicalSystemSizeRange && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Typical System Size Range</label>
                    <p className="text-gray-900">{application.typicalSystemSizeRange}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warranty */}
          {(application.workmanshipWarrantyYears || application.productWarrantySupport) && (
            <div className="card p-6">
              <h3 className="text-xl font-bold text-navy-500 mb-4">Warranty Information</h3>
              <div className="space-y-2">
                {application.workmanshipWarrantyYears && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Workmanship Warranty:</span> {application.workmanshipWarrantyYears} years
                  </p>
                )}
                {application.productWarrantySupport && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Product Warranty Support:</span> {application.productWarrantySupport}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card p-6">
            <h3 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
              <Calendar size={24} />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                <div>
                  <p className="font-semibold text-gray-900">Application Submitted</p>
                  <p className="text-sm text-gray-600">
                    {new Date(application.submittedAt).toLocaleDateString('en-CA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {application.reviewedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-forest-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-gray-900">Review Completed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(application.reviewedAt).toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {application.reviewedBy && (
                      <p className="text-xs text-gray-500">Reviewed by: {application.reviewedBy}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

