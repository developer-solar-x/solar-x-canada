'use client'

import { Mail } from 'lucide-react'
import { isValidEmail } from '@/lib/utils'
import type { EmailInputProps } from '../types'

export function EmailInput({ email, onEmailChange, error, disabled }: EmailInputProps) {
  return (
    <div className="text-left">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Email Address <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="email"
          value={email}
          onChange={(e) => {
            onEmailChange(e.target.value)
          }}
          placeholder="your@email.com"
          className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-red-100 outline-none transition-colors ${
            error && !isValidEmail(email) ? 'border-red-500' : 'border-gray-200 focus:border-red-500'
          }`}
          disabled={disabled}
          autoComplete="email"
          required
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {email && isValidEmail(email) ? (
          <span className="text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            Your progress will be saved automatically
          </span>
        ) : (
          'Required to save your progress and continue later'
        )}
      </p>
    </div>
  )
}

