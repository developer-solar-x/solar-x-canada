// Quick Estimate Partial Lead API - Save progress during quick estimate flow
// This saves partial data as users progress through the 4-step flow

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
    const { email, step, data } = body

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Try to save to quick_estimate_partial_leads table first
    // If it doesn't exist, fall back to partial_leads_v3
    let saveError: any = null
    let savedId: string | null = null

    // Check if quick estimate partial lead already exists for this email
    const { data: existing, error: checkError } = await supabase
      .from('quick_estimate_partial_leads')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116' && checkError.code !== '42P01') {
      // Table might not exist, try partial_leads_v3
      console.log('quick_estimate_partial_leads table not found, using partial_leads_v3')

      // Check partial_leads_v3
      const { data: existingV3 } = await supabase
        .from('partial_leads_v3')
        .select('id')
        .eq('email', email)
        .eq('estimator_data->>programType', 'quick')
        .maybeSingle()

      if (existingV3) {
        // Update existing
        const { error: updateError } = await supabase
          .from('partial_leads_v3')
          .update({
            estimator_data: {
              ...data,
              programType: 'quick',
              estimatorMode: 'quick',
            },
            current_step: step,
            address: data.address || '',
            coordinates: data.coordinates || {},
            roof_area_sqft: data.roofAreaSqft || 0,
            monthly_bill: data.monthlyBill || 0,
            annual_usage_kwh: data.annualUsageKwh || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingV3.id)

        saveError = updateError
        savedId = existingV3.id
      } else {
        // Insert new
        const { data: inserted, error: insertError } = await supabase
          .from('partial_leads_v3')
          .insert({
            email,
            estimator_data: {
              ...data,
              programType: 'quick',
              estimatorMode: 'quick',
            },
            current_step: step,
            address: data.address || '',
            coordinates: data.coordinates || {},
            roof_area_sqft: data.roofAreaSqft || 0,
            monthly_bill: data.monthlyBill || 0,
            annual_usage_kwh: data.annualUsageKwh || 0,
          })
          .select('id')
          .single()

        saveError = insertError
        savedId = inserted?.id || null
      }
    } else {
      // quick_estimate_partial_leads table exists
      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('quick_estimate_partial_leads')
          .update({
            step,
            data,
            address: data.address || '',
            city: data.city || '',
            province: data.province || '',
            coordinates: data.coordinates || {},
            roof_area_sqft: data.roofAreaSqft || 0,
            monthly_bill: data.monthlyBill || 0,
            annual_usage_kwh: data.annualUsageKwh || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        saveError = updateError
        savedId = existing.id
      } else {
        // Insert new
        const { data: inserted, error: insertError } = await supabase
          .from('quick_estimate_partial_leads')
          .insert({
            email,
            step,
            data,
            address: data.address || '',
            city: data.city || '',
            province: data.province || '',
            coordinates: data.coordinates || {},
            roof_area_sqft: data.roofAreaSqft || 0,
            monthly_bill: data.monthlyBill || 0,
            annual_usage_kwh: data.annualUsageKwh || 0,
          })
          .select('id')
          .single()

        // If table doesn't exist, fall back to partial_leads_v3
        if (insertError && insertError.code === '42P01') {
          const { data: insertedV3, error: insertErrorV3 } = await supabase
            .from('partial_leads_v3')
            .insert({
              email,
              estimator_data: {
                ...data,
                programType: 'quick',
                estimatorMode: 'quick',
              },
              current_step: step,
              address: data.address || '',
              coordinates: data.coordinates || {},
              roof_area_sqft: data.roofAreaSqft || 0,
              monthly_bill: data.monthlyBill || 0,
              annual_usage_kwh: data.annualUsageKwh || 0,
            })
            .select('id')
            .single()

          saveError = insertErrorV3
          savedId = insertedV3?.id || null
        } else {
          saveError = insertError
          savedId = inserted?.id || null
        }
      }
    }

    if (saveError) {
      console.error('Error saving quick partial lead:', saveError)
      return NextResponse.json(
        { error: 'Failed to save progress', details: saveError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Progress saved',
      id: savedId,
    })

  } catch (error) {
    console.error('Quick partial lead API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET: Retrieve partial lead by email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Try quick_estimate_partial_leads first
    let { data, error } = await supabase
      .from('quick_estimate_partial_leads')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    // If table doesn't exist or no data, try partial_leads_v3
    if (error?.code === '42P01' || (!data && !error)) {
      const result = await supabase
        .from('partial_leads_v3')
        .select('*')
        .eq('email', email)
        .eq('estimator_data->>programType', 'quick')
        .maybeSingle()

      data = result.data
      error = result.error
    }

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No saved progress found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to retrieve progress' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No saved progress found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })

  } catch (error) {
    console.error('Quick partial lead GET error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
