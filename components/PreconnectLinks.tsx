'use client'

import { useEffect } from 'react'

// Component to add preconnect links for performance optimization
// These help establish early connections to external domains
export function PreconnectLinks() {
  useEffect(() => {
    // Add preconnect links dynamically for external resources
    const preconnectLinks = [
      { rel: 'preconnect', href: 'https://images.unsplash.com', crossOrigin: 'anonymous' },
      { rel: 'dns-prefetch', href: 'https://images.unsplash.com' },
    ]

    preconnectLinks.forEach(({ rel, href, crossOrigin }) => {
      // Check if link already exists
      const existingLink = document.querySelector(`link[rel="${rel}"][href="${href}"]`)
      if (!existingLink) {
        const link = document.createElement('link')
        link.rel = rel
        link.href = href
        if (crossOrigin) {
          link.setAttribute('crossorigin', crossOrigin)
        }
        document.head.appendChild(link)
      }
    })
  }, [])

  return null
}

