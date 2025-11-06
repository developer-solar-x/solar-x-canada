import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST /api/upload-photo
// Accepts multipart/form-data with fields:
// - file: File (required)
// - category: string (optional)
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string | null) || 'general'

    if (!file) {
      return NextResponse.json({ success: false, error: 'Missing file' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Generate a path: photos/{category}/{YYYY}/{MM}/{uuid}-{filename}
    const now = new Date()
    const year = String(now.getFullYear())
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const random = Math.random().toString(36).slice(2)
    const safeName = (file.name || 'photo')
      .replace(/[^a-zA-Z0-9_.-]/g, '_')
      .slice(-64) // keep tail to preserve extension
    const path = `photos/${category}/${year}/${month}/${random}-${safeName}`

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to the 'photos' bucket
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, buffer, {
        cacheControl: '3600',
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
    }

    // Get public URL (bucket must be public or use signed URL if private)
    const { data: publicUrlData } = supabase.storage
      .from('photos')
      .getPublicUrl(path)

    const url = publicUrlData.publicUrl

    return NextResponse.json({ success: true, data: { url, path, category } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Upload handler error:', err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

