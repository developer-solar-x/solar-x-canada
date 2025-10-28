'use client'

// Banner to resume saved estimator progress

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw, X } from 'lucide-react'
import { getSavedProgressSummary, clearEstimatorProgress } from '@/lib/estimator-storage'
import { Modal } from '@/components/ui/Modal'

export function ResumeEstimateBanner() {
  const [progressInfo, setProgressInfo] = useState<ReturnType<typeof getSavedProgressSummary>>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showDismissModal, setShowDismissModal] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)

  // Check for saved progress on mount
  useEffect(() => {
    const info = getSavedProgressSummary()
    if (info) {
      setProgressInfo(info)
      setShowBanner(true)
    }
  }, [])

  const handleDismiss = () => {
    setShowDismissModal(true)
  }

  const confirmDismiss = () => {
    setShowBanner(false)
    setShowDismissModal(false)
  }

  const handleClearProgress = () => {
    setShowClearModal(true)
  }

  const confirmClearProgress = () => {
    clearEstimatorProgress()
    setShowBanner(false)
    setProgressInfo(null)
    setShowClearModal(false)
  }

  // Don't render if no saved progress or banner dismissed
  if (!showBanner || !progressInfo) {
    return null
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white py-4 px-4 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Progress Info */}
          <div className="flex items-start gap-3 flex-1">
            <div className="bg-white/20 p-2 rounded-lg">
              <RotateCcw size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">
                Resume Your Solar Estimate
              </h3>
              <p className="text-sm text-blue-50">
                {progressInfo.mode === 'easy' ? 'Quick Estimate' : 'Detailed Analysis'} 
                {' • '}
                Step {progressInfo.step} of 7 
                {' • '}
                {progressInfo.stepName}
                {progressInfo.address && ` • ${progressInfo.address}`}
              </p>
              <p className="text-xs text-blue-100 mt-1">
                Saved {progressInfo.timeSince}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/estimator"
              className="flex-1 sm:flex-initial bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
            >
              Continue
            </Link>
            <button
              onClick={handleClearProgress}
              className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              Clear & Start Over
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Dismiss banner"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Dismiss Banner Modal */}
    <Modal
      isOpen={showDismissModal}
      onClose={() => setShowDismissModal(false)}
      onConfirm={confirmDismiss}
      title="Dismiss Banner?"
      message="This will only hide the banner. Your progress will still be saved. To start fresh, click 'Clear & Start Over' in the banner."
      confirmText="Dismiss Banner"
      cancelText="Keep Banner"
      variant="info"
    />

    {/* Clear Progress Modal */}
    <Modal
      isOpen={showClearModal}
      onClose={() => setShowClearModal(false)}
      onConfirm={confirmClearProgress}
      title="Clear Saved Progress?"
      message="Are you sure you want to delete your saved progress? This cannot be undone and you will need to start your estimate from the beginning."
      confirmText="Clear Progress"
      cancelText="Keep Progress"
      variant="danger"
    />
    </>
  )
}

