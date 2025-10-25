#!/usr/bin/env node

// Script to clear API cache from command line

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CACHE_DIR = path.join(__dirname, '..', '.cache')

function clearCache(prefix) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      console.log('No cache directory found.')
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

    console.log(`✓ Cleared ${cleared} cache entries${prefix ? ` for prefix: ${prefix}` : ''}`)
  } catch (error) {
    console.error('✗ Failed to clear cache:', error.message)
    process.exit(1)
  }
}

// Get prefix from command line arguments
const prefix = process.argv[2]

if (prefix) {
  console.log(`Clearing cache for prefix: ${prefix}`)
  clearCache(prefix)
} else {
  console.log('Clearing all cache...')
  clearCache()
}

