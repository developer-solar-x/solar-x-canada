// Cache management API endpoint for development

import { NextResponse } from 'next/server'
import { getCacheStats, clearCache } from '@/lib/cache'

// Force dynamic rendering to prevent static analysis issues
export const dynamic = 'force-dynamic'

// GET: Get cache statistics
export async function GET() {
  try {
    const stats = getCacheStats()
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        sizeKB: Math.round(stats.size / 1024 * 100) / 100,
        sizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get cache stats' },
      { status: 500 }
    )
  }
}

// DELETE: Clear cache
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get('prefix') || undefined

    clearCache(prefix)

    return NextResponse.json({
      success: true,
      message: prefix 
        ? `Cache cleared for prefix: ${prefix}` 
        : 'All cache cleared'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

