'use client'

import { useState } from 'react'
import { X, Package, Lightbulb, Bug, Mail, MapPin, Calendar, CheckCircle, Clock, AlertCircle, XCircle, Save, MessageSquare } from 'lucide-react'

interface FeedbackEntry {
  id: string
  type: 'product' | 'improvement' | 'bug'
  province?: string
  email?: string
  description: string
  status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'closed'
  reviewed: boolean
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  created_at: string
  [key: string]: any
}

interface FeedbackDetailViewProps {
  feedback: FeedbackEntry
  onClose: () => void
  onStatusUpdate: (id: string, status: string, reviewNotes?: string) => Promise<void>
}

export function FeedbackDetailView({ feedback, onClose, onStatusUpdate }: FeedbackDetailViewProps) {
  const [status, setStatus] = useState(feedback.status)
  const [reviewNotes, setReviewNotes] = useState(feedback.reviewNotes || '')
  const [isSaving, setIsSaving] = useState(false)

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'product':
        return { icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', label: 'Product Suggestion' }
      case 'improvement':
        return { icon: Lightbulb, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', label: 'Improvement Suggestion' }
      case 'bug':
        return { icon: Bug, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', label: 'Bug Report' }
      default:
        return { icon: MessageSquare, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', label: 'Feedback' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'new':
        return { icon: Clock, color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-200', label: 'New' }
      case 'reviewed':
        return { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', label: 'Reviewed' }
      case 'in_progress':
        return { icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', label: 'In Progress' }
      case 'resolved':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', label: 'Resolved' }
      case 'closed':
        return { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', label: 'Closed' }
      default:
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', label: 'Unknown' }
    }
  }

  const handleSaveStatus = async () => {
    setIsSaving(true)
    try {
      await onStatusUpdate(feedback.id, status, reviewNotes)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const typeConfig = getTypeConfig(feedback.type)
  const statusConfig = getStatusConfig(status)
  const TypeIcon = typeConfig.icon

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${typeConfig.bgColor} rounded-lg flex items-center justify-center`}>
              <TypeIcon className={typeConfig.color} size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy-500">{typeConfig.label}</h2>
              <p className="text-sm text-gray-600">Feedback ID: {feedback.id}</p>
            </div>
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
                <h3 className="text-xl font-bold text-gray-900">Feedback Status</h3>
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
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
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

          {/* Feedback Details */}
          <div className="card p-6">
            <h3 className="text-xl font-bold text-navy-500 mb-4 flex items-center gap-2">
              <MessageSquare size={24} />
              Feedback Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-line leading-relaxed">{feedback.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {feedback.province && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Province</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <MapPin size={16} className="text-gray-400" />
                      {feedback.province}
                    </div>
                  </div>
                )}

                {feedback.email && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail size={16} className="text-gray-400" />
                      <a href={`mailto:${feedback.email}`} className="text-navy-600 hover:text-navy-700">
                        {feedback.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

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
                  <p className="font-semibold text-gray-900">Feedback Submitted</p>
                  <p className="text-sm text-gray-600">
                    {new Date(feedback.created_at).toLocaleDateString('en-CA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              
              {feedback.reviewedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-forest-500 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-gray-900">Review Completed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(feedback.reviewedAt).toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {feedback.reviewedBy && (
                      <p className="text-xs text-gray-500">Reviewed by: {feedback.reviewedBy}</p>
                    )}
                  </div>
                </div>
              )}

              {feedback.reviewNotes && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Previous Review Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{feedback.reviewNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

