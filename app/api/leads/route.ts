// Lead submission and management API

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const {
      // Contact information
      fullName,
      email,
      phone,
      preferredContactTime,
      preferredContactMethod,
      comments,
      
      // Property details
      address,
      city,
      province,
      postalCode,
      coordinates,
      
      // Roof information
      roofPolygon,
      roofAreaSqft,
      roofType,
      roofAge,
      roofPitch,
      shadingLevel,
      appliances,
      
      // Energy information
      monthlyBill,
      annualUsageKwh,
      
      // Estimate data
      estimateData,
      systemSizeKw,
      estimatedCost,
      netCostAfterIncentives,
      annualSavings,
      paybackYears,
      annualProductionKwh,
      
      // Source tracking
      source = 'estimator'
    } = body

    // Validate required fields
    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, phone' },
        { status: 400 }
      )
    }

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()

    // Insert lead into database
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        // Contact
        full_name: fullName,
        email,
        phone,
        preferred_contact_time: preferredContactTime,
        preferred_contact_method: preferredContactMethod,
        comments,
        
        // Property
        address,
        city,
        province: province || 'ON',
        postal_code: postalCode,
        coordinates,
        
        // Roof
        roof_polygon: roofPolygon,
        roof_area_sqft: roofAreaSqft,
        roof_type: roofType,
        roof_age: roofAge,
        roof_pitch: roofPitch,
        shading_level: shadingLevel,
        appliances,
        
        // Energy
        monthly_bill: monthlyBill,
        annual_usage_kwh: annualUsageKwh,
        
        // Estimate
        estimate_data: estimateData,
        system_size_kw: systemSizeKw,
        estimated_cost: estimatedCost,
        net_cost_after_incentives: netCostAfterIncentives,
        annual_savings: annualSavings,
        payback_years: paybackYears,
        annual_production_kwh: annualProductionKwh,
        
        // Status
        status: 'new',
        
        // Source
        source,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save lead', details: insertError.message },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('lead_activities')
      .insert({
        lead_id: lead.id,
        activity_type: 'status_change',
        activity_data: { status: 'new', source },
      })

    // Queue HubSpot sync (async, don't wait for response)
    if (process.env.HUBSPOT_ACCESS_TOKEN) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/hubspot/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      }).catch(err => console.error('HubSpot sync queue error:', err))
    }

    // Return success with lead ID
    return NextResponse.json({
      success: true,
      data: {
        leadId: lead.id,
        message: 'Your estimate has been saved successfully!'
      }
    })

  } catch (error) {
    console.error('Lead submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint for fetching leads (admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Execute query
    const { data: leads, error, count } = await query

    if (error) {
      throw error
    }

    // Return paginated results
    return NextResponse.json({
      success: true,
      data: {
        leads,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        }
      }
    })

  } catch (error) {
    console.error('Leads fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

