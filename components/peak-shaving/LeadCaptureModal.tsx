'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface LeadCaptureModalProps {
  isOpen: boolean
  onVerified: (email: string) => void
  onClose?: () => void
}

type Step = 'email' | 'verify' | 'checking'

export function LeadCaptureModal({ isOpen, onVerified, onClose }: LeadCaptureModalProps) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  const [isSolarXEmail, setIsSolarXEmail] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('email')
      setEmail('')
      setVerificationCode('')
      setLoading(false)
      setError(null)
      setSuccess(null)
      setCodeSent(false)
      setIsSolarXEmail(false)
    }
  }, [isOpen])

  // Check if email is @solar-x.ca (but still require verification)
  useEffect(() => {
    const normalizedEmail = email.toLowerCase().trim()
    if (normalizedEmail.endsWith('@solar-x.ca') && normalizedEmail.includes('@')) {
      setIsSolarXEmail(true)
    } else {
      setIsSolarXEmail(false)
    }
  }, [email])

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/peak-shaving/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      // Solar-X emails still need to verify with code (no auto-verification)
      // They just get a different message indicating unlimited access

      setCodeSent(true)
      setSuccess('Verification code sent to your email!')
      setStep('verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/peak-shaving/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }

      setSuccess(isSolarXEmail ? 'Email verified successfully! Unlimited access granted.' : 'Email verified successfully!')
      
      // Check access before granting
      const accessResponse = await fetch('/api/peak-shaving/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const accessData = await accessResponse.json()

      if (!accessData.canAccess) {
        // Access denied - limit reached or other issue
        const errorMsg = isSolarXEmail 
          ? accessData.reason || 'Access denied'
          : accessData.reason || 'Access denied. You have reached your usage limit (2 uses).'
        setError(errorMsg)
        // Clear any stored email to force re-verification
        if (typeof window !== 'undefined') {
          localStorage.removeItem('peak_shaving_verified_email')
        }
        return
      }

      // For Solar-X emails, don't record access (no logging, unlimited access)
      if (isSolarXEmail) {
        setTimeout(() => {
          onVerified(email)
        }, 1000)
        return
      }

      // Record access for regular users (this increments usage count)
      const recordResponse = await fetch('/api/peak-shaving/record-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const recordData = await recordResponse.json()

      if (!recordResponse.ok) {
        // Failed to record access - limit reached or other error
        setError(recordData.error || 'Failed to grant access. You may have reached your usage limit (2 uses).')
        // Clear localStorage to ensure limit is enforced
        if (typeof window !== 'undefined') {
          localStorage.removeItem('peak_shaving_verified_email')
        }
        return
      }

      // Successfully verified and access recorded
      setTimeout(() => {
        onVerified(email)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setCodeSent(false)
    setVerificationCode('')
    setError(null)
    await handleSendCode()
  }

  if (!isOpen) return null


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 relative animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-400" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-navy-600 rounded-full mb-4">
            <Lock size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Peak Shaving Calculator
          </h2>
          <p className="text-sm text-gray-600">
            {step === 'email' && 'Enter your email to get started'}
            {step === 'verify' && 'Enter the verification code sent to your email'}
            {step === 'checking' && 'Verifying access...'}
          </p>
        </div>

        {/* Email Step */}
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      handleSendCode()
                    }
                  }}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

            <button
              onClick={handleSendCode}
              disabled={loading || !email}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-navy-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-navy-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Send Verification Code
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              You'll receive a 6-digit code via email. Regular users get 2 free uses.
            </p>
          </div>
        )}

        {/* Verify Code Step */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setVerificationCode(value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && verificationCode.length === 6) {
                    handleVerifyCode()
                  }
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-center text-2xl font-mono tracking-widest"
                disabled={loading}
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
                <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('email')
                  setVerificationCode('')
                  setError(null)
                  setSuccess(null)
                }}
                disabled={loading}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-navy-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-navy-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Verify
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleResendCode}
              disabled={loading}
              className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend code
            </button>
          </div>
        )}

        {/* Checking Step */}
        {step === 'checking' && (
          <div className="text-center py-8">
            <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Verifying access...</p>
          </div>
        )}
      </div>
    </div>
  )
}

