'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog on client side
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('PostHog loaded')
          }
        },
        capture_pageview: false, // We'll handle pageviews manually
        capture_pageleave: true,
      })
    }
  }, [])

  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      // Capture pageview with full URL
      let url = window.location.pathname
      if (searchParams && searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams])

  return <>{children}</>
}

// Helper function to track estimate events
export function trackEstimateEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(eventName, properties)
  }
}

// Track step progression in estimates
export function trackEstimateStep(
  stepName: string,
  stepNumber: number,
  totalSteps: number,
  estimateType: 'estimator' | 'quick-estimate',
  additionalProperties?: Record<string, any>
) {
  trackEstimateEvent('estimate_step_viewed', {
    step_name: stepName,
    step_number: stepNumber,
    total_steps: totalSteps,
    estimate_type: estimateType,
    progress_percentage: Math.round((stepNumber / totalSteps) * 100),
    ...additionalProperties,
  })
}

// Track step completion
export function trackEstimateStepComplete(
  stepName: string,
  stepNumber: number,
  totalSteps: number,
  estimateType: 'estimator' | 'quick-estimate',
  additionalProperties?: Record<string, any>
) {
  trackEstimateEvent('estimate_step_completed', {
    step_name: stepName,
    step_number: stepNumber,
    total_steps: totalSteps,
    estimate_type: estimateType,
    progress_percentage: Math.round((stepNumber / totalSteps) * 100),
    ...additionalProperties,
  })
}

// Track estimate started
export function trackEstimateStarted(
  estimateType: 'estimator' | 'quick-estimate',
  properties?: Record<string, any>
) {
  trackEstimateEvent('estimate_started', {
    estimate_type: estimateType,
    ...properties,
  })
}

// Track estimate abandoned (user leaves without completing)
export function trackEstimateAbandoned(
  stepName: string,
  stepNumber: number,
  totalSteps: number,
  estimateType: 'estimator' | 'quick-estimate',
  timeSpent?: number,
  properties?: Record<string, any>
) {
  trackEstimateEvent('estimate_abandoned', {
    step_name: stepName,
    step_number: stepNumber,
    total_steps: totalSteps,
    estimate_type: estimateType,
    progress_percentage: Math.round((stepNumber / totalSteps) * 100),
    time_spent_seconds: timeSpent,
    ...properties,
  })
}

// Track estimate completed
export function trackEstimateCompleted(
  estimateType: 'estimator' | 'quick-estimate',
  totalSteps: number,
  timeSpent?: number,
  properties?: Record<string, any>
) {
  trackEstimateEvent('estimate_completed', {
    estimate_type: estimateType,
    total_steps: totalSteps,
    time_spent_seconds: timeSpent,
    ...properties,
  })
}

// Track when user goes back to previous step
export function trackEstimateStepBack(
  stepName: string,
  stepNumber: number,
  estimateType: 'estimator' | 'quick-estimate'
) {
  trackEstimateEvent('estimate_step_back', {
    step_name: stepName,
    step_number: stepNumber,
    estimate_type: estimateType,
  })
}
