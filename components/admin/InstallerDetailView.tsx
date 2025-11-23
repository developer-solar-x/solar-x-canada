'use client'

import { useState } from 'react'
import { X, Building2, User, Mail, Phone, Globe, MapPin, Award, Shield, FileText, CheckCircle, XCircle, AlertCircle, Clock, Save, Calendar, ExternalLink, Download, Eye } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-navy-500 to-navy-600 text-white px-8 py-6 flex items-center justify-between z-10 shadow-lg">
          <div>
            <h2 className="text-3xl font-bold mb-1">{application.companyName}</h2>
            <p className="text-sm text-navy-100">Installer Application Details</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          {/* Application ID Section */}
          <div className="bg-gradient-to-r from-navy-50 to-blue-50 border-2 border-navy-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">Application ID</label>
                <div className="flex items-center gap-3">
                  <code className="text-lg font-mono font-bold text-navy-700 bg-white px-4 py-2 rounded-lg border border-navy-200">
                    {application.id}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(application.id)
                      alert('Application ID copied to clipboard!')
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                    title="Copy Application ID"
                  >
                    <Download size={16} />
                    Copy ID
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className={`border-2 ${statusConfig.borderColor} rounded-xl p-6 ${statusConfig.bgColor} shadow-sm`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
                  <statusConfig.icon className={statusConfig.color} size={28} />
                </div>
                <div>
                <h3 className="text-xl font-bold text-gray-900">Application Status</h3>
                  <p className="text-sm text-gray-600">Update the application status and add review notes</p>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all bg-white font-medium"
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
                  placeholder="Add review notes or feedback..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all resize-none"
                />
              </div>
            </div>
            
            <button
              onClick={handleSaveStatus}
              disabled={isSaving}
              className="inline-flex items-center px-6 py-3 bg-navy-600 hover:bg-navy-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-navy-500 mb-6 flex items-center gap-3">
              <div className="p-2 bg-navy-50 rounded-lg">
                <Building2 size={24} className="text-navy-600" />
              </div>
              Company Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Company Name</label>
                <p className="text-gray-900 font-medium text-lg">{application.companyName}</p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact Person</label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  {application.contactPersonName}
                </p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                <a href={`mailto:${application.contactEmail}`} className="text-navy-600 hover:text-navy-700 font-medium flex items-center gap-2 group">
                  <Mail size={16} className="text-gray-400 group-hover:text-navy-600 transition-colors" />
                  {application.contactEmail}
                </a>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</label>
                <a href={`tel:${application.contactPhone}`} className="text-navy-600 hover:text-navy-700 font-medium flex items-center gap-2 group">
                  <Phone size={16} className="text-gray-400 group-hover:text-navy-600 transition-colors" />
                  {application.contactPhone}
                </a>
              </div>
              {application.websiteUrl && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Website</label>
                  <a href={application.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-navy-600 hover:text-navy-700 font-medium flex items-center gap-2 group">
                    <Globe size={16} className="text-gray-400 group-hover:text-navy-600 transition-colors" />
                    <span className="truncate">{application.websiteUrl}</span>
                    <ExternalLink size={14} className="text-gray-400 group-hover:text-navy-600 transition-colors" />
                  </a>
                </div>
              )}
              {application.yearsInBusiness && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Years in Business</label>
                  <p className="text-gray-900 font-medium">{application.yearsInBusiness}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Areas */}
          {application.primaryServiceProvinces && application.primaryServiceProvinces.length > 0 && (
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-navy-500 mb-6 flex items-center gap-3">
                <div className="p-2 bg-sky-50 rounded-lg">
                  <MapPin size={24} className="text-sky-600" />
                </div>
                Service Areas
              </h3>
              <div className="flex flex-wrap gap-3 mb-4">
                {application.primaryServiceProvinces.map((province, idx) => (
                  <span key={idx} className="px-4 py-2 bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 rounded-lg text-sm font-semibold border border-sky-200 shadow-sm">
                    {province}
                  </span>
                ))}
              </div>
              {application.serviceAreaDescription && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{application.serviceAreaDescription}</p>
                </div>
              )}
            </div>
          )}

          {/* Certifications */}
          {application.certifications && (
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-navy-500 mb-6 flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Award size={24} className="text-amber-600" />
                </div>
                Certifications & Documents
              </h3>
              <div className="space-y-4">
                {application.certifications.esa && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <p className="font-semibold text-gray-900">ESA / Provincial Electrical Certification</p>
                      </div>
                      {typeof application.certifications.esa === 'string' && (
                        <a href={application.certifications.esa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 hover:bg-green-50 rounded-lg font-medium transition-all shadow-sm hover:shadow">
                          <Eye size={16} />
                          View
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {application.certifications.provincial && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-blue-600" />
                        <p className="font-semibold text-gray-900">Other Provincial Certifications</p>
                      </div>
                      {typeof application.certifications.provincial === 'string' && (
                        <a href={application.certifications.provincial} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-all shadow-sm hover:shadow">
                          <Eye size={16} />
                          View
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {application.certifications.manufacturer && application.certifications.manufacturer.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-900 mb-3">Manufacturer Certifications</p>
                    <div className="space-y-2">
                      {application.certifications.manufacturer.map((m: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-purple-600" />
                            <span className="font-medium text-gray-900">{typeof m === 'string' ? m : (m.name || 'Unknown')}</span>
                          </div>
                          {typeof m !== 'string' && m.url && (
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-300 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-medium transition-all">
                              <Eye size={14} />
                              View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {application.certifications.other && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-gray-600" />
                        <p className="font-semibold text-gray-900">Other Certifications</p>
                      </div>
                      {typeof application.certifications.other === 'string' && (
                        <a href={application.certifications.other} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-all shadow-sm hover:shadow">
                          <Eye size={16} />
                          View
                        </a>
                      )}
                    </div>
                    {application.certifications.otherDescription && (
                      <p className="text-gray-600 text-sm mt-2 pl-6">{application.certifications.otherDescription}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Insurance */}
          {application.generalLiabilityCoverage && (
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-navy-500 mb-6 flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Shield size={24} className="text-red-600" />
                </div>
                Insurance
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-gray-900">
                  <span className="font-semibold text-red-700">General Liability Coverage:</span>
                  <span className="ml-2 text-lg font-bold text-gray-900">{application.generalLiabilityCoverage}</span>
              </p>
                {application.insuranceProof && (
                  <a href={application.insuranceProof} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-lg font-medium transition-all shadow-sm hover:shadow">
                    <FileText size={16} />
                    View Insurance Proof
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {(application.numberOfInstalls || application.typicalSystemSizeRange) && (
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-navy-500 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <FileText size={24} className="text-indigo-600" />
                </div>
                Experience
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {application.numberOfInstalls && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Number of Installs</label>
                    <p className="text-2xl font-bold text-gray-900">{application.numberOfInstalls}</p>
                  </div>
                )}
                {application.typicalSystemSizeRange && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Typical System Size Range</label>
                    <p className="text-2xl font-bold text-gray-900">{application.typicalSystemSizeRange}</p>
                  </div>
                )}
              </div>
              {application.projectPhotos && application.projectPhotos.length > 0 && (
                <div className="mt-6">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Project Photos</label>
                  <div className="grid grid-cols-3 gap-3">
                    {application.projectPhotos.slice(0, 6).map((photo: string, idx: number) => (
                      <a key={idx} href={photo} target="_blank" rel="noopener noreferrer" className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-navy-400 transition-all">
                        <img src={photo} alt={`Project photo ${idx + 1}`} className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warranty */}
          {(application.workmanshipWarrantyYears || application.productWarrantySupport) && (
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-navy-500 mb-6 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Shield size={24} className="text-emerald-600" />
                </div>
                Warranty Information
              </h3>
              <div className="space-y-4">
                {application.workmanshipWarrantyYears && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Workmanship Warranty</label>
                    <p className="text-2xl font-bold text-gray-900">{application.workmanshipWarrantyYears} years</p>
                  </div>
                )}
                {application.productWarrantySupport && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Product Warranty Support</label>
                    <p className="text-gray-700 leading-relaxed">{application.productWarrantySupport}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-navy-500 mb-6 flex items-center gap-3">
              <div className="p-2 bg-sky-50 rounded-lg">
                <Calendar size={24} className="text-sky-600" />
              </div>
              Timeline
            </h3>
            <div className="relative pl-8 space-y-6">
              {/* Vertical line */}
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sky-400 to-gray-300"></div>
              
              <div className="relative flex items-start gap-4">
                <div className="absolute left-[-29px] top-1 w-6 h-6 bg-sky-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex-1 bg-sky-50 border border-sky-200 rounded-lg p-4">
                  <p className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Clock size={16} className="text-sky-600" />
                    Application Submitted
                  </p>
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
                <div className="relative flex items-start gap-4">
                  <div className="absolute left-[-29px] top-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                  <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      Review Completed
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(application.reviewedAt).toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {application.reviewedBy && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <User size={12} />
                        Reviewed by: {application.reviewedBy}
                      </p>
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

