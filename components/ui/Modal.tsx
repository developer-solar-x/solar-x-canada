'use client'

// Reusable modal component

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'info' | 'warning' | 'danger' | 'success'
  children?: React.ReactNode
}

export function Modal({
  isOpen, // Keep track of whether the modal should show
  onClose, // Allow the modal to close when needed
  onConfirm, // Optional confirm action when relevant
  title, // Simple text for the modal heading
  message, // Friendly paragraph that explains the content
  confirmText = 'Confirm', // Default text for the confirm button
  cancelText = 'Cancel', // Default text for the cancel button
  variant = 'info', // Style hint so colors feel consistent
  children, // Optional extra content such as tables or lists
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Get colors based on variant
  const variantStyles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      button: 'bg-blue-500 hover:bg-blue-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-500',
      button: 'bg-yellow-500 hover:bg-yellow-600',
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      button: 'bg-red-500 hover:bg-red-600',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      button: 'bg-green-500 hover:bg-green-600',
    },
  }

  const styles = variantStyles[variant]

  // Variant-specific cancel button styling (brand palette)
  const cancelBtnByVariant: Record<string, string> = {
    info: 'text-navy-600 bg-white border border-navy-200 hover:bg-navy-50',
    warning: 'text-yellow-700 bg-white border border-yellow-300 hover:bg-yellow-50',
    danger: 'text-navy-600 bg-white border border-red-300 hover:bg-red-50',
    success: 'text-green-700 bg-white border border-green-300 hover:bg-green-50',
  }

  // This wrapper lets the whole modal scroll gracefully on short screens
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative mt-6 sm:mt-0 bg-white rounded-lg shadow-xl w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl animate-in fade-in zoom-in duration-200 max-h-[calc(100vh-3rem)] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${styles.border} ${styles.bg}`}>
          <h3 className="text-lg font-bold text-navy-500">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <p className="text-gray-700 leading-relaxed">
            {message}
          </p>
          {children && (
            <div className="mt-4 space-y-4">
              {children}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${cancelBtnByVariant[variant]}`}
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${styles.button}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

