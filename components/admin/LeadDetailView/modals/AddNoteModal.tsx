'use client'

import { X } from 'lucide-react'

interface AddNoteModalProps {
  isOpen: boolean
  onClose: () => void
  noteText: string
  onNoteTextChange: (text: string) => void
  onSave: () => void
  saving: boolean
}

export function AddNoteModal({ 
  isOpen, 
  onClose, 
  noteText, 
  onNoteTextChange, 
  onSave, 
  saving 
}: AddNoteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-600">Add Note</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Note
          </label>
          <textarea
            value={noteText}
            onChange={(e) => onNoteTextChange(e.target.value)}
            placeholder="Enter your note here..."
            rows={6}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 outline-none resize-none"
            disabled={saving}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button 
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            disabled={saving || !noteText.trim()}
            className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  )
}

