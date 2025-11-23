'use client'

// Admin login page with mock credentials
// Protects admin dashboard from unauthorized access

import { useState, FormEvent } from 'react'
import { Lock, Mail, AlertCircle, Eye, EyeOff, LayoutDashboard } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  // Form state management
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Call login API endpoint
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Successful login - redirect to admin dashboard
      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 via-navy-600 to-navy-700 flex items-center justify-center p-4">
      {/* Background pattern decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md">
        <div className="card bg-white shadow-2xl p-8 md:p-10">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-navy-500 rounded-xl mb-6">
              <LayoutDashboard className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-navy-500 mb-2">Admin Portal</h1>
            <p className="text-gray-600">Sign in to access the dashboard</p>
          </div>

          {/* Error message display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}


          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email input field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-navy-500 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-colors"
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password input field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-navy-500 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-colors"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                {/* Toggle password visibility button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-navy-500 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 relative"
            >
              {loading ? (
                <>
                  <svg 
                    className="w-5 h-5 animate-spin text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Lock size={20} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Back to home link */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-gray-600 hover:text-red-500 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>

        {/* Footer security notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white/80">
            Secure admin access for authorized team members only
          </p>
        </div>
      </div>
    </div>
  )
}

