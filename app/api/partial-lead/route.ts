// API route to save partial leads with email

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables not configured')
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, estimatorData, currentStep } = body

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client with timeout configuration
    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-client-info': 'solar-x-calculator',
        },
        fetch: (url, options = {}) => {
          // Add timeout to Supabase requests (10 seconds)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => {
            clearTimeout(timeoutId)
          })
        },
      },
    })

    // Check if this email already has saved drafts.
    // We allow MULTIPLE partial leads per email (e.g. HRS + Net Metering),
    // so we look for an existing draft that matches the same flow
    // (estimatorMode + programType + leadType). If none match, we create a new row.
    let existingDrafts: any[] | null = null
    let checkError: any = null
    
    try {
      const result = await Promise.race([
        supabase
          .from('partial_leads_v3')
          .select('id, estimator_data')
          .eq('email', email),
        new Promise<{ data: null; error: { message: 'Timeout' } }>((_, reject) =>
          setTimeout(() => reject({ data: null, error: { message: 'Database query timeout' } }), 8000)
        ),
      ]) as { data: any[] | null; error: any }
      
      existingDrafts = result.data
      checkError = result.error
    } catch (timeoutError) {
      console.error('Database connection timeout when checking for existing drafts:', timeoutError)
      checkError = { message: 'Connection timeout', code: 'TIMEOUT' }
    }

    if (checkError) {
      console.error('Error checking for existing drafts:', checkError)
      // If we can't check for existing drafts, we can still try to insert
      // but log the error for debugging
    }

    const flowKey = [
      estimatorData?.estimatorMode || '',
      estimatorData?.programType || '',
      estimatorData?.leadType || '',
    ].join('|')

    let existingForFlow: { id: string } | null = null

    if (Array.isArray(existingDrafts) && existingDrafts.length > 0) {
      // Try to find a draft for the same flow signature
      existingForFlow =
        existingDrafts.find((row: any) => {
          const ed = row.estimator_data || {}
          const rowKey = [
            ed.estimatorMode || '',
            ed.programType || '',
            ed.leadType || '',
          ].join('|')
          return rowKey === flowKey
        }) || null

      // Backwards compatibility: if no flow metadata, fall back to first record
      if (!existingForFlow && !estimatorData?.programType && !estimatorData?.estimatorMode && !estimatorData?.leadType) {
        existingForFlow = existingDrafts[0] as any
      }
    }

    if (existingForFlow) {
      // Update existing draft for this specific flow
      // Extract photo URLs (if estimatorData contains photos array with url fields)
      const photoUrls = Array.isArray(estimatorData?.photos)
        ? estimatorData.photos.map((p: any) => p.url || p.uploadedUrl || p.preview).filter(Boolean)
        : null

      // Limit map snapshot size to prevent database errors (max 2MB base64 = ~1.5MB binary)
      let mapSnapshotUrl = estimatorData?.mapSnapshot || ''
      if (mapSnapshotUrl && mapSnapshotUrl.length > 2 * 1024 * 1024) {
        console.warn('Map snapshot too large, truncating for database storage')
        mapSnapshotUrl = mapSnapshotUrl.substring(0, 2 * 1024 * 1024)
      }

      let updateError: any = null
      try {
        const result = await Promise.race([
          supabase
            .from('partial_leads_v3')
            .update({
              estimator_data: estimatorData,
              current_step: currentStep,
              // denormalized for quick filters (best-effort extractions)
              address: estimatorData?.address || '',
              coordinates: estimatorData?.coordinates || {},
              rate_plan: estimatorData?.peakShaving?.ratePlan || '',
              roof_area_sqft: estimatorData?.roofAreaSqft ?? 0,
              monthly_bill: estimatorData?.monthlyBill ?? 0,
              annual_usage_kwh: estimatorData?.annualUsageKwh || estimatorData?.energyUsage?.annualKwh || 0,
              selected_add_ons: estimatorData?.selectedAddOns || [],
              photo_count: Array.isArray(estimatorData?.photos) ? estimatorData.photos.length : (estimatorData?.photoCount ?? (photoUrls ? photoUrls.length : 0)),
              photo_urls: photoUrls || [],
              map_snapshot_url: mapSnapshotUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingForFlow.id),
          new Promise<{ error: { message: string } }>((_, reject) =>
            setTimeout(() => reject({ error: { message: 'Database update timeout' } }), 8000)
          ),
        ]) as { error: any }
        
        updateError = result.error
      } catch (timeoutError) {
        console.error('Database connection timeout when updating partial lead:', timeoutError)
        updateError = { message: 'Connection timeout - Supabase may be unreachable', code: 'TIMEOUT' }
      }

      if (updateError) {
        console.error('Error updating partial lead:', updateError)
        // Return a more user-friendly error message
        const isTimeout = updateError.code === 'TIMEOUT' || updateError.message?.includes('timeout')
        return NextResponse.json(
          { 
            error: isTimeout ? 'Database connection timeout' : 'Failed to update progress', 
            details: updateError.message || 'Database error',
            retry: isTimeout // Suggest retry for timeouts
          },
          { status: isTimeout ? 504 : 500 } // 504 Gateway Timeout for timeouts
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Progress updated',
        id: existingForFlow.id,
      })
    } else {
      // Create new draft
      // Extract photo URLs (if estimatorData contains photos array with url fields)
      const photoUrlsNew = Array.isArray(estimatorData?.photos)
        ? estimatorData.photos.map((p: any) => p.url || p.uploadedUrl || p.preview).filter(Boolean)
        : null

      // Limit map snapshot size to prevent database errors (max 2MB base64 = ~1.5MB binary)
      let mapSnapshotUrlNew = estimatorData?.mapSnapshot || ''
      if (mapSnapshotUrlNew && mapSnapshotUrlNew.length > 2 * 1024 * 1024) {
        console.warn('Map snapshot too large, truncating for database storage')
        mapSnapshotUrlNew = mapSnapshotUrlNew.substring(0, 2 * 1024 * 1024)
      }

      let insertData: any = null
      let insertError: any = null
      
      try {
        const result = await Promise.race([
          supabase
            .from('partial_leads_v3')
            .insert({
              email,
              estimator_data: estimatorData,
              current_step: currentStep,
              address: estimatorData?.address || '',
              coordinates: estimatorData?.coordinates || {},
              rate_plan: estimatorData?.peakShaving?.ratePlan || '',
              roof_area_sqft: estimatorData?.roofAreaSqft ?? 0,
              monthly_bill: estimatorData?.monthlyBill ?? 0,
              annual_usage_kwh: estimatorData?.annualUsageKwh || estimatorData?.energyUsage?.annualKwh || 0,
              selected_add_ons: estimatorData?.selectedAddOns || [],
              photo_count: Array.isArray(estimatorData?.photos) ? estimatorData.photos.length : (estimatorData?.photoCount ?? (photoUrlsNew ? photoUrlsNew.length : 0)),
              photo_urls: photoUrlsNew || [],
              map_snapshot_url: mapSnapshotUrlNew,
            })
            .select()
            .single(),
          new Promise<{ data: null; error: { message: string } }>((_, reject) =>
            setTimeout(() => reject({ data: null, error: { message: 'Database insert timeout' } }), 8000)
          ),
        ]) as { data: any; error: any }
        
        insertData = result.data
        insertError = result.error
      } catch (timeoutError) {
        console.error('Database connection timeout when inserting partial lead:', timeoutError)
        insertError = { message: 'Connection timeout - Supabase may be unreachable', code: 'TIMEOUT' }
      }

      if (insertError) {
        console.error('Error saving partial lead:', insertError)
        // Return a more user-friendly error message
        const isTimeout = insertError.code === 'TIMEOUT' || insertError.message?.includes('timeout')
        return NextResponse.json(
          { 
            error: isTimeout ? 'Database connection timeout' : 'Failed to save progress', 
            details: insertError.message || 'Database error',
            retry: isTimeout // Suggest retry for timeouts
          },
          { status: isTimeout ? 504 : 500 } // 504 Gateway Timeout for timeouts
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Progress saved',
        id: data.id,
      })
    }
  } catch (error) {
    console.error('Error in partial-lead API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET: Retrieve partial leads (all or by email)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const supabase = createClient(supabaseUrl, supabaseKey)

    // If email is provided, return single partial lead
    if (email) {
      const { data, error } = await supabase
        .from('partial_leads_v3')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'No saved progress found' },
            { status: 404 }
          )
        }
        console.error('Error retrieving partial lead:', error)
        return NextResponse.json(
          { error: 'Failed to retrieve progress' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data,
      })
    }

    // Otherwise, return list of partial leads
    let query = supabase
      .from('partial_leads_v3')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply search filter if provided
    if (search) {
      query = query.or(`email.ilike.%${search}%,address.ilike.%${search}%`)
    }

    const { data: partialLeads, error, count } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        partialLeads: partialLeads || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        }
      }
    })
  } catch (error) {
    console.error('Error in GET partial-lead:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

