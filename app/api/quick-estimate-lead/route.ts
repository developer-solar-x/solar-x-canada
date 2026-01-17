// Quick Estimate Lead API - Save completed quick estimate leads
// This saves the final lead after the user completes all 4 steps

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendInternalNotificationEmail } from '@/lib/internal-email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      // Contact info
      fullName,
      email,
      phone,
      comments,
      consent,

      // Location
      address,
      coordinates,
      city,
      province,

      // Property
      roofAreaSqft,
      roofSizePreset,
      shadingLevel,
      roofOrientation,
      roofAzimuth,

      // Energy
      monthlyBill,
      annualUsageKwh,

      // Estimate
      estimate,

      // Photos
      photoUrls,

      // Meta
      source = 'quick_estimate',
      programType = 'quick',
      estimatorMode = 'easy', // Database constraint only allows 'easy' or 'detailed', not 'quick'
    } = body

    // Ensure estimatorMode is valid for database constraint (convert 'quick' to 'easy')
    const validEstimatorMode = estimatorMode === 'quick' ? 'easy' : (estimatorMode === 'detailed' ? 'detailed' : 'easy')

    // Validate required fields
    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, phone' },
        { status: 400 }
      )
    }

    if (!address || !coordinates) {
      return NextResponse.json(
        { error: 'Missing location data' },
        { status: 400 }
      )
    }

    // Get Supabase admin client
    const supabase = getSupabaseAdmin()

    // Build insert data for hrs_residential_leads table
    const insertData: any = {
      // Contact
      full_name: fullName,
      email,
      phone: phone.replace(/\D/g, ''), // Store digits only
      comments,
      consent: consent || false,

      // Property
      address,
      coordinates,
      city: city || '',
      province: province || 'ON',

      // Roof
      roof_area_sqft: roofAreaSqft || 0,
      shading_level: shadingLevel || 'none',
      roof_azimuth: roofAzimuth || 180,

      // Energy
      monthly_bill: monthlyBill || 0,
      annual_usage_kwh: annualUsageKwh || 0,

      // System estimates
      system_size_kw: estimate?.systemSizeKw || 0,
      num_panels: estimate?.numPanels || 0,
      production_annual_kwh: estimate?.annualProductionKwh || 0,
      production_monthly_kwh: estimate?.monthlyProductionKwh || [],

      // Cost/Savings
      system_cost: estimate?.estimatedCost || 0,
      net_cost: estimate?.netCost || 0,
      tou_annual_savings: estimate?.annualSavings || 0,
      tou_monthly_savings: estimate?.monthlySavings || 0,
      tou_payback_period: estimate?.paybackYears || 0,

      // Environmental
      co2_offset_tons_per_year: estimate?.co2OffsetTons || 0,

      // Photos
      photo_urls: photoUrls || [],

      // Meta
      estimator_mode: validEstimatorMode, // Use validated mode (converts 'quick' to 'easy')
      program_type: programType,
      lead_type: 'residential',
      status: 'new',

      // Store full data for reference
      full_data_json: {
        fullName,
        email,
        phone,
        address,
        city,
        province,
        coordinates,
        roofAreaSqft,
        roofSizePreset,
        shadingLevel,
        roofOrientation,
        roofAzimuth,
        monthlyBill,
        annualUsageKwh,
        estimate,
        photoUrls,
        source,
        programType,
        estimatorMode: validEstimatorMode, // Store validated mode in full_data_json
        consent,
        comments,
        submittedAt: new Date().toISOString(),
      },
    }

    // Insert lead into database
    const { data: lead, error: insertError } = await supabase
      .from('hrs_residential_leads')
      .insert(insertData)
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
    try {
      await supabase
        .from('lead_activities_v3')
        .insert({
          lead_id: lead.id,
          activity_type: 'status_change',
          activity_data: { status: 'new', source: 'quick_estimate' },
        })
    } catch (activityError) {
      console.warn('Failed to log activity:', activityError)
    }

    // Send internal notification (async, fire-and-forget)
    ;(async () => {
      try {
        const subject = `Quick Estimate Lead: ${fullName} - ${city || 'Unknown'}, ${province || '??'}`

        const textLines: string[] = []
        textLines.push(`Lead ID: ${lead.id}`)
        textLines.push(`Source: Quick Estimate`)
        textLines.push(`Name: ${fullName}`)
        textLines.push(`Email: ${email}`)
        textLines.push(`Phone: ${phone}`)
        textLines.push(`Address: ${address}`)
        textLines.push(`City/Province: ${city || 'N/A'}, ${province || 'N/A'}`)
        textLines.push('')
        textLines.push('--- Estimate ---')
        textLines.push(`System Size: ${estimate?.systemSizeKw || 0} kW`)
        textLines.push(`Panels: ${estimate?.numPanels || 0}`)
        textLines.push(`Annual Production: ${estimate?.annualProductionKwh?.toLocaleString() || 0} kWh`)
        textLines.push(`Net Cost: $${estimate?.netCost?.toLocaleString() || 0}`)
        textLines.push(`Annual Savings: $${estimate?.annualSavings?.toLocaleString() || 0}`)
        textLines.push(`Payback: ${estimate?.paybackYears || 0} years`)
        textLines.push('')
        textLines.push(`Admin link: ${process.env.NEXT_PUBLIC_APP_URL || ''}/admin/leads/${lead.id}`)

        await sendInternalNotificationEmail({
          subject,
          text: textLines.join('\n'),
        })
      } catch (err) {
        console.error('Internal notification email error:', err)
      }
    })()

    // Queue HubSpot sync if configured
    if (process.env.HUBSPOT_ACCESS_TOKEN) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/hubspot/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      }).catch(err => console.error('HubSpot sync queue error:', err))
    }

    // Delete partial lead for this email (cleanup)
    try {
      await supabase
        .from('quick_estimate_partial_leads')
        .delete()
        .eq('email', email)
    } catch (deleteError) {
      // Ignore errors - partial lead table might not exist
    }

    return NextResponse.json({
      success: true,
      data: {
        leadId: lead.id,
        message: 'Your quote request has been submitted successfully!'
      }
    })

  } catch (error) {
    console.error('Quick estimate lead API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit lead',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
