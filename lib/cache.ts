// Simple file-based cache for API responses during development
// Helps avoid rate limits and speeds up development

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

// Cache directory path
const CACHE_DIR = path.join(process.cwd(), '.cache')

// Cache enabled by default in development, disabled in production
const CACHE_ENABLED = process.env.ENABLE_API_CACHE !== 'false' && process.env.NODE_ENV !== 'production'

// Default TTL (time to live) in milliseconds - 24 hours
const DEFAULT_TTL = 24 * 60 * 60 * 1000

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }
}

// Generate cache key from data
function generateCacheKey(prefix: string, data: any): string {
  const dataString = JSON.stringify(data)
  const hash = crypto.createHash('md5').update(dataString).digest('hex')
  return `${prefix}_${hash}.json`
}

// Get cache file path
function getCacheFilePath(cacheKey: string): string {
  return path.join(CACHE_DIR, cacheKey)
}

// Check if cache entry is still valid
function isCacheValid(filePath: string, ttl: number): boolean {
  try {
    const stats = fs.statSync(filePath)
    const age = Date.now() - stats.mtimeMs
    return age < ttl
  } catch {
    return false
  }
}

/**
 * Get cached data if it exists and is still valid
 * @param prefix - Cache key prefix (e.g., 'pvwatts', 'geocode')
 * @param params - Parameters used to generate unique cache key
 * @param ttl - Time to live in milliseconds (default: 24 hours)
 * @returns Cached data or null if not found/expired
 */
export function getCache<T>(prefix: string, params: any, ttl: number = DEFAULT_TTL): T | null {
  if (!CACHE_ENABLED) {
    return null
  }

  try {
    ensureCacheDir()
    const cacheKey = generateCacheKey(prefix, params)
    const filePath = getCacheFilePath(cacheKey)

    // Check if cache file exists and is valid
    if (fs.existsSync(filePath) && isCacheValid(filePath, ttl)) {
      const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      console.log(`[Cache HIT] ${prefix}:`, Object.keys(params).join(', '))
      return cacheData as T
    }

    console.log(`[Cache MISS] ${prefix}:`, Object.keys(params).join(', '))
    return null
  } catch (error) {
    console.error('[Cache Error] Failed to read cache:', error)
    return null
  }
}

/**
 * Save data to cache
 * @param prefix - Cache key prefix
 * @param params - Parameters used to generate unique cache key
 * @param data - Data to cache
 */
export function setCache(prefix: string, params: any, data: any): void {
  if (!CACHE_ENABLED) {
    return
  }

  try {
    ensureCacheDir()
    const cacheKey = generateCacheKey(prefix, params)
    const filePath = getCacheFilePath(cacheKey)

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`[Cache SET] ${prefix}:`, Object.keys(params).join(', '))
  } catch (error) {
    console.error('[Cache Error] Failed to write cache:', error)
  }
}

/**
 * Clear all cache or specific prefix
 * @param prefix - Optional prefix to clear only specific cache entries
 */
export function clearCache(prefix?: string): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return
    }

    const files = fs.readdirSync(CACHE_DIR)
    let cleared = 0

    for (const file of files) {
      if (!prefix || file.startsWith(prefix)) {
        fs.unlinkSync(path.join(CACHE_DIR, file))
        cleared++
      }
    }

    console.log(`[Cache CLEAR] Cleared ${cleared} cache entries${prefix ? ` for prefix: ${prefix}` : ''}`)
  } catch (error) {
    console.error('[Cache Error] Failed to clear cache:', error)
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { files: number; size: number; enabled: boolean } {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return { files: 0, size: 0, enabled: CACHE_ENABLED }
    }

    const files = fs.readdirSync(CACHE_DIR)
    let totalSize = 0

    for (const file of files) {
      const stats = fs.statSync(path.join(CACHE_DIR, file))
      totalSize += stats.size
    }

    return {
      files: files.length,
      size: totalSize,
      enabled: CACHE_ENABLED
    }
  } catch {
    return { files: 0, size: 0, enabled: CACHE_ENABLED }
  }
}

/**
 * Wrapper function to cache API calls automatically
 * @param prefix - Cache key prefix
 * @param params - Parameters for cache key
 * @param fetcher - Function that fetches the data
 * @param ttl - Time to live in milliseconds
 */
export async function withCache<T>(
  prefix: string,
  params: any,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = getCache<T>(prefix, params, ttl)
  if (cached !== null) {
    return cached
  }

  // If not in cache, fetch the data
  const data = await fetcher()

  // Save to cache for next time
  setCache(prefix, params, data)

  return data
}

// Export cache status for debugging
export const cacheInfo = {
  enabled: CACHE_ENABLED,
  directory: CACHE_DIR,
  defaultTTL: DEFAULT_TTL
}

