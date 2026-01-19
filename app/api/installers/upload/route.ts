// API route for uploading installer files to Supabase Storage
// Uses service role key to bypass RLS policies

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string | null) || 'installers'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Missing file' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      return NextResponse.json(
        { success: false, error: `File is too large (${fileSizeMB}MB). Maximum size is 5MB.` },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'pdf'
    const uniqueFileName = `${timestamp}-${sanitizedFileName}.${extension}`
    const filePath = `${folder}/${uniqueFileName}`

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage using service role (bypasses RLS)
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath)

    const url = publicUrlData.publicUrl

    return NextResponse.json({
      success: true,
      data: { url, path: filePath },
    })
  } catch (error: any) {
    console.error('Error in installer upload API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
