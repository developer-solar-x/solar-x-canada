// API route to save partial leads with email

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, estimatorData, currentStep } = body

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if this email already has saved drafts.
    // We allow MULTIPLE partial leads per email (e.g. HRS + Net Metering),
    // so we look for an existing draft that matches the same flow
    // (estimatorMode + programType + leadType). If none match, we create a new row.
    const { data: existingDrafts, error: checkError } = await supabase
      .from('partial_leads_v3')
      .select('id, estimator_data')
      .eq('email', email)

    if (checkError) {
      console.error('Error checking for existing drafts:', checkError)
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

      const { error: updateError } = await supabase
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
          map_snapshot_url: estimatorData?.mapSnapshot || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingForFlow.id)

      if (updateError) {
        console.error('Error updating partial lead:', updateError)
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
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

      const { data, error: insertError } = await supabase
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
          map_snapshot_url: estimatorData?.mapSnapshot || '',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error saving partial lead:', insertError)
        return NextResponse.json(
          { error: 'Failed to save progress' },
          { status: 500 }
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
      { error: 'Internal server error' },
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

