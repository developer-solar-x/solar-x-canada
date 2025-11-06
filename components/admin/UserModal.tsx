'use client'

// User management modal component (Add/Edit)

import { useState, useEffect } from 'react'
import { X, User, Mail, Lock, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: UserFormData) => Promise<void>
  user?: any // Existing user data for edit mode
  mode: 'add' | 'edit'
}

export interface UserFormData {
  email: string
  full_name: string
  password?: string
  role: 'superadmin' | 'admin' | 'sales'
  is_active: boolean
}

export function UserModal({ isOpen, onClose, onSave, user, mode }: UserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    password: '',
    role: 'admin',
    is_active: true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        password: '', // Don't pre-fill password
        role: user.role || 'admin',
        is_active: user.is_active !== undefined ? user.is_active : true,
      })
    } else {
      // Reset form for add mode
      setFormData({
        email: '',
        full_name: '',
        password: '',
        role: 'admin',
        is_active: true,
      })
    }
    setError('')
  }, [isOpen, user, mode])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate form
      if (!formData.email || !formData.full_name) {
        throw new Error('Email and full name are required')
      }

      if (mode === 'add' && !formData.password) {
        throw new Error('Password is required when creating a new user')
      }

      if (formData.password && formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      // Prepare data (don't send password if empty in edit mode)
      const userData: UserFormData = {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role: formData.role,
        is_active: formData.is_active,
      }

      if (mode === 'add' || formData.password) {
        userData.password = formData.password
      }

      await onSave(userData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-navy-500">
            {mode === 'add' ? 'Add New User' : 'Edit User'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <User size={16} className="inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
              required
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
              required
              placeholder="user@example.com"
              disabled={mode === 'edit'} // Email cannot be changed after creation
            />
            {mode === 'edit' && (
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              Password
              {mode === 'edit' && <span className="text-gray-500 text-xs ml-2">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none pr-10"
                required={mode === 'add'}
                placeholder={mode === 'add' ? 'Enter password' : 'Enter new password (optional)'}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Shield size={16} className="inline mr-2" />
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'superadmin' | 'admin' | 'sales' })}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none"
              required
            >
              <option value="sales">Sales</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === 'superadmin' && 'Full access to all features'}
              {formData.role === 'admin' && 'Can manage leads and users'}
              {formData.role === 'sales' && 'Can view and manage leads only'}
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 text-red-500 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
              Active User
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

