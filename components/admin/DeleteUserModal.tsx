'use client'

// Delete user confirmation modal

import { useState } from 'react'
import { X, AlertTriangle, User } from 'lucide-react'

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  userName: string
  userEmail: string
}

export function DeleteUserModal({ isOpen, onClose, onConfirm, userName, userEmail }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleConfirm = async () => {
    setError('')
    setLoading(true)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-red-600">Delete User</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-500" />
                  <span className="font-semibold text-gray-900">{userName}</span>
                </div>
                <p className="text-sm text-gray-600">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

